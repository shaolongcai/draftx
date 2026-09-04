import { DecoratorNode, LexicalNode, NodeKey, EditorConfig } from 'lexical';
import { ReactElement } from 'react';
import { useTheme } from '@mui/material/styles';

function CaluResultComponent({ result }: { result: string }) {
    const theme = useTheme();
    return (
        <span
            style={{ color: theme.palette.primary.main }}
            className="select-none font-bold"
        >
            {result}
        </span>
    );
}

export class CaluResultNode extends DecoratorNode<ReactElement> {
    __result: string;

    static getType(): string {
        return 'calu-result-node';
    }

    static clone(node: CaluResultNode): CaluResultNode {
        return new CaluResultNode(node.__result, node.__key);
    }

    constructor(result: string, key?: NodeKey) {
        super(key);
        this.__result = result;
    }

    static importJSON(serializedNode: any): CaluResultNode {
        return $createCaluResultNode(serializedNode.result);
    }

    exportJSON(): any {
        return {
            ...super.exportJSON(),
            type: 'calu-result-node',
            version: 1,
            result: this.__result,
        };
    }

    createDOM(_config: EditorConfig): HTMLElement {
        const span = document.createElement('span');
        span.className = 'calu-result-node';
        return span;
    }

    updateDOM(): boolean {
        return false;
    }

    decorate(): ReactElement {
        return <CaluResultComponent result={this.__result} />;
    }

    isInline(): boolean {
        return true;
    }

    isKeyboardSelectable(): boolean {
        return false;
    }
}

export function $createCaluResultNode(result: string): CaluResultNode {
    return new CaluResultNode(result);
}

export function $isCaluResultNode(node: LexicalNode | null | undefined): node is CaluResultNode {
    return node instanceof CaluResultNode;
}