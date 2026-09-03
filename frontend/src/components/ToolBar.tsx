import { Divider, IconButton, Stack, Tooltip, Typography, useTheme, alpha } from "@mui/material";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
    Add as AddIcon,
    Assistant as AIChatIcon,
    GridView as AllIcon,
    Mode as DraftIcon,
    ChevronLeft as BackIcon,
    ChevronRight as ForwardIcon,
    ArrowCircleUp as UpdateIcon,
    IosShare as ExportIcon,
    FormatBold as BoldIcon,
    FormatItalic as ItalicIcon,
    Checklist as CheckListIcon,
    InsertPhoto as ImageIcon,
    Search as SearchIcon,
} from "@mui/icons-material";
import { useEvent } from "@/contexts/EvenContext";
import { useEditor } from "@/contexts/EditorContext";
import ChatInput from "./ChatInput";
import SearchPanel from "./SearchPanel";
import { useKeyPress, useRequest } from "ahooks";
import { historyStack } from "@/utils/histroyStack";
import { useTranslation } from "@/contexts/I18nContext";


interface ToolButtonProps {
    icon: ReactNode;
    className?: string;
    tip?: string;
    onClick?: () => void;
    disabled?: boolean;
}
// Icon按钮
const ToolButton: React.FC<ToolButtonProps> = ({
    icon,
    className,
    tip,
    onClick,
    disabled = false,
}) => {
    return (
        <Tooltip title={tip}>
            {/* span 包裹使禁用状态下 Tooltip 仍可用 */}
            <span>
                <IconButton size="small" className={className}
                    onClick={onClick}
                    disabled={disabled}
                    // 阻止 mousedown 默认行为，保持编辑器选区不因点击按钮而丢失
                    onMouseDown={(e) => e.preventDefault()}
                    sx={(theme) => ({
                        p: '4px',
                        color: '#867A6C',
                        '&:hover': {
                            color: '#867A6C',
                            bgcolor: alpha('#867A6C', 0.12),
                        },
                        '&.Mui-disabled': {
                            color: alpha('#867A6C', 0.3),
                        },
                        '& .MuiSvgIcon-root': {
                            fontSize: '24px',
                        },
                    })}
                >
                    {icon}
                </IconButton>
            </span>
        </Tooltip>
    )
}


interface Props {
    currentPage: 'draft' | 'list' //当前处在的页面
    setCurrentPage: (page: 'draft' | 'list') => void;
}
//主控件
const ToolBar: React.FC<Props> = ({
    currentPage,
    setCurrentPage,
}) => {

    const [active, setActive] = useState(false);
    const [isChatMode, setIsChatMode] = useState(false);
    const [isSearchMode, setIsSearchMode] = useState(false); // 站内搜索面板开关
    const [historyVersion, setHistoryVersion] = useState(0); // 历史版本号，用于刷新按钮状态
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);

    const inputRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const { handleOnclickTool$, loadStickys$ } = useEvent();
    const { vditorRef } = useEditor();
    const isMac = window.electronUtils?.platform === 'darwin' || /macintosh|mac os x/i.test(navigator.userAgent);

    // 引入 MUI 主题
    const theme = useTheme();
    // const { setMode, mode } = useColorScheme() //调用 setMode('主题色的键，例如red') 即可调用对应主题颜色
    const { t, currentLanguage } = useTranslation();

    // 检查更新
    const { data: updateInfo } = useRequest(async () => {
        return await window.electronAPI.checkForUpdates();
    });

    // 更新版本
    const handleUpdate = async () => {
        try {
            setIsDownloading(true);
            await window.electronAPI.downloadUpdate();
        } catch (error) {
            console.error('更新失败', error);
            setIsDownloading(false);
        }
    };

    // 删除当前选区内容（insertValue 在光标处插入，需先清空选区避免重复）
    const deleteCurrentSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && !selection.getRangeAt(0).collapsed) {
            selection.getRangeAt(0).deleteContents();
        }
    };

    // 用标记包裹选中文本（加粗/斜体）
    const wrapSelection = (mark: string) => {
        const vditor = vditorRef.current;
        if (!vditor) return;
        vditor.focus();
        const sel = vditor.getSelection();
        if (sel) {
            deleteCurrentSelection();
            vditor.insertValue(`${mark}${sel}${mark}`);
        } else {
            // 无选区时插入成对标记，<wbr> 会被 IR 渲染流程识别为光标锚点，使光标停留在两个标记中间
            vditor.insertValue(`${mark}<wbr>${mark}`);
        }
    };

    // 任务列表：选区逐行加 '- [ ] '，无选区则插入 '- [ ] '
    const insertList = () => {
        const vditor = vditorRef.current;
        if (!vditor) return;
        vditor.focus();
        const sel = vditor.getSelection();
        if (sel) {
            deleteCurrentSelection();
            vditor.insertValue(sel.split('\n').map((line) => `- [ ] ${line}`).join('\n'));
        } else {
            vditor.insertValue('- [ ] ');
        }
    };

    // 选择图片后保存为 .asset 并插入编辑器（与 Editor 上传逻辑一致）
    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const vditor = vditorRef.current;
        // 注意：input.files 是活的 FileList 引用，必须先拷贝再清空 value，
        // 否则 e.target.value = '' 会把 files 一并清空，导致后续循环拿不到任何文件
        const files = Array.from(e.target.files ?? []);
        e.target.value = '';
        if (!vditor || files.length === 0) return;
        vditor.focus();
        for (const file of files) {
            const buf = await file.arrayBuffer();
            const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '.png';
            const relPath = await window.electronAPI.saveImageAsset(buf, ext);
            vditor.insertValue(`![${file.name}](${relPath})\n`);
        }
    };

    // 获取工具栏按钮
    const toolButtons = useMemo<(ToolButtonProps | { isDivider: boolean })[]>(() => {
        const buttons: (ToolButtonProps | { isDivider: boolean })[] = [];

        // 开始配置toolbar
        if (currentPage === 'draft') {
            // 格式化：加粗 / 斜体 / 任务列表 / 图片 / 搜索
            buttons.push({
                icon: <BoldIcon />,
                tip: t('app.toolBar.formatBold.' + (isMac ? 'mac' : 'win')),
                onClick: () => wrapSelection('**'),
            });
            buttons.push({
                icon: <ItalicIcon />,
                tip: t('app.toolBar.formatItalic.' + (isMac ? 'mac' : 'win')),
                onClick: () => wrapSelection('*'),
            });
            buttons.push({
                icon: <CheckListIcon />,
                tip: t('app.toolBar.formatList.' + (isMac ? 'mac' : 'win')),
                onClick: insertList,
            });
            buttons.push({
                icon: <ImageIcon />,
                tip: t('app.toolBar.insertImage'),
                onClick: () => imageInputRef.current?.click(),
            });
            buttons.push({
                icon: <SearchIcon />,
                tip: t('app.toolBar.searchDrafts.' + (isMac ? 'mac' : 'win')),
                onClick: () => setIsSearchMode(true),
            });

            buttons.push({
                isDivider: true,
            });

            // 回退到上一个草稿
            buttons.push({
                icon: <BackIcon />,
                disabled: !historyStack.canBack(),
                tip: t('app.toolBar.navDraftBack.' + (isMac ? 'mac' : 'win')),
                onClick: () => handleForwardOrBack('back'),
            });

            // 前进到下一个草稿
            buttons.push({
                icon: <ForwardIcon />,
                disabled: !historyStack.canForward(),
                tip: t('app.toolBar.navDraftForward.' + (isMac ? 'mac' : 'win')),
                onClick: () => handleForwardOrBack('forward'),
            });
        }

        // 添加草稿
        buttons.push({
            icon: <AddIcon />,
            tip: t('app.toolBar.addDraft.' + (isMac ? 'mac' : 'win')),
            onClick: () => {
                setCurrentPage('draft');
                handleOnclickTool$.emit('addDraft');
            },
        });

        buttons.push({
            isDivider: true,
        });

        // 显示所有草稿与搜索
        if (currentPage === 'draft') {
            buttons.push({
                icon: <AllIcon />,
                tip: t('app.toolBar.showAllDrafts'),
                onClick: () => setCurrentPage('list'),
            });

            // 导出 Markdown
            buttons.push({
                icon: <ExportIcon />,
                tip: t('app.toolBar.exportMarkdown'),
                onClick: () => handleOnclickTool$.emit('exportMarkdown'),
            });
        }

        // 回到草稿
        if (currentPage === 'list') {
            buttons.push({
                icon: <DraftIcon />,
                tip: t('app.toolBar.backDraft'),
                onClick: () => setCurrentPage('draft'),
            });
        }

        // 检查是否有更新
        if (updateInfo?.isUpdateAvailable) {
            buttons.push({
                isDivider: true,
            });

            if (isDownloading) {
                // 显示下载进度
                buttons.push({
                    icon: <Typography variant='body2' className="text-xs font-mono">{`${Math.round(downloadProgress)}%`}</Typography>,
                    tip: `Downloading... ${Math.round(downloadProgress)}%`,
                    disabled: true
                });
            } else {
                // 显示更新按钮
                buttons.push({
                    icon: <UpdateIcon />,
                    tip: t('app.toolBar.updateAvailable'),
                    className: 'animate-pulse',
                    onClick: handleUpdate,
                });
            }
        }

        return buttons;
    }, [currentPage, setCurrentPage, historyVersion, isMac, updateInfo, isDownloading, downloadProgress, t]);

    // 当前日期（如 Oct 26, 2024. Wednesday）
    const dateText = useMemo(() => {
        const now = new Date();
        const date = new Intl.DateTimeFormat(currentLanguage, { month: 'short', day: 'numeric', year: 'numeric' }).format(now);
        const weekday = new Intl.DateTimeFormat(currentLanguage, { weekday: 'long' }).format(now);
        return `${date}. ${weekday}`;
    }, [currentLanguage]);



    // 监听下载新版本
    useEffect(() => {
        window.electronAPI.onDownloadProgress((progress: number) => {
            console.log('下载进度', progress);
            setDownloadProgress(progress);
        })
    }, [])




    // 快速开启chat
    useKeyPress('alt.c', () => {
        inputRef.current?.focus();
        setIsChatMode(!isChatMode);
    })

    // 前进快捷键
    useKeyPress((e) => (isMac ? e.metaKey : e.altKey) && e.key === ']', (e) => {
        e.preventDefault();
        handleForwardOrBack('forward');
    })

    // 后退快捷键
    useKeyPress((e) => (isMac ? e.metaKey : e.altKey) && e.key === '[', (e) => {
        e.preventDefault();
        handleForwardOrBack('back');
    })

    // 加粗快捷键（Win: Ctrl+B，Mac: ⌘+B）
    useKeyPress((e) => (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'b', (e) => {
        if (currentPage !== 'draft' || isChatMode) return;
        e.preventDefault();
        wrapSelection('**');
    })

    // 斜体快捷键（Win: Ctrl+I，Mac: ⌘+I）
    useKeyPress((e) => (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'i', (e) => {
        if (currentPage !== 'draft' || isChatMode) return;
        e.preventDefault();
        wrapSelection('*');
    })

    // 任务列表快捷键（Win: Ctrl+T，Mac: ⌘+T）
    useKeyPress((e) => (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 't', (e) => {
        if (currentPage !== 'draft' || isChatMode) return;
        e.preventDefault();
        insertList();
    })

    // 站内搜索快捷键（Win: Ctrl+F，Mac: ⌘+F），任意页面可用；面板已打开时再次按下则关闭
    useKeyPress((e) => (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'f', (e) => {
        e.preventDefault();
        setIsSearchMode(v => !v);
    })

    // 前进或后退草稿
    const handleForwardOrBack = (type: 'forward' | 'back') => {
        // 判断能否触发
        const canTrigger = type === 'forward' ? historyStack.canForward() : historyStack.canBack();
        if (!canTrigger) return
        const uuid = type === 'forward' ? historyStack.forward() : historyStack.back();
        // 获取下一个草稿
        if (uuid) {
            // 获取草稿详情
            window.electronAPI.getDraftByUuid(uuid).then(draft => {
                if (draft) {
                    loadStickys$.emit(draft)
                }
                // 如果已删掉，则跳过一个,并且把这个uuid从历史堆栈中删除
                else {
                    handleForwardOrBack(type);
                    // 从历史堆栈中删除这个uuid
                    historyStack.remove(uuid);
                }
            });
        }
    }

    // 监听外部加载事件（如 Editor 新建草稿或加载列表），也需要刷新按钮状态
    loadStickys$.useSubscription(() => {
        setHistoryVersion(v => v + 1);
    });




    if (isChatMode) {
        return <>
            <ChatInput
                onClose={() => {
                    setIsChatMode(false)
                    setActive(false);
                }} />
            {isSearchMode && (
                <SearchPanel
                    onClose={() => setIsSearchMode(false)}
                    onSelectDraft={() => {
                        setIsSearchMode(false);
                        setCurrentPage('draft');
                    }}
                    onEnterNoteMode={() => setCurrentPage('draft')}
                />
            )}
        </>;
    }


    return (
        <>
        <div
            className="draftx-toolbar-root w-full"
            onMouseEnter={() => setActive(true)}
            onMouseLeave={() => setActive(false)}
        >
            {/* 隐藏的图片选择 input */}
            <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
            />
            {/* 底部通栏：悬停显示，离开直接整体隐藏（外层保持占位以接收 hover） */}
            <div
                className={`transition-opacity duration-150 ${active ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                style={{
                    borderTop: '1px solid #E1E0DA',
                    background: theme.palette.background.default,
                }}
            >
                <Stack
                    alignItems="center"
                    direction="row"
                    className="items-center gap-0.5 overflow-hidden"
                    sx={{ padding: '16px 24px' }}
                >
                    {toolButtons.map((button, index) => {
                        if ('isDivider' in button) {
                            return (
                                <Divider
                                    key={index}
                                    orientation="vertical"
                                    variant="middle"
                                    flexItem
                                    sx={{
                                        bgcolor: '#E1E0DA',
                                        my: 1,
                                        mx: 0.75,
                                    }}
                                />
                            )
                        }
                        return <ToolButton key={index} {...button as ToolButtonProps} />
                    })}
                    {/* 右侧当前日期 */}
                    <Typography
                        variant="body2"
                        className="ml-auto select-none whitespace-nowrap pl-2"
                        sx={{ color: alpha(theme.palette.text.primary, 0.45), fontSize: '20px', flexShrink: 0 }}
                    >
                        {dateText}
                    </Typography>
                </Stack>
            </div>
        </div>
        {/* 站内全文搜索面板（右上角浮层） */}
        {isSearchMode && (
            <SearchPanel
                onClose={() => setIsSearchMode(false)}
                onSelectDraft={() => {
                    setIsSearchMode(false);
                    setCurrentPage('draft');
                }}
                onEnterNoteMode={() => setCurrentPage('draft')}
            />
        )}
        </>
    )
}


export default ToolBar;
