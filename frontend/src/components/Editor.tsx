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
import AiPickerPlugin from "@/plugin/AIPickerPlugin";
import { LoadingNode } from "@/nodes/LoadingNode";
// import { useSettings } from '@/contexts/SettingContext';


function Placeholder() {
    return <Box sx={{
        color: '#ccc',
        // overflow: 'hidden',
        position: 'absolute',
        top: '26px',
        fontSize: '16px',
        userSelect: 'none',
        display: 'inline-block',
        pointerEvents: 'none',
    }}>Press / bring up the menu <br /> Press ` bring up the AI tool....</Box>;
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
        console.log('加载新的便利贴', sticky);
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
                const initialEditorState = editor.parseEditorState(sticky.content_json);
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

        notification.show('The previous draft has been saved', {
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
            // if (payload.contentJson === lastSavedRef.current.contentJson) return
            // 仅在文本变更时保存
            if (payload.contentText === lastSavedRef.current.contentText) return
            try {
                window.electronAPI.saveSticky({
                    uuid: currentUuid,
                    title: payload.title,
                    content: payload.contentText,
                    contentJson: payload.contentJson, // 这里已经是字符串化
                });
                lastSavedRef.current = payload;
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
                <ContentEditable   style={{
                    height:'500px',
                    width: '100%',
                    maxHeight: 'calc(100vh - 64px)',
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
        <AiPickerPlugin />
        <TabFocusPlugin />
        <CheckListPlugin />
        <MathPlugin />
        <AutoPastePlugin />
        <BlockTipPlugin />
        <OnChangePlugin onChange={(editorState) => {
            // 获取纯文本内容
            const plain = editorState.read(() => $getRoot().getTextContent());
            const json = editorState.toJSON();
            scheduleSave({ contentJson: JSON.stringify(json), contentText: plain });
        }} />
    </div>
}


export default EditorContext;

