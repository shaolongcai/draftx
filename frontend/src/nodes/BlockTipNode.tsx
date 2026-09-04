// MathNode.ts
import { Stack } from '@mui/material';
import { DecoratorNode, LexicalNode, NodeKey, EditorConfig, LexicalEditor, $isTextNode, $isParagraphNode } from 'lexical';
import { ReactElement, JSXElementConstructor } from 'react';

// ElementNode是普通节点，才拥有append方法
export class BlockTipNode extends DecoratorNode<React.ReactElement> {
    private __placeholder: string

    static getType(): string {
        return 'block-tip-node';
    }

    static clone(node: BlockTipNode): BlockTipNode {
        return new BlockTipNode(node.__placeholder, node.__key);
    }

    constructor(placeholder: string, key?: NodeKey) {
        super(key);
        this.__placeholder = placeholder;
    }

    createDOM(config: EditorConfig): HTMLElement {
        const element = document.createElement('span');
        element.className = 'block-tip-node';
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

    // 是否可以被选中
    isKeyboardSelectable(): boolean {
        return false;
    }

    decorate(editor: LexicalEditor, config: EditorConfig): ReactElement<unknown, string | JSXElementConstructor<any>> {
        return (
            <span
                className="block-tip-node italic text-xs text-gray-400 cursor-text"
                onClick={() => {
                    editor.update(() => {
                        const pNode = this.getParent();
                        if (pNode && $isParagraphNode(pNode)) {
                            pNode.selectStart();
                        }
                    })
                }}
            >
                {this.__placeholder}
            </span>
        );
    }

    //节点是否允许为空 若为空，则节点会自动删除
    canBeEmpty(): boolean {
        return false;
    }

    static importJSON(serializedNode: any): BlockTipNode {
        return $createBlockTipNode(serializedNode.placeholder ?? '');
    }

    exportJSON(): any {
        return {
            ...super.exportJSON(),
            type: 'block-tip-node',
            version: 1,
            placeholder: this.__placeholder,
        };
    }
}

export function $createBlockTipNode(placeholder: string, key?: NodeKey): BlockTipNode {
    return new BlockTipNode(placeholder, key);
}

export function $isBlockTipNode(node: LexicalNode | null | undefined): node is BlockTipNode {
    return node instanceof BlockTipNode;
}