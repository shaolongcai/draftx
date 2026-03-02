import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { 
    $getSelection, 
    $isRangeSelection, 
    $isTextNode, 
    $getNodeByKey,
    $isParagraphNode
} from 'lexical';

export function StatisticsPlugin(): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerUpdateListener(({ editorState, prevEditorState, tags }) => {
            if (tags.has('historic')) return;

            editorState.read(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection) || !selection.isCollapsed()) return;
                
                const node = selection.anchor.getNode();
                if (!$isTextNode(node)) return;

                const text = node.getTextContent();
                
                // Regex matches "sum:" or "average:" (case insensitive) at the end of the string
                // Supports English colon (:) and Chinese colon (：)
                const match = text.match(/(sum|avg)[:：]\s*$/i);
                
                if (!match) return;

                const type = match[1].toLowerCase(); // sum or average
                
                // Check if the trigger was caused by typing the colon
                let shouldTrigger = false;
                try {
                    prevEditorState.read(() => {
                        const prevNode = $getNodeByKey(node.getKey());
                        if ($isTextNode(prevNode)) {
                            const prevText = prevNode.getTextContent();
                            // Trigger if text length increased by 1 and it starts with prevText
                            // This implies the user just typed the last character (the colon)
                            if (text.length === prevText.length + 1 && text.startsWith(prevText)) {
                                shouldTrigger = true;
                            }
                        }
                    });
                } catch (e) {
                    // In case prevNode doesn't exist or other errors
                }
                
                if (!shouldTrigger) return;

                // Collect numbers from previous lines (siblings of the block)
                const numbers: number[] = [];
                const currentBlock = node.getParent();
                
                if ($isParagraphNode(currentBlock)) {
                    let sibling = currentBlock.getPreviousSibling();
                    
                    while (sibling) {
                        const siblingText = sibling.getTextContent().trim();
                        
                        // Stop at empty line
                        if (siblingText === '') {
                            break;
                        }
                        
                        // Extract last number in the line
                        // Matches a number at the end of the line
                        const numMatch = siblingText.match(/(\d+(?:\.\d+)?)\s*$/);
                        
                        if (numMatch) {
                            const value = parseFloat(numMatch[1]);
                            if (!isNaN(value)) {
                                numbers.push(value);
                            }
                        }
                        // If no number found (e.g. "asd"), just skip this line but continue searching
                        // unless it was empty (handled above)
                        
                        sibling = sibling.getPreviousSibling();
                    }
                }
                
                if (numbers.length === 0) return;
                
                // Calculate result
                let result = 0;
                if (type === 'sum') {
                    result = numbers.reduce((a, b) => a + b, 0);
                } else if (type === 'average' || type === 'avg') {
                    result = numbers.reduce((a, b) => a + b, 0) / numbers.length;
                }
                
                // Format result: remove unnecessary trailing zeros if decimal
                const resultStr = Number.isInteger(result) ? result.toString() : parseFloat(result.toFixed(2)).toString();
                
                // Insert result
                editor.update(() => {
                    const writableNode = $getNodeByKey(node.getKey());
                    if ($isTextNode(writableNode)) {
                        // Double check content hasn't changed in the meantime
                        if (writableNode.getTextContent() === text) {
                            // Insert a space and the number
                            // Use spliceText to append text to the current node
                            // offset, delCount, newText, moveSelection
                            writableNode.spliceText(text.length, 0, ` ${resultStr}`, true);
                        }
                    }
                });
            });
        });
    }, [editor]);

    return null;
}
