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
import type { EditorThemeClasses } from 'lexical';

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
        color: '#999',
        // overflow: 'hidden',
        position: 'absolute',
        top: '32px',
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
    return <>
        <RichTextPlugin
            contentEditable={
                <ContentEditable style={{
                    minHeight: '480px',
                    outline: 'none',
                    marginTop: '8px',
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