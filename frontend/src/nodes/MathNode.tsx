// MathNode.ts
import { DecoratorNode, LexicalNode, NodeKey, EditorConfig, RangeSelection, ElementNode, $createParagraphNode } from 'lexical';

// ElementNode是普通节点，才拥有append方法
export class MathNode extends ElementNode {

  static getType(): string {
    return 'math-node';
  }

  static clone(node: MathNode): MathNode {
    return new MathNode(node.__key);
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
      'after:text-center'
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


  static importJSON(serializedNode: any): MathNode {
    return $createMathNode();
  }

  exportJSON(): any {
    return {
      ...super.exportJSON(),
      type: 'math-node',
      version: 1,
    };
  }
}

export function $createMathNode(): MathNode {
  console.log('创建计算节点')
  return new MathNode();
}

export function $isMathNode(node: LexicalNode | null | undefined): node is MathNode {
  return node instanceof MathNode;
}