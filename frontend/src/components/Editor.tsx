import { useEffect, useRef } from "react";
import { useDebounceFn, useKeyPress } from "ahooks";
import { v4 as uuidv4 } from 'uuid';
import Vditor from 'vditor';
import 'vditor/dist/index.css';
import { useNotifications } from "@toolpad/core/useNotifications";
import { useEvent } from "@/contexts/EvenContext";
import { useEditor } from "@/contexts/EditorContext";
import { useTranslation } from "@/contexts/I18nContext";
import { historyStack } from "@/utils/histroyStack";


// 提取第一个一级标题作为笔记标题
const extractTitle = (markdown: string): string | undefined => {
    const match = markdown.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : undefined;
};

// 把 md 拆分为标题（开头的一级标题）+ 正文
const splitContent = (content: string): { title: string; body: string } => {
    const match = content.match(/^\s*#\s+([^\n]+)(\n+|$)/);
    if (match) {
        return { title: match[1].trim(), body: content.slice(match[0].length) };
    }
    return { title: '', body: content };
};

// 标题 + 正文合并回 md（标题即文件中的一级标题，保证 md 为事实来源）
const combineContent = (title: string, body: string): string => {
    const trimmedTitle = title.trim();
    return trimmedTitle ? `# ${trimmedTitle}\n\n${body}` : body;
};

// 把 .asset 相对路径转换为自定义协议地址（主进程 draftx-asset:// 映射到 notes 目录，
// dev 的 http 环境与生产的 file:// 环境均可加载，避免 file:// 被 Chromium 拦截）
const toFileUrl = (relPath: string): string => {
    const rel = relPath.replace(/^\.?\//, '');
    return `draftx-asset://notes/${rel}`;
};

const ASSET_SRC_RE = /^\.?\/?\.asset\//;

/**
 * 内容编辑器（Vditor）
 */
const Editor: React.FC = () => {

    const currentUuidRef = useRef<string>('');
    const lastSavedRef = useRef<string>(''); // 上次已保存的 markdown 原文
    const titleInputRef = useRef<HTMLInputElement>(null); // 标题输入框
    const containerRef = useRef<HTMLDivElement>(null);

    const notification = useNotifications();
    const { vditorRef } = useEditor();
    const { loadStickys$, handleOnclickTool$ } = useEvent();
    const { t, currentLanguage } = useTranslation();
    const isMac = window.electronUtils?.platform === 'darwin' || /macintosh|mac os x/i.test(navigator.userAgent);

    const setUuid = (uuid: string) => {
        currentUuidRef.current = uuid;
    };

    // 重写编辑器内 .asset 相对路径图片为自定义协议地址
    const rewriteImages = () => {
        const container = containerRef.current;
        if (!container) return;
        container.querySelectorAll('img').forEach((img) => {
            const raw = img.getAttribute('src') || '';
            if (ASSET_SRC_RE.test(raw)) {
                img.src = toFileUrl(raw);
            }
        });
    };

    // 预览模式下同样重写图片地址
    const transformPreviewHtml = (html: string): string => {
        return html.replace(/src="(\.?\/?\.asset\/[^"]+)"/g, (_m, rel) => `src="${toFileUrl(rel)}"`);
    };

    // 立即保存当前内容（标题 + 正文合并为 md）
    const saveNow = () => {
        const vditor = vditorRef.current;
        const uuid = currentUuidRef.current;
        if (!vditor || !uuid) return;
        const title = titleInputRef.current?.value ?? '';
        const body = vditor.getValue();
        const content = combineContent(title, body);
        // 若无变更则跳过
        if (content === lastSavedRef.current) return;
        try {
            window.electronAPI.saveSticky({
                uuid,
                title: title.trim() || extractTitle(body),
                content,
            });
            lastSavedRef.current = content;
        } catch (error) {
            const msg = error instanceof Error ? error.message : '保存失败';
            console.error(msg);
        }
    };

    // 防抖保存
    const AUTOSAVE_WAIT_MS = 200;
    const { run: scheduleSave, cancel: cancelSave } = useDebounceFn(
        saveNow,
        { wait: AUTOSAVE_WAIT_MS }
    );

    // 加载笔记到编辑器（载荷中没有 content 时再取一次正文）
    const loadDraft = async (draft: DraftResult) => {
        let content = draft.content;
        if (content === undefined) {
            const full = await window.electronAPI.getDraftByUuid(draft.uuid);
            content = full?.content ?? '';
        }
        const vditor = vditorRef.current;
        if (!vditor) return;
        const { title, body } = splitContent(content);
        if (titleInputRef.current) {
            titleInputRef.current.value = title;
        }
        lastSavedRef.current = content;
        vditor.setValue(body);
        rewriteImages();
        setUuid(draft.uuid);
        window.electronAPI.setConfig({ key: 'currentUuid', value: draft.uuid, type: 'string' });
        historyStack.push(draft.uuid);
    };

    // 新建草稿
    const addNewDraft = () => {
        const vditor = vditorRef.current;
        // 立即保存当前内容（取消挂起的防抖，避免串到新笔记）
        cancelSave();
        saveNow();
        const uuid = uuidv4();
        historyStack.push(uuid);
        window.electronAPI.setConfig({ key: 'currentUuid', value: uuid, type: 'string' });
        setUuid(uuid);
        lastSavedRef.current = '';
        if (titleInputRef.current) {
            titleInputRef.current.value = '';
        }
        vditor?.setValue('');

        notification.show('The previous draft has been saved', {
            severity: 'success',
        });
    };

    // 导出 Markdown（标题 + 正文合并）
    const exportMarkdown = () => {
        const vditor = vditorRef.current;
        if (!vditor) return;
        const title = titleInputRef.current?.value ?? '';
        const markdown = combineContent(title, vditor.getValue());
        window.electronAPI.saveMarkdown(markdown, extractTitle(markdown)).then(res => {
            if (res.success) {
                notification.show('Export successful', {
                    severity: 'success',
                });
            } else if (res.message !== 'Canceled') {
                notification.show(res.message || 'Export failed', {
                    severity: 'error',
                });
            }
        });
    };

    // 初始化：读取上次的草稿，没有则新建
    const initDraft = async () => {
        const uuid = await window.electronAPI.getConfig('currentUuid');
        if (uuid) {
            const draft = await window.electronAPI.getDraftByUuid(uuid);
            console.log('读取缓存草稿', draft);
            if (draft) {
                const content = draft.content ?? '';
                const { title, body } = splitContent(content);
                if (titleInputRef.current) {
                    titleInputRef.current.value = title;
                }
                lastSavedRef.current = content;
                vditorRef.current?.setValue(body);
                rewriteImages();
                setUuid(uuid);
                historyStack.push(uuid);
                return;
            }
        }
        // 当前没有草稿，则生成新的uuid
        const newUuid = uuidv4();
        setUuid(newUuid);
        window.electronAPI.setConfig({ key: 'currentUuid', value: newUuid, type: 'string' });
    };

    // 未完成引导时展示引导笔记
    const showGuideMemo = async () => {
        const isFinishGuide = await window.electronAPI.getConfig('isFinishGuide');
        if (isFinishGuide) return;
        const guideMemo = await window.electronAPI.getDraftByUuid('guide');
        if (!guideMemo) return;
        await loadDraft(guideMemo);
        // 设置为已引导
        window.electronAPI.setConfig({ key: 'isFinishGuide', value: true, type: 'boolean' });
    };

    // 版本更新时展示更新说明
    const showUpdateMemo = async () => {
        // 通过将更新后的版本号与数据库版本号（之前的版本作对比）
        const currentVesion = await window.electronAPI.getAppVersion();
        console.log('当前版本', currentVesion);
        const oldVersion = await window.electronAPI.getConfig('version') as string;
        // 如果数据库没版本号，则代表新用户
        if (!oldVersion) {
            window.electronAPI.setConfig({ key: 'version', value: currentVesion, type: 'string' });
            return;
        }
        if (currentVesion !== oldVersion) {
            const updateMemo = await window.electronAPI.getDraftByUuid('update');
            if (!updateMemo) return;
            await loadDraft(updateMemo);
            // 设置当前版本号覆盖数据库版本号
            window.electronAPI.setConfig({ key: 'version', value: currentVesion, type: 'string' });
        }
    };

    // 初始化 Vditor
    useEffect(() => {
        let destroyed = false;
        let observer: MutationObserver | null = null;

        // 每次挂载创建独立的挂载节点（Vditor 异步初始化完成时会 innerHTML='' 重建，
        // StrictMode 双挂载下若共用容器，旧实例会清空新实例的内容）
        const mountNode = document.createElement('div');
        mountNode.className = 'draftx-vditor h-full';
        containerRef.current!.appendChild(mountNode);

        const vditor = new Vditor(mountNode, {
            mode: 'ir',
            cdn: './vditor',
            cache: { enable: false },
            placeholder: t('app.edit.placeholder'),
            height: '100%',
            toolbar: [], // 不使用自带工具栏（使用应用底部 ToolBar）
            upload: {
                handler: async (files) => {
                    const v = vditorRef.current;
                    for (const file of files) {
                        const buf = await file.arrayBuffer();
                        const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '.png';
                        const relPath = await window.electronAPI.saveImageAsset(buf, ext);
                        v?.insertValue(`![${file.name}](${relPath})\n`);
                    }
                    return null;
                },
            },
            preview: {
                transform: transformPreviewHtml,
            },
            input: () => {
                scheduleSave();
            },
            after: () => {
                // StrictMode 双挂载：旧实例异步初始化完成时直接放弃
                // （其挂载节点已从 DOM 移除，不会干扰新实例）
                if (destroyed) return;
                vditorRef.current = vditor;
                // 同步占位符（构造时翻译可能尚未加载完成）
                const placeholderText = t('app.edit.placeholder');
                mountNode.querySelectorAll('pre.vditor-reset').forEach((pre) => {
                    pre.setAttribute('placeholder', placeholderText);
                });
                // 监听 DOM 变化，重写 .asset 图片地址（IR 模式会不断重渲染块）
                observer = new MutationObserver(() => rewriteImages());
                observer.observe(mountNode, { childList: true, subtree: true });
                // 加载草稿（引导/更新说明会覆盖当前草稿）
                initDraft();
                showGuideMemo();
                showUpdateMemo();
                rewriteImages();
            },
        });

        return () => {
            destroyed = true;
            observer?.disconnect();
            if (vditorRef.current === vditor) {
                vditorRef.current = null;
            }
            try {
                vditor.destroy();
            } catch {
                // 实例尚未完成异步初始化时 destroy 会抛错，忽略即可
            }
            // 移除本次挂载的节点（若实例尚未初始化完成，其后续异步重建只作用于这个已分离的节点）
            mountNode.remove();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 监听点击新建草稿 / 导出 Markdown
    handleOnclickTool$.useSubscription((tool) => {
        if (tool === 'addDraft') {
            addNewDraft();
        } else if (tool === 'exportMarkdown') {
            exportMarkdown();
        }
    });

    // 监听加载新的便利贴
    loadStickys$.useSubscription((sticky) => {
        console.log('加载新的便利贴', sticky);
        loadDraft(sticky);
    });

    // 注册 Alt+N（Mac ⌘N）新建便利贴
    useKeyPress(isMac ? 'meta.n' : 'alt.n', () => {
        addNewDraft();
    });

    // 翻译是异步加载的，语言就绪/切换后同步正文编辑器的占位符
    useEffect(() => {
        const text = t('app.edit.placeholder');
        containerRef.current?.querySelectorAll('pre.vditor-reset').forEach((pre) => {
            pre.setAttribute('placeholder', text);
        });
    }, [currentLanguage, t]);

    return (
        <div
            className="flex flex-col px-12 py-8"
            style={{
                height: 'calc(100vh - 64px)', // 预留底部 ToolBar 空间
            }}
        >
            {/* 标题输入（无边框无底色） */}
            <input
                ref={titleInputRef}
                className="draftx-title-input"
                placeholder={t('app.edit.titlePlaceholder')}
                onChange={() => scheduleSave()}
                onKeyDown={(e) => {
                    // 回车进入正文
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        vditorRef.current?.focus();
                    }
                }}
            />
            {/* 正文编辑器（Vditor 挂载到内部动态创建的节点上） */}
            <div
                ref={containerRef}
                className="flex-1 min-h-0 leading-relaxed"
            />
        </div>
    );
};

export default Editor;
