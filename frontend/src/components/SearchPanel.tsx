import { useEffect, useRef, useState } from "react";
import { useDebounce, useKeyPress, useRequest } from "ahooks";
import dayjs from "dayjs";
import { useEvent } from "@/contexts/EvenContext";
import { useEditor } from "@/contexts/EditorContext";
import { useTranslation } from "@/contexts/I18nContext";

type SearchMode = 'global' | 'note';

// CSS Custom Highlight API 的注册名（样式见 index.css）
const HIGHLIGHT_ALL = 'note-search';
const HIGHLIGHT_CURRENT = 'note-search-current';

interface Props {
    onClose: () => void;
    /** 选中结果后回调（跳转草稿页并关闭面板） */
    onSelectDraft: () => void;
    /** 进入笔记内搜索时确保位于草稿页（笔记内搜索依赖编辑器 DOM） */
    onEnterNoteMode: () => void;
}

/**
 * 站内搜索面板（右上角浮层）
 * - note（默认）：当前笔记内搜索（类 Word）。在 Vditor IR 正文 DOM 内自行遍历文本节点生成 Range 列表，
 *   用 CSS Custom Highlight API 高亮（不改动编辑器 DOM、不移动选区，因此不会触发编辑态），
 *   Enter/Shift+Enter 循环跳到下一个/上一个匹配并滚动定位，焦点始终留在搜索框
 * - global：FTS5 全文搜索所有笔记，snippet 带 <mark> 高亮，点击加载草稿
 */
const SearchPanel: React.FC<Props> = ({ onClose, onSelectDraft, onEnterNoteMode }) => {
    const [mode, setMode] = useState<SearchMode>('note');
    const [keyword, setKeyword] = useState('');
    const debounced = useDebounce(keyword, { wait: 200 });
    const inputRef = useRef<HTMLInputElement>(null);
    const { loadStickys$ } = useEvent();
    const { vditorRef } = useEditor();
    const { t } = useTranslation();

    // 笔记内搜索状态：匹配 Range 列表与当前激活项（-1 表示无）
    const [matches, setMatches] = useState<Range[]>([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    // 正文 DOM 变化计数（Vditor 会重渲染，需随之重新收集匹配）
    const [contentVersion, setContentVersion] = useState(0);
    // activeIndex 的 ref 镜像，供事件处理器/副作用内同步读取
    const activeIndexRef = useRef(-1);
    // 上一次收集匹配时的关键词标识（区分"关键词变化"与"正文内容变化"）
    const searchKeyRef = useRef('');

    const updateActiveIndex = (i: number) => {
        activeIndexRef.current = i;
        setActiveIndex(i);
    };

    // 全局搜索（笔记内搜索不走后端）
    const { data } = useRequest(
        () => window.electronAPI.getDraft(debounced, 20),
        { refreshDeps: [debounced], ready: mode === 'global' }
    );

    // 默认笔记内搜索：打开面板时确保位于草稿页并聚焦输入框
    useEffect(() => {
        onEnterNoteMode();
        inputRef.current?.focus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Esc 关闭（输入框外失焦时也能响应）
    useKeyPress('esc', (e) => {
        e.preventDefault();
        onClose();
    });

    // 编辑器 IR 元素（笔记内搜索的查找范围：仅正文，不含标题与搜索框自身）
    const getIrElement = (): HTMLElement | undefined =>
        (vditorRef.current as unknown as { vditor?: { ir?: { element?: HTMLElement } } } | null)
            ?.vditor?.ir?.element;

    // ---- 高亮（CSS Custom Highlight API，不改 DOM、不动选区）----
    const getHighlightRegistry = () =>
        (CSS as unknown as { highlights?: { set: (n: string, h: unknown) => void; delete: (n: string) => void } }).highlights;

    const clearHighlights = () => {
        const registry = getHighlightRegistry();
        registry?.delete(HIGHLIGHT_ALL);
        registry?.delete(HIGHLIGHT_CURRENT);
    };

    const applyHighlights = (ranges: Range[], current: number) => {
        const registry = getHighlightRegistry();
        const HighlightCtor = (window as unknown as { Highlight?: new (...r: Range[]) => unknown }).Highlight;
        if (!registry || !HighlightCtor) return;
        const others = ranges.filter((_, i) => i !== current);
        if (others.length) registry.set(HIGHLIGHT_ALL, new HighlightCtor(...others));
        else registry.delete(HIGHLIGHT_ALL);
        if (current >= 0 && ranges[current]) registry.set(HIGHLIGHT_CURRENT, new HighlightCtor(ranges[current]));
        else registry.delete(HIGHLIGHT_CURRENT);
    };

    // 在正文 DOM 内遍历文本节点，收集所有匹配 Range（忽略大小写）
    const collectMatches = (): Range[] => {
        const root = getIrElement();
        if (!root || !debounced) return [];
        const k = debounced.toLowerCase();
        const ranges: Range[] = [];
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let node = walker.nextNode() as Text | null;
        while (node) {
            const text = node.data.toLowerCase();
            let idx = 0;
            while ((idx = text.indexOf(k, idx)) !== -1) {
                const range = new Range();
                range.setStart(node, idx);
                range.setEnd(node, idx + k.length);
                ranges.push(range);
                idx += k.length;
            }
            node = walker.nextNode() as Text | null;
        }
        return ranges;
    };

    // 滚动定位到匹配处
    const scrollToRange = (range: Range) => {
        range.startContainer.parentElement?.scrollIntoView({ block: 'center' });
    };

    // 监听正文 DOM 变化（编辑器可能异步挂载，未就绪时重试）
    useEffect(() => {
        if (mode !== 'note') return;
        let observer: MutationObserver | null = null;
        let retryTimer: number | undefined;
        const attach = () => {
            const root = getIrElement();
            if (!root) {
                retryTimer = window.setTimeout(attach, 300);
                return;
            }
            observer = new MutationObserver(() => setContentVersion(v => v + 1));
            observer.observe(root, { childList: true, subtree: true, characterData: true });
            setContentVersion(v => v + 1);
        };
        attach();
        return () => {
            observer?.disconnect();
            if (retryTimer) clearTimeout(retryTimer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    // 收集匹配 + 注册高亮：关键词变化时回到第一个匹配并定位；正文变化时尽量保持当前位置
    useEffect(() => {
        if (mode !== 'note' || !debounced) {
            setMatches([]);
            updateActiveIndex(-1);
            searchKeyRef.current = '';
            clearHighlights();
            return;
        }
        const key = `${mode}:${debounced}`;
        const keywordChanged = searchKeyRef.current !== key;
        searchKeyRef.current = key;
        const ranges = collectMatches();
        const next = ranges.length === 0
            ? -1
            : keywordChanged
                ? 0
                : Math.min(Math.max(activeIndexRef.current, 0), ranges.length - 1);
        setMatches(ranges);
        updateActiveIndex(next);
        applyHighlights(ranges, next);
        if (keywordChanged && next >= 0) scrollToRange(ranges[next]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debounced, mode, contentVersion]);

    // 关闭面板时清除高亮
    useEffect(() => clearHighlights, []); // eslint-disable-line react-hooks/exhaustive-deps

    // 下一个/上一个匹配（类 Word）：循环跳转、滚动定位，焦点保持在搜索框
    const findInNote = (backwards = false) => {
        let list = matches;
        // Vditor 重渲染后旧 Range 可能已脱离文档，需先重新收集
        if (list.length && !list[0].startContainer.isConnected) {
            list = collectMatches();
            setMatches(list);
        }
        if (!list.length) return;
        const current = activeIndexRef.current;
        const next = backwards
            ? (current <= 0 ? list.length - 1 : current - 1)
            : (current + 1) % list.length;
        updateActiveIndex(next);
        applyHighlights(list, next);
        scrollToRange(list[next]);
        inputRef.current?.focus();
    };

    const switchMode = (m: SearchMode) => {
        setMode(m);
        if (m === 'note') {
            onEnterNoteMode();
        }
        inputRef.current?.focus();
    };

    // snippet 中的 <mark> 替换为带样式的高亮（与 DraftItem 一致的做法）
    const highlight = (snippet: string) =>
        snippet.replace(/<mark>/g, '<mark class="bg-yellow-200 rounded-sm px-0.5">');

    const handleSelect = (item: DraftResult) => {
        // 与 DraftItem 相同：仅传元数据，编辑器收到事件后按需 getDraftByUuid 取正文
        loadStickys$.emit(item);
        onSelectDraft();
    };

    const tabs: { key: SearchMode; label: string }[] = [
        { key: 'note', label: t('app.search.inNote') },
        { key: 'global', label: t('app.search.global') },
    ];

    const matchCount = matches.length;

    return (
        <>
            {/* 透明遮罩：点击面板外关闭 */}
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div
                className="fixed top-10 right-4 z-50 w-[380px] rounded-lg border shadow-xl overflow-hidden"
                style={{ background: '#F5F4EF', borderColor: '#E1E0DA', color: '#3A332C' }}
            >
                {/* 模式切换：当前笔记 / 全局搜索 */}
                <div className="flex border-b" style={{ borderColor: '#E1E0DA' }}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => switchMode(tab.key)}
                            className="flex-1 px-4 py-2 text-sm cursor-pointer transition-colors"
                            style={{
                                fontWeight: mode === tab.key ? 700 : 400,
                                color: mode === tab.key ? '#867A6C' : 'rgba(58, 51, 44, 0.45)',
                                borderBottom: mode === tab.key ? '2px solid #867A6C' : '2px solid transparent',
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <input
                    ref={inputRef}
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            e.preventDefault();
                            onClose();
                        }
                        // 笔记内搜索：Enter 下一个，Shift+Enter 上一个（类 Word）
                        if (mode === 'note' && e.key === 'Enter') {
                            e.preventDefault();
                            findInNote(e.shiftKey);
                        }
                    }}
                    placeholder={t('app.search.placeholder')}
                    autoComplete="off"
                    className="w-full px-4 py-3 bg-transparent outline-none text-base placeholder:opacity-45"
                />

                {mode === 'global' ? (
                    <div
                        className="max-h-[50vh] overflow-y-auto border-t"
                        style={{ borderColor: '#E1E0DA' }}
                    >
                        {(data ?? []).map((item) => (
                            <div
                                key={item.uuid}
                                onClick={() => handleSelect(item)}
                                className="px-4 py-2.5 cursor-pointer hover:bg-black/5"
                            >
                                <div className="font-bold text-sm truncate">
                                    {item.title || t('app.search.untitled')}
                                </div>
                                {item.snippet && (
                                    <div
                                        className="text-xs opacity-70 line-clamp-2 mt-0.5"
                                        dangerouslySetInnerHTML={{ __html: highlight(item.snippet) }}
                                    />
                                )}
                                <div className="text-[10px] opacity-45 mt-0.5">
                                    {dayjs(item.mtime).format('YYYY-MM-DD HH:mm')}
                                </div>
                            </div>
                        ))}
                        {debounced && data && data.length === 0 && (
                            <div className="px-4 py-8 text-center text-sm opacity-50">
                                {t('app.search.noResults')}
                            </div>
                        )}
                    </div>
                ) : (
                    /* 笔记内搜索：当前位置/匹配总数 + 上一个/下一个 */
                    <div
                        className="flex items-center gap-2 px-4 py-2 border-t"
                        style={{ borderColor: '#E1E0DA' }}
                    >
                        <span className="text-sm opacity-60">
                            {debounced
                                ? matchCount > 0
                                    ? `${activeIndex + 1}/${matchCount} · ${t('app.search.matches', { count: matchCount })}`
                                    : t('app.search.noResults')
                                : ''}
                        </span>
                        <div className="ml-auto flex gap-1">
                            <button
                                className="px-2 py-0.5 rounded cursor-pointer hover:bg-black/5 disabled:opacity-30 disabled:cursor-default"
                                disabled={matchCount === 0}
                                onClick={() => findInNote(true)}
                            >
                                ↑
                            </button>
                            <button
                                className="px-2 py-0.5 rounded cursor-pointer hover:bg-black/5 disabled:opacity-30 disabled:cursor-default"
                                disabled={matchCount === 0}
                                onClick={() => findInNote(false)}
                            >
                                ↓
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default SearchPanel;
