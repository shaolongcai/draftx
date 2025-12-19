
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createMermaidNode, mermaidNode } from '@/nodes/MermaidNode';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand } from 'lexical';
import { CodeNode } from '@lexical/code';
import { useEffect } from 'react';

export const INSERT_MERMAID_COMMAND: LexicalCommand<string> = createCommand();

export function MermaidPlugin(): null {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		if (!editor.hasNodes([mermaidNode])) {
			throw new Error('MermaidPlugin: MermaidNode not registered on editor');
		}

		const removeCommand = editor.registerCommand<string>(
			INSERT_MERMAID_COMMAND,
			(payload) => {
				const mermaidNode = $createMermaidNode(payload || 'graph TD;\nA-->B;');
				$insertNodeToNearestRoot(mermaidNode);
				return true;
			},
			COMMAND_PRIORITY_EDITOR,
		);

		// 監聽 CodeNode 變化，如果語言是 mermaid，則轉換為 MermaidNode
		const removeTransform = editor.registerNodeTransform(CodeNode, (node) => {
			if (node.getLanguage() === 'mermaid') {
				const code = node.getTextContent();
				const mermaidNodeInstance = $createMermaidNode(code);
				node.replace(mermaidNodeInstance);
			}
		});

		return () => {
			removeCommand();
			removeTransform();
		};
	}, [editor]);

	return null;
}
