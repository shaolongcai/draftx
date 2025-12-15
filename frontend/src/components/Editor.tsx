import { Box, Card } from "@mui/material"

import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from '@lexical/markdown'
import { ListItemNode, ListNode } from '@lexical/list';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { $getRoot, type EditorThemeClasses } from 'lexical';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useEffect, useRef, useState } from "react";
import { useDebounceFn } from "ahooks";
import { v4 as uuidv4 } from 'uuid';

const theme: EditorThemeClasses = {
    paragraph: 'mb-2',
    heading: {
        h1: 'text-3xl! font-bold mt-4 mb-2', //这个失效
        h2: 'text-xl font-semibold mt-3 mb-2',
        h3: 'text-lg font-semibold mt-2 mb-1',
    },
    list: {
        nested: {
            listitem: 'editor-nested-listitem',
        },
        ol: 'editor-list-ol',
        // ul: 'editor-list-ul',
        // listitem: 'editor-listItem',
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
    }}>Enter some text...</Box>;
}

interface Props {
    onSave: (content: string) => void;
}
/**
 * 内容编辑器
 */
const EditorContext = () => {

    const [currentUuid, setCurrentUuid] = useState<string>('');
    const lastSavedRef = useRef<{ title?: string; contentJson: string; contentText: string }>({ contentJson: '', contentText: '' }); // 上次已保存

    // 初始化uuid
    useEffect(() => {
        setCurrentUuid(uuidv4());
    }, []);

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
                    uuid: currentUuid ,
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


    return <>
        <RichTextPlugin
            contentEditable={
                <ContentEditable style={{
                    height: '432px',
                    outline: 'none',
                    boxSizing: 'border-box',
                }} />
            }
            ErrorBoundary={LexicalErrorBoundary}
            placeholder={Placeholder}
        />
        <HistoryPlugin />
        <AutoFocusPlugin />
        <ListPlugin />
        <TabIndentationPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <OnChangePlugin onChange={(editorState) => {
            // 获取第一个 # 的标题
            const firstHeading = editorState.read(() => $getRoot().getFirstChild().getTextContent());
            // 判断类型是否为 HeadingNode
            // let title: string | undefined = undefined;
            // if (firstHeading?.getType() !== 'heading') {
            //     title = firstHeading?.getTextContent();
            // };
            // console.log('firstHeading', firstHeading);
            // 获取纯文本内容
            const plain = editorState.read(() => $getRoot().getTextContent());
            const json = JSON.stringify(editorState.toJSON());
            scheduleSave({ title: firstHeading, contentJson: json, contentText: plain });
        }} />
    </>
}



const Editor: React.FC<Props> = ({
    onSave,
}) => {

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
            LinkNode,
        ]
    };

    return <Card className="relative">
        <LexicalComposer initialConfig={initialConfig}>
            <EditorContext />
        </LexicalComposer>
    </Card>
}

export default Editor