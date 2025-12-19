import {
	DecoratorNode,
	DOMConversionMap,
	DOMConversionOutput,
	DOMExportOutput,
	EditorConfig,
	LexicalEditor,
	NodeKey,
	SerializedLexicalNode,
	Spread,
} from 'lexical';
import { lazy, Suspense } from 'react';
import React from 'react';

// Lazy load component to avoid loading mermaid immediately
const MermaidComponent = lazy(() => import('@/components/MermaidComponent'));

export type SerializedMermaidNode = Spread<
	{
		code: string;
	},
	SerializedLexicalNode
>;

export class mermaidNode extends DecoratorNode<React.ReactElement> {
	__code: string;

	static getType(): string {
		return 'mermaid';
	}

	static clone(node: mermaidNode): mermaidNode {
		return new mermaidNode(node.__code, node.__key);
	}

	static importJSON(serializedNode: SerializedMermaidNode): mermaidNode {
		const node = $createMermaidNode(serializedNode.code);
		return node;
	}

	constructor(code: string, key?: NodeKey) {
		super(key);
		this.__code = code;
	}

	exportJSON(): SerializedMermaidNode {
		return {
			code: this.__code,
			type: 'mermaid',
			version: 1,
		};
	}

	setCode(code: string): void {
		const writable = this.getWritable();
		writable.__code = code;
	}

	getCode(): string {
		return this.__code;
	}

	createDOM(_config: EditorConfig): HTMLElement {
		const element = document.createElement('div');
		element.className = 'editor-mermaid-node';
		return element;
	}

	updateDOM(): boolean {
		return false;
	}

	decorate(): React.ReactElement {
		return (
			<Suspense fallback={<div>Loading Mermaid...</div>}>
				<MermaidComponent code={this.__code} nodeKey={this.getKey()} />
			</Suspense>
		);
	}
}

export function $createMermaidNode(code: string): mermaidNode {
	return new mermaidNode(code);
}

export function $isMermaidNode(node: any): node is mermaidNode {
	return node instanceof mermaidNode;
}
