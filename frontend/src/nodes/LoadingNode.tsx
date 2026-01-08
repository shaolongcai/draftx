// MathNode.ts
import { CircularProgress, Stack } from '@mui/material';
import { DecoratorNode, LexicalNode, NodeKey, EditorConfig, LexicalEditor } from 'lexical';
import { ReactElement, JSXElementConstructor } from 'react';

// ElementNode是普通节点，才拥有append方法
export class LoadingNode extends DecoratorNode<React.ReactElement> {
    private __placeholder: string

    static getType(): string {
        return 'loading-node';
    }

    static clone(node: LoadingNode): LoadingNode {
        return new LoadingNode(node.__placeholder, node.__key);
    }

    constructor(placeholder: string, key?: NodeKey) {
        super(key);
        this.__placeholder = placeholder;
    }

    createDOM(config: EditorConfig): HTMLElement {
        const element = document.createElement('span');
        element.className = 'loading-node';
        element.contentEditable = 'false';
        return element;
    }

    updateDOM(): boolean {
        return false;
    }

    // 作用：让占位符以“行内”形式参与排版，放在段落里
    isInline(): boolean {
        return true;
    }

    decorate(editor: LexicalEditor, config: EditorConfig): ReactElement<unknown, string | JSXElementConstructor<any>> {
        return (
            <Stack direction="row" alignItems="center" spacing={1}>
                <CircularProgress size={16} />
                <span className="loading-node italic text-xs text-gray-400">
                    {this.__placeholder}
                </span>
            </Stack>
        );
    }

    //节点是否允许为空 若为空，则节点会自动删除
    canBeEmpty(): boolean {
        return false;
    }

    static importJSON(serializedNode: any): LoadingNode {
        return $createLoadingNode(serializedNode.placeholder ?? '');
    }

    exportJSON(): any {
        return {
            ...super.exportJSON(),
            type: 'loading-node',
            version: 1,
            placeholder: this.__placeholder,
        };
    }
}

export function $createLoadingNode(placeholder: string, key?: NodeKey): LoadingNode {
    return new LoadingNode(placeholder, key);
}

export function $isLoadingNode(node: LexicalNode | null | undefined): node is LoadingNode {
    return node instanceof LoadingNode;
}