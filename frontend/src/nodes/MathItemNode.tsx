// MathNode.ts
import { DecoratorNode, LexicalNode, NodeKey, EditorConfig, RangeSelection, ElementNode, $createParagraphNode, TextNode } from 'lexical';

// ElementNode是普通节点，才拥有append方法
export class MathItemNode extends TextNode {

    static getType(): string {
        return 'math-item-node';
    }

    // 克隆节点时，需要指定key，否则会报错
    static clone(node: MathItemNode): MathItemNode {
        return new MathItemNode(node.__text, node.__key);
    }

    constructor(text: string, key?: NodeKey) {
        super(text, key);
    }

    createDOM(config: EditorConfig): HTMLElement {
        const element = document.createElement('span');
        element.className = 'math-item-node';
        element.contentEditable = 'true';
        return element;
    }

    updateDOM(): boolean {
        return false;
    }

    insertAfter(nodeToInsert: LexicalNode, restoreSelection?: boolean): LexicalNode {
        return super.insertAfter(nodeToInsert, restoreSelection);
    }


    //节点是否允许为空 若为空，则节点会自动删除
    canBeEmpty(): boolean {
        return false;
    }

    // canIndent(): false {
    //   return false;
    // }

    // Add this to handle Enter key


    static importJSON(serializedNode: any): MathItemNode {
        return $createMathItemNode(serializedNode.text ?? '');
    }

    exportJSON(): any {
        return {
            ...super.exportJSON(),
            type: 'math-item-node',
            version: 1,
            text: this.__text,
        };
    }
}

export function $createMathItemNode(text?: string): MathItemNode {
    console.log('创建计算节点')
    return new MathItemNode(text ?? '');
}

export function $isMathItemNode(node: LexicalNode | null | undefined): node is MathItemNode {
    return node instanceof MathItemNode;
}