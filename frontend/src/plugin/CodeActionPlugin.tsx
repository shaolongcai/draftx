import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
	$getSelection,
	$isRangeSelection,
	COMMAND_PRIORITY_LOW,
	COMMAND_PRIORITY_CRITICAL,
	KEY_ARROW_DOWN_COMMAND,
	KEY_MODIFIER_COMMAND,
	$createParagraphNode,
	$insertNodes,
	KEY_ENTER_COMMAND,
	CLICK_COMMAND,
	$getRoot
} from 'lexical';
import { $isCodeNode } from '@lexical/code';
import { $isQuoteNode } from '@lexical/rich-text';
import { $isTableNode } from '@lexical/table';
import { useEffect } from 'react';

/**
 * 處理代碼塊的導航和跳出
 * - Ctrl + Enter: 強制跳出代碼塊並在下方插入新行
 * - Arrow Down: 在代碼塊底部按向下鍵時跳出
 */
export function CodeActionPlugin(): null {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		// 處理 Ctrl + Enter
		const removeEnterListener = editor.registerCommand(
			KEY_ENTER_COMMAND,
			(event: KeyboardEvent) => {
				if (event.ctrlKey || event.metaKey) {
					const selection = $getSelection();
					if ($isRangeSelection(selection) && selection.isCollapsed()) {
						const node = selection.anchor.getNode();
						const codeNode = $isCodeNode(node) ? node : node.getParent();

						if ($isCodeNode(codeNode)) {
							event.preventDefault();
							editor.update(() => {
								const paragraph = $createParagraphNode();
								codeNode.insertAfter(paragraph);
								paragraph.select();
							});
							return true;
						}
					}
				}
				return false;
			},
			COMMAND_PRIORITY_CRITICAL
		);

		// 處理 Arrow Down
		const removeArrowDownListener = editor.registerCommand(
			KEY_ARROW_DOWN_COMMAND,
			(event: KeyboardEvent) => {
				const selection = $getSelection();
				if ($isRangeSelection(selection) && selection.isCollapsed()) {
					const node = selection.anchor.getNode();
					const codeNode = $isCodeNode(node) ? node : node.getParent();

					if ($isCodeNode(codeNode)) {
						// 檢查是否是最後一個子節點
						const nextSibling = codeNode.getNextSibling();
						if (!nextSibling) {
							// 如果沒有下一個兄弟節點，說明是文檔末尾
							// 檢查游標是否在代碼塊末尾（這裡簡化處理，如果是最後一個節點就允許跳出）
							// 更精確的檢查比較複雜，這裡為了用戶體驗，如果是在最後一個代碼塊按向下，就插入新行
							event.preventDefault();
							editor.update(() => {
								const paragraph = $createParagraphNode();
								codeNode.insertAfter(paragraph);
								paragraph.select();
							});
							return true;
						}
					}
				}
				return false;
			},
			COMMAND_PRIORITY_CRITICAL
		);

		// 處理點擊編輯器底部空白區域
		const removeClickListener = editor.registerCommand(
			CLICK_COMMAND,
			(event: MouseEvent) => {
				const rootElement = editor.getRootElement();
				if (!rootElement) return false;

				// 檢查點擊是否發生在 root 元素本身（即點擊了 padding 或空白區域）
				// 或者點擊的是 root 的直接子元素的邊緣外（這比較難判斷，主要依賴 event.target）
				if (event.target === rootElement) {
					// 檢查最後一個節點是否是特殊塊（代碼塊、表格、引用）
					let shouldInsert = false;
					editor.getEditorState().read(() => {
						const root = $getRoot();
						const lastChild = root.getLastChild();

						if ($isCodeNode(lastChild) || $isTableNode(lastChild) || $isQuoteNode(lastChild)) {
							// 檢查點擊位置是否在最後一個節點的下方
							// 這需要獲取最後一個節點的 DOM 元素
							const lastChildKey = lastChild.getKey();
							const lastChildElement = editor.getElementByKey(lastChildKey);

							if (lastChildElement) {
								const rect = lastChildElement.getBoundingClientRect();
								// 如果點擊的 Y 坐標大於最後一個元素的底部
								if (event.clientY > rect.bottom) {
									shouldInsert = true;
								}
							}
						}
					});

					if (shouldInsert) {
						event.preventDefault(); // 防止默認行為
						editor.update(() => {
							const root = $getRoot();
							const paragraph = $createParagraphNode();
							root.append(paragraph);
							paragraph.select();
						});
						return true;
					}
				}
				return false;
			},
			COMMAND_PRIORITY_CRITICAL
		);

		return () => {
			removeEnterListener();
			removeArrowDownListener();
			removeClickListener();
		};
	}, [editor]);

	return null;
}
