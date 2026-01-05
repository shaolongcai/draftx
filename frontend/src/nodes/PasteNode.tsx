import { LexicalNode, NodeKey, EditorConfig, ElementNode } from 'lexical';

// ElementNode是普通节点，才拥有append方法
export class PasteNode extends ElementNode {

    static getType(): string {
        return 'paste-node';
    }

    static clone(node: PasteNode): PasteNode {
        return new PasteNode(node.__key);
    }

    constructor(key?: NodeKey) {
        super(key);
    }

    createDOM(config: EditorConfig): HTMLElement {
        const element = document.createElement('div');
        element.className = 'space-y-1'; //border border-gray-200 边框
        element.appendChild
        return element;
    }

    updateDOM(): boolean {
        return false;
    }

    insertAfter(nodeToInsert: LexicalNode, restoreSelection?: boolean): LexicalNode {
        return super.insertAfter(nodeToInsert, restoreSelection);
    }

    canBeEmpty(): boolean {
        return true;
    }


    static importJSON(serializedNode: any): PasteNode {
        return $createPasteNode();
    }

    exportJSON(): any {
        return {
            ...super.exportJSON(),
            type: 'paste-node',
            version: 1,
        };
    }
}

export function $createPasteNode(): PasteNode {
    console.log('创建粘贴节点')
    return new PasteNode();
}

export function $isPasteNode(node: LexicalNode | null | undefined): node is PasteNode {
    return node instanceof PasteNode;
}