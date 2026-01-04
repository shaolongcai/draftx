// MathNode.ts
import { Stack } from '@mui/material';
import { DecoratorNode, LexicalNode, NodeKey, EditorConfig, RangeSelection, ElementNode, $createParagraphNode, TextNode, LexicalEditor } from 'lexical';
import { ReactElement, JSXElementConstructor } from 'react';

// ElementNode是普通节点，才拥有append方法
export class BlockTipNode extends DecoratorNode<React.ReactElement> {

    static getType(): string {
        return 'block-tip-node';
    }

    static clone(node: BlockTipNode): BlockTipNode {
        return new BlockTipNode(node.__key);
    }

    constructor(key?: NodeKey) {
        super(key);
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

    decorate(editor: LexicalEditor, config: EditorConfig): ReactElement<unknown, string | JSXElementConstructor<any>> {
        return (
            <span className="block-tip-node italic text-xs text-gray-400">
                    这是一个计算模块，你可以直接计算表达式，例如：2+2，敲击 = 的时候，会自动得出4
                </span>
        );
    }

    //节点是否允许为空 若为空，则节点会自动删除
    canBeEmpty(): boolean {
        return false;
    }

    static importJSON(serializedNode: any): BlockTipNode {
        return $createBlockTipNode();
    }

    exportJSON(): any {
        return {
            ...super.exportJSON(),
            type: 'block-tip-node',
            version: 1,
        };
    }
}

export function $createBlockTipNode(): BlockTipNode {
    return new BlockTipNode();
}

export function $isBlockTipNode(node: LexicalNode | null | undefined): node is BlockTipNode {
    return node instanceof BlockTipNode;
}