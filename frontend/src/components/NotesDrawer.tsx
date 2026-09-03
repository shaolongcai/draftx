import { useEffect, useRef, useState } from "react";
import { useDebounce, useKeyPress, useRequest } from "ahooks";
import { useEvent } from "@/contexts/EvenContext";
import { useTranslation } from "@/contexts/I18nContext";
import { formatModifiedTime } from "@/utils/formatTime";

/** 面板宽度与动效参数沿用 item-index.html 设计稿 */
const PANEL_WIDTH = 360;
const EASE = 'cubic-bezier(.4,0,.2,1)';

/** 配色（与 item-index.html 一致） */
const C = {
    panel: '#F5F4EF',
    hairline: '#e3dcc9',
    ink: '#38332a',
    inkSoft: '#6f6759',
    muted: '#a89f8d',
    hoverBg: '#f4efe3',
    currentBg: '#f2ecdd',
};

// 条目进场动效（沿用设计稿的 rise 关键帧）
const DRAWER_STYLE = `
.notes-drawer-item { animation: notes-drawer-rise .35s ease backwards; }
.notes-drawer-item:hover { background: ${C.hoverBg}; }
@keyframes notes-drawer-rise {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
}
`;

/**
 * 右侧「全部笔记」抽屉（参考 item-index.html）
 * - 常驻草稿页右侧，展示全部笔记（无「全部笔记」入口），顶部搜索（FTS5，命中标黄）
 * - 把手收起/展开；收起后鼠标移入右缘任意位置即可唤出把手
 * - 点击条目加载到编辑器；当前笔记带圆点标记
 */
const NotesDrawer: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    // 收起时鼠标是否悬停在右缘 / 把手上（控制把手浮现）
    const [edgeHover, setEdgeHover] = useState(false);
    const [handleHover, setHandleHover] = useState(false);
    const [keyword, setKeyword] = useState('');
    const debounced = useDebounce(keyword, { wait: 200 });
    const [currentUuid, setCurrentUuid] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // 打开（含从收起状态展开）时聚焦搜索框；等面板滑入动画结束后再聚焦，避免闪烁
    useEffect(() => {
        if (collapsed) return;
        const timer = window.setTimeout(() => inputRef.current?.focus(), 380);
        return () => clearTimeout(timer);
    }, [collapsed]);

    // 面板打开时按 Esc 收起右侧栏
    useKeyPress('esc', () => {
        if (!collapsed) setCollapsed(true);
    });
    const { loadStickys$, handleOnclickTool$ } = useEvent();
    const { t, currentLanguage } = useTranslation();

    // 全部笔记 / 搜索（空关键词返回全部，按修改时间倒序）
    const { data, refresh } = useRequest(
        () => window.electronAPI.getDraft(debounced, 200),
        { refreshDeps: [debounced, collapsed] }
    );

    // 跟踪当前笔记 + 笔记切换/保存后刷新列表
    loadStickys$.useSubscription((item) => {
        setCurrentUuid(item.uuid);
        refresh();
    });
    // 新建笔记：清除当前标记并刷新
    handleOnclickTool$.useSubscription((cmd) => {
        if (cmd === 'addDraft') {
            setCurrentUuid('');
            refresh();
            // 仅当当前只有一篇笔记（即正在新建第二篇）时自动展开抽屉，引导用户发现笔记列表
            window.electronAPI.getDraft('', 4).then((list) => {
                if ((list?.length ?? 0) === 1) setCollapsed(false);
            });
        }
    });

    const items = data ?? [];
    const searching = !!debounced;

    // snippet 中的 <mark> 替换为带样式的高亮（与 DraftItem 一致的做法）
    const highlightSnippet = (snippet: string) =>
        snippet.replace(/<mark>/g, '<mark class="bg-yellow-200 rounded-sm px-0.5">');

    // 标题中的搜索词标黄（客户端匹配，忽略大小写）
    const renderTitle = (title: string) => {
        if (!searching) return title;
        const k = debounced.toLowerCase();
        const lower = title.toLowerCase();
        const parts: React.ReactNode[] = [];
        let i = 0;
        let key = 0;
        for (;;) {
            const idx = lower.indexOf(k, i);
            if (idx === -1) {
                parts.push(title.slice(i));
                break;
            }
            if (idx > i) parts.push(title.slice(i, idx));
            parts.push(
                <mark key={key++} className="bg-yellow-200 rounded-sm px-0.5">
                    {title.slice(idx, idx + debounced.length)}
                </mark>
            );
            i = idx + debounced.length;
        }
        return parts;
    };

    const handleSelect = (item: DraftResult) => {
        // 与 DraftItem 相同：仅传元数据，编辑器收到事件后按需 getDraftByUuid 取正文
        loadStickys$.emit(item);
    };

    const handleVisible = !collapsed || edgeHover || handleHover;

    return (
        <>
            <style>{DRAWER_STYLE}</style>

            {/* 抽屉面板 */}
            <aside
                className="fixed right-0 bottom-0 z-30 flex flex-col overflow-hidden"
                style={{
                    top: 0,
                    width: PANEL_WIDTH,
                    background: C.panel,
                    borderLeft: `1px solid ${C.hairline}`,
                    boxShadow: '-12px 0 36px rgba(74, 62, 38, 0.05)',
                    color: C.ink,
                    transform: collapsed ? 'translateX(100%)' : 'translateX(0)',
                    transition: `transform .38s ${EASE}`,
                }}
            >
                {/* 搜索框：常驻面板顶部（下方带分割线） */}
                <div style={{ padding: '20px 24px 4px', flex: 'none', borderBottom: `1px solid ${C.hairline}` }}>
                    <input
                        ref={inputRef}
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder={t('app.list.placeholder')}
                        autoComplete="off"
                        className="w-full bg-transparent outline-none border-none"
                        style={{
                            fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
                            fontSize: 15,
                            color: C.ink,
                            padding: '6px 0',
                        }}
                    />
                </div>

                {/* 笔记列表（紧贴搜索栏分割线） */}
                <ul className="flex-1 overflow-y-auto" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {items.map((item, i) => {
                        const isCurrent = item.uuid === currentUuid;
                        return (
                            <li
                                key={item.uuid}
                                className="notes-drawer-item"
                                onClick={() => handleSelect(item)}
                                style={{
                                    padding: '14px 24px 16px',
                                    borderBottom: `1px solid ${C.hairline}`,
                                    cursor: 'pointer',
                                    animationDelay: `${i * 0.05}s`,
                                    background: isCurrent ? C.currentBg : undefined,
                                }}
                            >
                                <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '.02em', marginBottom: 5 }}>
                                    {isCurrent && (
                                        <span
                                            style={{
                                                display: 'inline-block',
                                                width: 6,
                                                height: 6,
                                                borderRadius: '50%',
                                                background: '#b09a6a',
                                                marginRight: 7,
                                                verticalAlign: 2,
                                            }}
                                        />
                                    )}
                                    {renderTitle(item.title || t('app.search.untitled'))}
                                </div>
                                {item.snippet && (
                                    <div
                                        className="line-clamp-2 overflow-hidden"
                                        style={{ fontSize: 18, lineHeight: 1.7, color: C.inkSoft }}
                                    >
                                        {searching ? (
                                            <span dangerouslySetInnerHTML={{ __html: highlightSnippet(item.snippet) }} />
                                        ) : (
                                            item.snippet
                                        )}
                                    </div>
                                )}
                                <div
                                    style={{
                                        marginTop: 7,
                                        fontFamily: "'Cormorant Garamond', serif",
                                        fontSize: 14,
                                        letterSpacing: '.04em',
                                        color: C.muted,
                                    }}
                                >
                                    {/* 与列表页 item 卡片一致的人性化修改时间（刚刚 / X 分钟前修改 / 昨天修改…，多语言） */}
                                    {formatModifiedTime(item.mtime, t, currentLanguage)}
                                </div>
                            </li>
                        );
                    })}
                    {!items.length && (
                        <div style={{ padding: '40px 24px', textAlign: 'center', color: C.muted, fontSize: 13 }}>
                            {t('app.search.noResults')}
                        </div>
                    )}
                    {/* 列表底部结束标记 */}
                    {items.length > 0 && (
                        <div
                            style={{
                                padding: '28px 24px',
                                textAlign: 'center',
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: 13,
                                letterSpacing: '.08em',
                                color: C.muted,
                                userSelect: 'none',
                            }}
                        >
                            {t('app.list.end')}
                        </div>
                    )}
                </ul>

                {/* 底部：笔记总数统计 */}
                <div
                    style={{
                        flex: 'none',
                        padding: '8px 24px',
                        borderTop: `1px solid ${C.hairline}`,
                        textAlign: 'right',
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 12.5,
                        letterSpacing: '.04em',
                        color: C.muted,
                        userSelect: 'none',
                    }}
                >
                    {t('app.list.totalItem', { count: items.length })}
                </div>
            </aside>

            {/* 收起时：整条右缘都是把手的 hover 触发区（移入右侧任意位置即显示拉杠） */}
            {collapsed && (
                <div
                    className="fixed right-0 bottom-0 z-40"
                    style={{ top: 0, width: 32 }}
                    onMouseEnter={() => setEdgeHover(true)}
                    onMouseLeave={() => setEdgeHover(false)}
                />
            )}

            {/* 收起/展开把手（骑在抽屉左缘；收起时贴右缘） */}
            <button
                onClick={() => setCollapsed(v => !v)}
                onMouseEnter={() => setHandleHover(true)}
                onMouseLeave={() => setHandleHover(false)}
                className="fixed z-40 flex items-center justify-center cursor-pointer"
                style={{
                    top: '50%',
                    right: collapsed ? 0 : PANEL_WIDTH,
                    width: 22,
                    height: handleHover && !collapsed ? 72 : 60,
                    borderRadius: collapsed ? '11px 0 0 11px' : 11,
                    background: C.panel,
                    border: `1px solid ${C.hairline}`,
                    borderRight: collapsed ? 'none' : undefined,
                    boxShadow: '0 4px 14px rgba(74, 62, 38, 0.10)',
                    color: handleHover ? C.ink : C.muted,
                    transform: collapsed
                        ? `translate(${handleVisible ? 0 : 8}px, -50%)`
                        : 'translate(50%, -50%)',
                    opacity: handleVisible ? 1 : 0,
                    pointerEvents: handleVisible ? 'auto' : 'none',
                    transition: `right .38s ${EASE}, color .2s ease, height .2s ease, opacity .25s ease, transform .38s ${EASE}`,
                }}
            >
                <svg
                    width="10"
                    height="14"
                    viewBox="0 0 10 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform .3s ease', flex: 'none' }}
                >
                    <polyline points="3,2 8,7 3,12" />
                </svg>
            </button>
        </>
    );
};

export default NotesDrawer;
