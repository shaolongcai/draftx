import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $convertFromMarkdownString } from '@lexical/markdown';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  PASTE_COMMAND
} from 'lexical';
import { useEffect } from 'react';
import { DEFAULT_TRANSFORMERS } from './MarkdownShortcutPlugin';

/**
 * 預處理 Markdown 文本
 * - 處理嵌套引用（> > → >）
 * - 移除引用塊內多餘的 > 前綴
 */
function preprocessMarkdown(text: string): string {
  // 處理嵌套引用：將多層 > 簡化為單層
  // Markdown 嵌套引用格式可能是 ">> " 或 "> > " 或 "> > > "
  // 例如：> > 嵌套引用 → > 嵌套引用
  let processed = text.replace(/^((?:>\s*)+)/gm, (match) => {
    // 計算 > 的數量來確定嵌套層級
    const level = (match.match(/>/g) || []).length;
    // 始終使用單個 > 前綴
    return '> ';
  });

  return processed;
}

/**
 * 處理粘貼 Markdown 文本的插件
 * 當用戶粘貼 Markdown 內容時，自動轉換為對應的編輯器節點
 */
export function MarkdownPastePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) {
          return false;
        }

        // 檢查是否為純文本（markdown）
        const text = clipboardData.getData('text/plain');
        const html = clipboardData.getData('text/html');

        // 如果有 HTML 內容，讓默認處理（可能是從其他編輯器粘貼的富文本）
        if (html && html.trim().length > 0) {
          return false;
        }

        // 如果是純文本，嘗試轉換為 markdown
        if (text && text.trim().length > 0) {
          // 檢查是否包含 markdown 語法特徵
          const markdownPatterns = [
            /^#{1,6}\s/m,           // 標題
            /^[-*+]\s/m,            // 無序列表
            /^\d+\.\s/m,            // 有序列表
            /^>\s/m,                // 引用
            /```[\s\S]*?```/,       // 代碼塊
            /`[^`]+`/,              // 行內代碼
            /\[.*?\]\(.*?\)/,       // 鏈接
            /^\*\*\*|^---|^___/m,   // 水平線
            /\*\*.*?\*\*/,          // 粗體
            /\*.*?\*/,              // 斜體
            /\~\~.*?\~\~/,          // 刪除線
            /^\|.+\|$/m,            // 表格行
          ];

          const hasMarkdownSyntax = markdownPatterns.some(pattern => pattern.test(text));

          if (hasMarkdownSyntax) {
            event.preventDefault();
            event.stopPropagation();

            // 預處理 Markdown 文本
            const processedText = preprocessMarkdown(text);

            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                // 刪除選中的內容
                selection.removeText();
              }

              // 轉換 markdown 文本為編輯器節點
              $convertFromMarkdownString(processedText, DEFAULT_TRANSFORMERS);
            });
            return true;
          }
        }

        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  return null;
}
