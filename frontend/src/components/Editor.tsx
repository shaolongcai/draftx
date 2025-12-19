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
import { $createParagraphNode, $getRoot, type EditorThemeClasses } from 'lexical';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useEffect, useRef, useState } from "react";
import { useDebounceFn, useKeyPress } from "ahooks";
import { v4 as uuidv4 } from 'uuid';
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useEvent } from "@/contexts/EvenContext";
import { HelpOutline } from "@mui/icons-material";
import dayjs from "dayjs";

const theme: EditorThemeClasses = {
    paragraph: 'mb-2',
    heading: {
        h1: 'editor-h1',
        h2: 'editor-h2',
        h3: 'editor-h3',
    },
    quote: 'editor-quote',
    code: 'editor-code',
    text: {
        code: 'editor-text-code',
    },
    codeHighlight: {
        atrule: 'editor-tokenAttr',
        attr: 'editor-tokenAttr',
        boolean: 'editor-tokenProperty',
        builtin: 'editor-tokenSelector',
        cdata: 'editor-tokenComment',
        char: 'editor-tokenSelector',
        class: 'editor-tokenFunction',
        'class-name': 'editor-tokenFunction',
        comment: 'editor-tokenComment',
        constant: 'editor-tokenProperty',
        deleted: 'editor-tokenProperty',
        doctype: 'editor-tokenComment',
        entity: 'editor-tokenOperator',
        function: 'editor-tokenFunction',
        important: 'editor-tokenVariable',
        inserted: 'editor-tokenSelector',
        keyword: 'editor-tokenAttr',
        namespace: 'editor-tokenVariable',
        number: 'editor-tokenProperty',
        operator: 'editor-tokenOperator',
        prolog: 'editor-tokenComment',
        property: 'editor-tokenProperty',
        punctuation: 'editor-tokenPunctuation',
        regex: 'editor-tokenVariable',
        selector: 'editor-tokenSelector',
        string: 'editor-tokenSelector',
        symbol: 'editor-tokenProperty',
        tag: 'editor-tokenProperty',
        url: 'editor-tokenOperator',
        variable: 'editor-tokenVariable',
    },
    list: {
        nested: {
            listitem: 'editor-nested-listitem',
        },
        ol: 'editor-list-ol',
        listitemChecked: 'editor-listItemChecked',
        listitemUnchecked: 'editor-listItemUnchecked',
        olDepth: [
            'editor-list-oll1',
            'editor-list-ol2',
            'editor-list-ol3',
            'editor-list-ol4',
            'editor-list-ol5',
        ],
        ulDepth: [
            'editor-list-ul1',
            'editor-list-ul2',
            'editor-list-ul3',
            'editor-list-ul4',
            'editor-list-ul5',
        ],
    },
    table: 'editor-table',
    tableCell: 'editor-tableCell',
    tableCellHeader: 'editor-tableCellHeader',
    tableCellSelected: 'editor-tableCellSelected',
    tableSelection: 'editor-tableSelection',
}

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
    const AUTOSAVE_WAIT_MS = 1000;
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
                    contentString: JSON.stringify(payload.contentJson),
                });
                lastSavedRef.current = payload;
                console.log('已自动保存', payload);
                // 如需提示可开启：message.success('已自动保存');
            } catch (error) {
                const msg = error instanceof Error ? error.message : '保存失败';
                console.error(msg);
            }
        },
        { wait: AUTOSAVE_WAIT_MS }
    );

    // 注册Shitf+A 新建便利贴
    useKeyPress('shift.enter', () => {
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
                    scrollbarColor: 'rgba(0, 0, 0, 0.25) transparent',
                    scrollbarWidth: 'thin',
                    paddingBottom: '40px', // 增加底部內邊距，方便點擊跳出代碼塊
                    // scrollbarColor: '#888 #f1f1f1',
                }} />
            }
            ErrorBoundary={LexicalErrorBoundary}
            placeholder={Placeholder}
        />
        <HistoryPlugin />
        <AutoFocusPlugin />
        <ListPlugin />
        <TabIndentationPlugin />
        <TablePlugin />
        <TableKeyboardPlugin />

        <MarkdownShortcutPlugin />
        <MarkdownPastePlugin />
        <CodeHighlightPlugin />
        <CodeActionPlugin />
        <MermaidPlugin />
        <OnChangePlugin onChange={(editorState) => {
            // 获取第一个 # 的标题
            const firstHeading = editorState.read(() => $getRoot().getFirstChild()?.getTextContent());
            // 判断类型是否为 HeadingNode
            // let title: string | undefined = undefined;
            // if (firstHeading?.getType() !== 'heading') {
            //     title = firstHeading?.getTextContent();
            // };
            // console.log('firstHeading', firstHeading);
            // 获取纯文本内容
            const plain = editorState.read(() => $getRoot().getTextContent());
            const json = editorState.toJSON();
            scheduleSave({ title: firstHeading, contentJson: json, contentText: plain });
        }} />
    </div>
}



const Editor = () => {

    const [deletedAt, setDeletedAt] = useState<number>();

    const initialConfig = {
        namespace: 'MyEditor',
        theme: theme,
        onError: (error: Error) => {
            console.error(error);
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
            HorizontalRuleNode,
            TableNode,
            TableCellNode,
            TableRowNode,
            mermaidNode,
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