import { Card } from "@mui/material"

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


const theme = {
    // Theme styling goes here
    //...
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
                <ContentEditable
                    aria-placeholder={'Enter some text...'}
                    placeholder={<div>Enter some text...</div>}
                />
            }
            ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <AutoFocusPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
    </>
}



const Editor: React.FC<Props> = ({
    onSave,
}) => {

    const initialConfig = {
        namespace: 'MyEditor',
        theme,
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

    return <Card>
        <LexicalComposer initialConfig={initialConfig}>
            <EditorContext />
        </LexicalComposer>
    </Card>
}

export default Editor