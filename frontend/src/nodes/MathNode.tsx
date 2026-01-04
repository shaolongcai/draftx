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
    element.className = 'rounded border border-gray-200 p-2 space-y-1';
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





  //节点是否允许为空 若为空，则节点会自动删除
  // canBeEmpty(): boolean {
  //   if (this.getChildrenSize() === 0) {
  //   return true;
  // }
  // // Don't allow empty nodes during editing
  // return false;
  // }

  // canIndent(): false {
  //   return false;
  // }

  // Add this to handle Enter key



  // setExpression(expression: string) {
  //   this.__expression = expression;
  //   // 这里可以添加计算逻辑
  //   try {
  //     this.__result = String(eval(expression)); // 注意：实际项目中应该使用更安全的计算方式
  //   } catch (e) {
  //     this.__result = 'Error';
  //   }
  // }


  // 装饰器：插入任意视图
  decorate(): React.ReactElement {
    return (
      <div className="math-node" >
        数学模块
      </div>
    );
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