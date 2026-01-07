import { Box, Card, Stack, Tooltip, Typography } from "@mui/material"

import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { CodeHighlightPlugin } from '@/plugin/CodeHighlightPlugin';
import { CodeActionPlugin } from '@/plugin/CodeActionPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { MarkdownShortcutPlugin } from "@/plugin/MarkdownShortcutPlugin";
import { MarkdownPastePlugin } from "@/plugin/MarkdownPastePlugin";
import { TableKeyboardPlugin } from "@/plugin/TableKeyboardPlugin";
import { MermaidPlugin } from "@/plugin/MermaidPlugin";
import { mermaidNode } from "@/nodes/MermaidNode";
import { ListItemNode, ListNode } from '@lexical/list';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { $createParagraphNode, $getRoot } from 'lexical';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useEffect, useRef, useState } from "react";
import { useDebounceFn, useKeyPress, useUpdateEffect } from "ahooks";
import { v4 as uuidv4 } from 'uuid';
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useEvent } from "@/contexts/EvenContext";
import { HelpOutline } from "@mui/icons-material";
import dayjs from "dayjs";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import TabFocusPlugin from '@/plugin/TabFocusPlugin';
import { theme } from "@/theme/editorTheme";
import PickerPlugin from "@/plugin/PickerPlugin";
import { MathNode } from "@/nodes/MathNode";
import { MathPlugin } from "@/plugin/MathPlugin";
import { MathItemNode } from "@/nodes/MathItemNode";
import { BlockTitleNode } from "@/nodes/BlockTitleNode";
import { BlockTipNode } from "@/nodes/BlockTipNode";
import { AutoPastePlugin } from "@/plugin/AutoPastePlugin";
import { BlockTipPlugin } from "@/plugin/BlockTipPlugin";
import { PasteNode } from "@/nodes/PasteNode";
import ToolBar from "./ToolBar";
// import { useSettings } from '@/contexts/SettingContext';


function Placeholder() {
    return <Box sx={{
        color: '#ccc',
        // overflow: 'hidden',
        position: 'absolute',
        top: '24px',
        fontSize: '16px',
        userSelect: 'none',
        display: 'inline-block',
        pointerEvents: 'none',
    }}>支持markdown格式输入...</Box>;
}


interface EditorContextProps {
    getDeleteDay: (date: string) => void;
}
/**
 * 内容编辑器
 */
const EditorContext: React.FC<EditorContextProps> = ({
    getDeleteDay,
}) => {

    const [currentUuid, setCurrentUuid] = useState<string>('');
    const lastSavedRef = useRef<{ title?: string; contentJson: string; contentText: string }>({ contentJson: '', contentText: '' }); // 上次已保存

    const [editor] = useLexicalComposerContext()
    const { loadStickys$, handleOnclickTool$ } = useEvent();
    const notification = useNotifications();


    // const {
    //         setOption,
    //         settings: {
    //             listStrictIndent,
    //         },
    //     } = useSetting();

    //     const isEditable = useLexicalEditable();

    // 初始化uuid
    useEffect(() => {
        setCurrentUuid(uuidv4());
    }, []);

    // 监听点击新建草稿
    handleOnclickTool$.useSubscription((tool) => {
        if (tool === 'addDraft') {
            addNewDraft();
        }
    })

    // 监听加载新的便利贴
    loadStickys$.useSubscription((sticky) => {
        // 新增天数
        window.electronAPI.addDeleteDay(sticky.id);
        getDeleteDay(sticky.deleted_at)
        // 清空编辑器内容
        editor.update(() => {
            const root = $getRoot();
            root.clear();
            // 插入新的便利贴内容
            try {
                // 创建root
                const root = $getRoot();
                root.append($createParagraphNode());
                // console.log('插入新内容', sticky);
                const initialEditorState = editor.parseEditorState(sticky.content_string);
                editor.setEditorState(initialEditorState);
                setCurrentUuid(sticky.uuid);
            } catch (error) {
                root.append($createParagraphNode()); // 解析失败时兜底：新增空段落
                console.log('解析失败，插入空段落', error);
            }
        });
    })

    // 新建草稿
    const addNewDraft = () => {
        // 保存现在的内容
        scheduleSave(lastSavedRef.current);
        setCurrentUuid(uuidv4());
        // 清空编辑器内容
        editor.update(() => {
            const root = $getRoot();
            root.clear();
        });

        notification.show('The sticky has been saved', {
            severity: 'success',
        });
    }

    // 防抖保存
    const AUTOSAVE_WAIT_MS = 200;
    const { run: scheduleSave } = useDebounceFn(
        async (payload: { title?: string; contentJson: string; contentText: string }) => {
            // 内容为空则跳过
            if (!payload.contentText) return;
            // 若无变更则跳过
            if (payload.contentJson === lastSavedRef.current.contentJson) return
            try {
                window.electronAPI.saveSticky({
                    uuid: currentUuid,
                    title: payload.title,
                    content: payload.contentText,
                    contentJson: JSON.stringify(payload.contentJson), // 需要字符串化
                });
                lastSavedRef.current = payload;
                // console.log('已自动保存', payload);
                // 如需提示可开启：message.success('已自动保存');
            } catch (error) {
                const msg = error instanceof Error ? error.message : '保存失败';
                console.error(msg);
            }
        },
        { wait: AUTOSAVE_WAIT_MS }
    );

    // 注册Shitf+A 新建便利贴
    useKeyPress('alt.n', () => {
        addNewDraft();
    })


    return <div className="scrollbar-thin!">
        <RichTextPlugin
            contentEditable={
                <ContentEditable style={{
                    maxHeight: '600px',
                    minHeight: '240px',
                    overflow: 'auto',
                    outline: 'none',
                    boxSizing: 'border-box',
                    scrollbarColor: 'rgba(0, 0, 0, 0.5) transparent',
                    scrollbarWidth: 'none',
                    paddingBottom: '40px', // 增加底部內邊距，方便點擊跳出代碼塊
                    // scrollbarColor: '#888 #f1f1f1',
                }} />
            }
            ErrorBoundary={LexicalErrorBoundary}
            placeholder={Placeholder}
        />
        <HistoryPlugin />
        <AutoFocusPlugin />

        <TabIndentationPlugin />
        <ListPlugin hasStrictIndent={false} />
        <TablePlugin />
        <TableKeyboardPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <MarkdownPastePlugin />
        <CodeHighlightPlugin />
        <CodeActionPlugin />
        <MermaidPlugin />
        <PickerPlugin />
        <TabFocusPlugin />
        <CheckListPlugin />
        <MathPlugin />
        <AutoPastePlugin />
        <BlockTipPlugin />
        <OnChangePlugin onChange={(editorState) => {
            // 获取纯文本内容
            const plain = editorState.read(() => $getRoot().getTextContent());
            const json = editorState.toJSON();
            scheduleSave({ contentJson: json, contentText: plain });
        }} />
    </div>
}




const Editor: React.FC = () => {

    const [deletedAt, setDeletedAt] = useState<number>();
    const [cardSize, setCardSize] = useState({ width: 400, height: 400 });
    const [showTips, setShowTips] = useState(true);

    const initialConfig = {
        namespace: 'MyEditor',
        theme: theme,
        onError: (error: Error) => {
            console.error(error.message);
        },
        nodes: [
            HeadingNode,
            QuoteNode,
            ListNode,
            ListItemNode,
            CodeNode,
            CodeHighlightNode,
            LinkNode,
            AutoLinkNode,
            TableNode,
            TableCellNode,
            HorizontalRuleNode,
            TableRowNode,
            BlockTitleNode,
            BlockTipNode,
            mermaidNode,
            MathNode,
            MathItemNode,
            PasteNode,
        ]
    };

    useEffect(() => {
        const t = setTimeout(() => setShowTips(false), 5000)
        return () => clearTimeout(t)
    }, [])

    // 调整卡片大小
    const startResize = (edge: 'e' | 's' | 'se') => (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            const startWidth = cardSize.width;
            const startHeight = cardSize.height;
            const startX = e.clientX;
            const startY = e.clientY;

            const onMove = (ev: MouseEvent) => {
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;

                setCardSize(prev => {
                    let nextWidth = prev.width;
                    let nextHeight = prev.height;

                    if (edge === 'e' || edge === 'se') {
                        nextWidth = Math.min(Math.max(360, startWidth + dx), 800); //最大800，最小360
                    }
                    if (edge === 's' || edge === 'se') {
                        nextHeight = Math.min(Math.max(360, startHeight + dy), 800); //最大800，最小360
                    }
                    return { width: nextWidth, height: nextHeight };
                });
            };

            const onUp = () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
            };

            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
        } catch (error) {
            const msg = error instanceof Error ? error.message : '升级失败';
            console.error(msg);
        }
    };

    return <Card className="relative rounded-2xl ring-1 ring-gray-300/60  overflow-hidden"
        style={{ width: cardSize.width, height: cardSize.height }}
    >
        {/* 顶部拖动句柄 */}
        <div
            className="drag absolute top-0 left-0 right-0 h-8 z-10 "
        />
        {/* 右侧缩放句柄：横向缩放 */}
        <div
            onMouseDown={startResize('e')}
            className="absolute right-0 top-0 h-full w-2 cursor-ew-resize opacity-0 hover:opacity-100 transition-opacity duration-150"
        />
        {/* 底部缩放句柄：纵向缩放 */}
        <div
            onMouseDown={startResize('s')}
            className="absolute left-0 bottom-0 w-full h-2 cursor-ns-resize opacity-0 hover:opacity-100 transition-opacity duration-150"
        />
        {/* 右下角缩放句柄：同时缩放 */}
        <div
            onMouseDown={startResize('se')}
            className="absolute right-0 bottom-0 w-3 h-3 cursor-nwse-resize opacity-0 hover:opacity-100 transition-opacity duration-150"
        />
        <LexicalComposer initialConfig={initialConfig}>
            <EditorContext getDeleteDay={(deletedAt) => {
                // 换成与今天的差距
                const diff = dayjs(deletedAt).diff(dayjs(), 'day');
                console.log('diff', diff);
                setDeletedAt(diff);
            }} />
        </LexicalComposer>
        <Stack direction='row' justifyContent='space-between' alignItems="center"
            className="absolute bottom-4 left-0 right-0 px-4 h-8"
        >
            <Stack direction="row" spacing={0.5} alignItems="center"
                className={`transition-opacity duration-700 ${showTips ? 'opacity-100' : 'opacity-0'}`}
            >
                <Typography variant="bodySmall" color="textSecondary">
                    {/* 删除的天数，+3天是因为点击后会加3天删除时间，修改增加的删除时间时，需要同步更改这里 */}
                    After {deletedAt ? deletedAt + 3 : 7} days will be deleted
                </Typography>
                {/* <Tooltip title="Each view adds 3 days to deletion">
                    <HelpOutline fontSize="small" className="cursor-pointer" color='action' />
                </Tooltip> */}
            </Stack>
            <ToolBar />
            <Stack direction="row" spacing={0.5} alignItems="center"
                className={`transition-opacity duration-700 ${showTips ? 'opacity-100' : 'opacity-0'}`}
            >
                <span className="border border-text-secondary border-gray-300 text-gray-600 rounded px-2 py-1 text-xs leading-none">
                    Alt
                </span>
                <Typography variant="bodySmall" color='textTertiary'>+</Typography>
                <span className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-600 leading-none">
                    N
                </span>
                <Typography variant="bodySmall" color="textTertiary" className="pl-1">
                    New draft
                </Typography>
            </Stack>
        </Stack>
    </Card>
}

export default Editor