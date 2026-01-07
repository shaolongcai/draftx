// MathNode.ts
import { Stack } from '@mui/material';
import { DecoratorNode, LexicalNode, NodeKey, EditorConfig, RangeSelection, ElementNode, $createParagraphNode, TextNode, LexicalEditor } from 'lexical';
import { ReactElement, JSXElementConstructor } from 'react';

// ElementNode是普通节点，才拥有append方法
export class BlockTitleNode extends DecoratorNode<React.ReactElement> {

    private __title: string;
    private __tip?: string

    static getType(): string {
        return 'block-title-node';
    }

    static clone(node: BlockTitleNode): BlockTitleNode {
        return new BlockTitleNode(node.__title, node.__tip, node.__key);
    }

    constructor(title: string, tip: string, key?: NodeKey) {
        super(key);
        this.__title = title;
        this.__tip = tip || 'Press Alt + Enter to exit the block';
    }

    createDOM(config: EditorConfig): HTMLElement {
        const element = document.createElement('span');
        element.className = 'block-title-node';
        element.contentEditable = 'true';
        return element;
    }

    updateDOM(): boolean {
        return false;
    }

    decorate(editor: LexicalEditor, config: EditorConfig): ReactElement<unknown, string | JSXElementConstructor<any>> {
        return (
            <Stack direction="row" alignItems="center" spacing={0.5} className='mb-2' >
                <span className="block-title-node italic text-xs text-[#264F87]">{this.__title}</span>
                <span className="block-title-node italic text-xs text-gray-400">
                    {this.__tip}
                </span>
            </Stack>
        );
    }

    //节点是否允许为空 若为空，则节点会自动删除
    canBeEmpty(): boolean {
        return false;
    }

    static importJSON(serializedNode: any): BlockTitleNode {
        return $createBlockTitleNode(serializedNode.title ?? '', serializedNode.tip ?? '');
    }

    exportJSON(): any {
        return {
            ...super.exportJSON(),
            type: 'block-title-node',
            version: 1,
            title: this.__title,
            tip: this.__tip,
        };
    }
}

export function $createBlockTitleNode(title: string, tip: string): BlockTitleNode {
    return new BlockTitleNode(title, tip);
}

export function $isBlockTitleNode(node: LexicalNode | null | undefined): node is BlockTitleNode {
    return node instanceof BlockTitleNode;
}