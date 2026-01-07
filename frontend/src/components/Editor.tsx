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
import { $createParagraphNode, $getRoot, $getSelection, $isRangeSelection, COMMAND_PRIORITY_CRITICAL, type EditorThemeClasses, LexicalNode, PASTE_COMMAND } from 'lexical';
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
    const { loadStickys$ } = useEvent();
    const notification = useNotifications();


    // const {
    //         setOption,
    //         settings: {
    //             listStrictIndent,
    //         },
    //     } = useSetting();

    //     const isEditable = useLexicalEditable();


    // 监听粘贴事件
    // useEffect(() => {
    //     return editor.registerCommand(
    //         PASTE_COMMAND,
    //         (event: ClipboardEvent) => {
    //             event.preventDefault(); // 阻止默认行为
    //             event.stopPropagation();
    //             const pastedText = event.clipboardData?.getData('text');
    //             console.log('粘贴文本', pastedText);

    //             // 手动插入到编辑器
    //             if (pastedText) {
    //                 editor.update(() => {
    //                     // 获取当前选择范围
    //                     const selection = $getSelection();
    //                     if ($isRangeSelection(selection)) {
    //                         const { anchor, focus } = selection;
    //                         // 获取光标位置
    //                         const cursorNode = anchor.getNode();
    //                         // 在selection后面创建新段落
    //                         const temp = $createParagraphNode();
    //                         // 光标位置插入temp
    //                         cursorNode.insertAfter(temp);
    //                         temp.selectEnd();
    //                         $convertFromMarkdownString(pastedText, TRANSFORMERS, temp);
    //                     }
    //                 });
    //             }
    //             return true; // 📌 关键：命令已消费，让后面的插件不再触发
    //         },
    //         COMMAND_PRIORITY_CRITICAL // 最高优先级
    //     )
    // }, [editor]);



    // 初始化uuid
    useEffect(() => {
        setCurrentUuid(uuidv4());
    }, []);

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
    // useKeyPress('shift.enter', () => {
    //     scheduleSave(lastSavedRef.current);
    //     setCurrentUuid(uuidv4());
    //     // 清空编辑器内容
    //     editor.update(() => {
    //         const root = $getRoot();
    //         root.clear();
    //     });

    //     notification.show('The sticky has been saved', {
    //         severity: 'success',
    //     });
    // })


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



const Editor = () => {

    const [deletedAt, setDeletedAt] = useState<number>();

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

    return <Card className="relative" >
        <LexicalComposer initialConfig={initialConfig}>
            <EditorContext getDeleteDay={(deletedAt) => {
                // 换成与今天的差距
                const diff = dayjs(deletedAt).diff(dayjs(), 'day');
                console.log('diff', diff);
                setDeletedAt(diff);
            }} />
        </LexicalComposer>
        <Stack direction='row' justifyContent='space-between' alignItems="center">
            <Stack direction="row" spacing={0.5} alignItems="center" >
                <Typography variant="bodySmall" color="textSecondary">
                    {/* 删除的天数，+3天是因为点击后会加3天删除时间，修改增加的删除时间时，需要同步更改这里 */}
                    {deletedAt ? deletedAt + 3 : 7} 天后删除
                </Typography>
                <Tooltip title="Each view adds 3 days to deletion">
                    <HelpOutline fontSize="small" className="cursor-pointer" color='action' />
                </Tooltip>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center" >
                <span className="border border-text-secondary border-gray-300  rounded px-2 py-1 text-xs leading-none">
                    ⇧
                </span>
                <Typography variant="bodySmall" color="textSecondary">+</Typography>
                <span className="border border-gray-300 rounded px-2 py-1 text-xs leading-none">
                    ↵
                </span>
                <Typography variant="bodySmall" color="textSecondary" className="pl-1">
                    新的便利贴
                </Typography>
            </Stack>
        </Stack>
    </Card>
}

export default Editor