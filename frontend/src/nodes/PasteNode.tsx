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
        // 容器样式
        const containerClasses = [
            'space-y-1',
            // 'border', 'border-gray-200',
            'rounded-lg',
            'my-2',
            'relative',
            'pb-8', // 底部留白
            // 'bg-[#FAF7EF]' // 假设的背景色，匹配截图的暖色调
        ];

        // 虚线样式 (::before)
        const lineClasses = [
            'before:content-[""]',
            'before:absolute',
            'before:bottom-3',
            'before:left-4',
            'before:right-4',
            'before:border-b',
            'before:border-dashed',
            'before:border-gray-300'
        ];

        // 文字样式 (::after)
        const textClasses = [
            'after:content-[attr(data-tip)]',
            'after:absolute',
            'after:bottom-1.5',
            'after:left-1/2',
            'after:-translate-x-1/2',
            'after:bg-[#F9F3E5]', // 背景色遮挡虚线
            'after:px-2',
            'after:text-xs',
            'after:text-gray-400',
            // 文字居中
            'after:text-center',
            // 图标样式
            'after:pl-5', // 给图标留出空间
            `after:bg-[url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="%234ade80" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>')]`,
            'after:bg-[length:12px_12px]', // 图标大小
            'after:bg-[left_4px_center]', // 图标位置
            'after:bg-no-repeat'
        ];

        element.className = [...containerClasses, ...lineClasses, ...textClasses].join(' ');
        element.setAttribute('data-tip', 'Press Alt + Enter to exit');
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