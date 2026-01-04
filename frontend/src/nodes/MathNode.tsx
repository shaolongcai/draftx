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
    element.className = 'space-y-1'; //border border-gray-200 边框
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