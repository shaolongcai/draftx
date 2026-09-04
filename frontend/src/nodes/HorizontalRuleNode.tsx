import { DecoratorNode, LexicalNode, NodeKey, EditorConfig, LexicalEditor } from 'lexical';
import { ReactElement, JSXElementConstructor } from 'react';
import { Divider } from '@mui/material';

export class HorizontalRuleNode extends DecoratorNode<React.ReactElement> {
    static getType(): string {
        return 'horizontal-rule';
    }

    static clone(node: HorizontalRuleNode): HorizontalRuleNode {
        return new HorizontalRuleNode(node.__key);
    }

    static importJSON(serializedNode: any): HorizontalRuleNode {
        return $createHorizontalRuleNode();
    }

    exportJSON(): any {
        return {
            type: 'horizontal-rule',
            version: 1,
        };
    }

    createDOM(config: EditorConfig): HTMLElement {
        const div = document.createElement('div');
        div.style.display = 'contents';
        return div;
    }

    updateDOM(): boolean {
        return false;
    }

    // 不可选中
    isKeyboardSelectable(): boolean {
        return false;
    }

    decorate(editor: LexicalEditor, config: EditorConfig): ReactElement<unknown, string | JSXElementConstructor<any>> {
        return <Divider className="my-4 border-dashed border-gray-300 select-none" />;
    }
}

export function $createHorizontalRuleNode(): HorizontalRuleNode {
    return new HorizontalRuleNode();
}

export function $isHorizontalRuleNode(node: LexicalNode | null | undefined): node is HorizontalRuleNode {
    return node instanceof HorizontalRuleNode;
}