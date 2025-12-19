/**
 * 表格鍵盤處理插件
 * 處理表格的 Backspace 和 Delete 鍵刪除及導航
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
	$getTableCellNodeFromLexicalNode,
	$isTableCellNode,
	$isTableNode,
	$isTableRowNode,
	$isTableSelection,
	TableCellNode,
	TableNode,
} from '@lexical/table';
import { $findMatchingParent } from '@lexical/utils';
import {
	$getSelection,
	$isRangeSelection,
	$isRootOrShadowRoot,
	COMMAND_PRIORITY_CRITICAL,
	KEY_BACKSPACE_COMMAND,
	KEY_DELETE_COMMAND,
} from 'lexical';
import { useEffect } from 'react';

/**
 * 刪除表格節點
 */
function $deleteTableNode(tableNode: TableNode): void {
	const nextSibling = tableNode.getNextSibling();
	const prevSibling = tableNode.getPreviousSibling();

	tableNode.remove();

	if (nextSibling) {
		nextSibling.selectStart();
	} else if (prevSibling) {
		prevSibling.selectEnd();
	}
}

/**
 * 檢查選區是否選中了整個表格
 */
function $isEntireTableSelected(tableNode: TableNode): boolean {
	const selection = $getSelection();

	if ($isTableSelection(selection)) {
		const nodes = selection.getNodes();
		const tableKeys = new Set<string>();

		nodes.forEach(node => {
			const table = $findMatchingParent(node, $isTableNode);
			if (table) {
				tableKeys.add(table.getKey());
			}
		});

		return tableKeys.size === 1 && tableKeys.has(tableNode.getKey());
	}

	return false;
}

/**
 * 獲取前一個表格單元格
 */
function $getPreviousTableCell(cell: TableCellNode): TableCellNode | null {
	// 先嘗試獲取同一行的前一個單元格
	const prevSibling = cell.getPreviousSibling();
	if ($isTableCellNode(prevSibling)) {
		return prevSibling;
	}

	// 如果沒有前一個兄弟，嘗試獲取上一行的最後一個單元格
	const row = cell.getParent();
	if ($isTableRowNode(row)) {
		const prevRow = row.getPreviousSibling();
		if ($isTableRowNode(prevRow)) {
			const lastCell = prevRow.getLastChild();
			if ($isTableCellNode(lastCell)) {
				return lastCell;
			}
		}
	}

	return null;
}

/**
 * 獲取下一個表格單元格
 */
function $getNextTableCell(cell: TableCellNode): TableCellNode | null {
	// 先嘗試獲取同一行的下一個單元格
	const nextSibling = cell.getNextSibling();
	if ($isTableCellNode(nextSibling)) {
		return nextSibling;
	}

	// 如果沒有下一個兄弟，嘗試獲取下一行的第一個單元格
	const row = cell.getParent();
	if ($isTableRowNode(row)) {
		const nextRow = row.getNextSibling();
		if ($isTableRowNode(nextRow)) {
			const firstCell = nextRow.getFirstChild();
			if ($isTableCellNode(firstCell)) {
				return firstCell;
			}
		}
	}

	return null;
}

export function TableKeyboardPlugin(): null {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		const removeBackspaceHandler = editor.registerCommand(
			KEY_BACKSPACE_COMMAND,
			(event) => {
				const selection = $getSelection();

				// 處理表格選區
				if ($isTableSelection(selection)) {
					const nodes = selection.getNodes();
					const tables = new Set<TableNode>();

					nodes.forEach(node => {
						const table = $findMatchingParent(node, $isTableNode);
						if ($isTableNode(table)) {
							tables.add(table);
						}
					});

					if (tables.size === 1) {
						const tableNode = Array.from(tables)[0];
						if ($isEntireTableSelected(tableNode)) {
							event.preventDefault();
							$deleteTableNode(tableNode);
							return true;
						}
					}
				}

				// 處理普通選區
				if ($isRangeSelection(selection)) {
					const anchor = selection.anchor;
					const anchorNode = anchor.getNode();

					// 獲取當前單元格
					const cell = $getTableCellNodeFromLexicalNode(anchorNode);

					if (cell) {
						// 檢查是否在單元格開頭且單元格為空
						const cellTextContent = cell.getTextContent();
						const isAtStart = anchor.offset === 0;
						const isCellEmpty = cellTextContent.trim() === '';

						// 如果在單元格開頭位置且單元格為空
						if (isAtStart && isCellEmpty) {
							const row = cell.getParent();

							// 檢查是否是行的第一個單元格
							const isFirstCellInRow = cell.getPreviousSibling() === null;

							// 如果是第一個單元格，檢查整行是否為空
							if (isFirstCellInRow && $isTableRowNode(row)) {
								const rowTextContent = row.getTextContent().trim();
								const isRowEmpty = rowTextContent === '';

								// 如果整行為空，刪除整行
								if (isRowEmpty) {
									const prevRow = row.getPreviousSibling();

									// 如果有上一行，刪除當前行並移動到上一行最後一個單元格
									if ($isTableRowNode(prevRow)) {
										const lastCellOfPrevRow = prevRow.getLastChild();
										event.preventDefault();
										row.remove();
										if ($isTableCellNode(lastCellOfPrevRow)) {
											lastCellOfPrevRow.selectEnd();
										}
										return true;
									} else {
										// 如果沒有上一行（這是第一行），檢查是否可以刪除整個表格
										const table = $findMatchingParent(cell, $isTableNode);
										if ($isTableNode(table)) {
											const tableContent = table.getTextContent().trim();
											if (tableContent === '') {
												event.preventDefault();
												$deleteTableNode(table);
												return true;
											}
										}
									}
								}
							}

							// 如果不是第一個單元格，或行不為空，移動到前一個單元格
							const prevCell = $getPreviousTableCell(cell);
							if (prevCell) {
								event.preventDefault();
								prevCell.selectEnd();
								return true;
							}
						}
					}
				}

				return false;
			},
			COMMAND_PRIORITY_CRITICAL
		);

		const removeDeleteHandler = editor.registerCommand(
			KEY_DELETE_COMMAND,
			(event) => {
				const selection = $getSelection();

				// 處理表格選區
				if ($isTableSelection(selection)) {
					const nodes = selection.getNodes();
					const tables = new Set<TableNode>();

					nodes.forEach(node => {
						const table = $findMatchingParent(node, $isTableNode);
						if ($isTableNode(table)) {
							tables.add(table);
						}
					});

					if (tables.size === 1) {
						const tableNode = Array.from(tables)[0];
						if ($isEntireTableSelected(tableNode)) {
							event.preventDefault();
							$deleteTableNode(tableNode);
							return true;
						}
					}
				}

				// 處理普通選區 - Delete 鍵移動到下一個單元格（如果當前為空）
				if ($isRangeSelection(selection)) {
					const anchor = selection.anchor;
					const anchorNode = anchor.getNode();

					const cell = $getTableCellNodeFromLexicalNode(anchorNode);

					if (cell) {
						const cellTextContent = cell.getTextContent();
						const isCellEmpty = cellTextContent.trim() === '';

						if (isCellEmpty) {
							const nextCell = $getNextTableCell(cell);
							if (nextCell) {
								event.preventDefault();
								nextCell.selectStart();
								return true;
							} else {
								// 如果是最後一個單元格且為空，檢查是否可以刪除整個表格
								const table = $findMatchingParent(cell, $isTableNode);
								if ($isTableNode(table)) {
									const tableContent = table.getTextContent().trim();
									if (tableContent === '') {
										event.preventDefault();
										$deleteTableNode(table);
										return true;
									}
								}
							}
						}
					}
				}

				return false;
			},
			COMMAND_PRIORITY_CRITICAL
		);

		return () => {
			removeBackspaceHandler();
			removeDeleteHandler();
		};
	}, [editor]);

	return null;
}

