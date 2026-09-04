
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef } from 'react';
import { $getSelection, $isRangeSelection, $isTextNode, $getNodeByKey, TextNode } from 'lexical';
import { $createCurrencyConversionNode, $isCurrencyConversionNode, CurrencyConversionNode } from '../nodes/CurrencyConversionNode';
import { isValidCurrency } from '../utils/currencyUtils';
import { $createBlockTipNode } from '../nodes/BlockTipNode';

export function CurrencyConversionPlugin(): null {
    const [editor] = useLexicalComposerContext();
    // Cache to prevent infinite loop or re-inserting when user deletes the result
    // Key: NodeKey, Value: last matched expression string (e.g., "1CNY")
    const lastExprRef = useRef<Map<string, string>>(new Map());

    useEffect(() => {
        return editor.registerUpdateListener(({ editorState, tags }) => {
            if (tags.has('historic')) return;

            editorState.read(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) return;
                
                const node = selection.anchor.getNode();
                if (!$isTextNode(node)) return;

                const text = node.getTextContent();
                const nodeKey = node.getKey();

                // Must contain '='
                if (!text.includes('=')) {
                    if (lastExprRef.current.has(nodeKey)) {
                        lastExprRef.current.delete(nodeKey);
                    }
                    return;
                }

                // Find all '=' positions
                const equalIndices: number[] = [];
                for (let i = 0; i < text.length; i++) {
                    if (text[i] === '=') equalIndices.push(i);
                }

                // Process from last '=' backwards
                for (let i = equalIndices.length - 1; i >= 0; i--) {
                    const equalIndex = equalIndices[i];

                    // 1. Extract potential expression
                    const prevEqualIndex = i > 0 ? equalIndices[i - 1] : -1;
                    const sliceStart = prevEqualIndex + 1;
                    const potentialExpr = text.slice(sliceStart, equalIndex);

                    // Regex to match: Number + Optional Space + 3-letter Currency Code at the end
                    const regex = /(\d+(?:\.\d+)?)\s*([A-Za-z]{3})\s*$/;
                    const match = potentialExpr.match(regex);

                    if (!match) continue;

                    const [fullMatch, valueStr, unitStr] = match;
                    const upperUnit = unitStr.toUpperCase();

                    // Validate currency
                    if (!isValidCurrency(upperUnit)) continue;
                    
                    const originalValue = parseFloat(valueStr);

                    // 2. Check node state
                    const suffix = text.slice(equalIndex + 1);
                    if (suffix.trim().length > 0) {
                        continue;
                    }

                    const lastExpr = lastExprRef.current.get(nodeKey);
                    const nextSibling = node.getNextSibling();
                    
                    // Unique key for this expression state
                    const exprKey = `${valueStr}${upperUnit}`;

                    if ($isCurrencyConversionNode(nextSibling)) {
                        // Scenario A: Result node exists -> Update result if needed
                        const siblingNode = nextSibling as CurrencyConversionNode;
                        
                        if (siblingNode.__originalValue !== originalValue || siblingNode.__originalUnit !== upperUnit) {
                             editor.update(() => {
                                const writableResultNode = $getNodeByKey(siblingNode.getKey());
                                if ($isCurrencyConversionNode(writableResultNode)) {
                                    // Preserve target unit
                                    const currentTarget = writableResultNode.__targetUnit;
                                    const newNode = $createCurrencyConversionNode(originalValue, upperUnit, currentTarget);
                                    writableResultNode.replace(newNode);
                                    lastExprRef.current.set(nodeKey, exprKey);
                                }
                            });
                        } else {
                            // Consistent
                            lastExprRef.current.set(nodeKey, exprKey);
                        }
                    } else {
                        // Scenario B: Result node does not exist -> Insert new node
                        if (lastExpr === exprKey) {
                            return;
                        }

                        // Check online status
                        if (!navigator.onLine) {
                            // Insert BlockTipNode if offline
                            editor.update(() => {
                                const writableNode = $getNodeByKey(nodeKey);
                                if ($isTextNode(writableNode)) {
                                    const tipNode = $createBlockTipNode("Currency conversion is unavailable offline.");
                                    writableNode.insertAfter(tipNode);
                                    lastExprRef.current.set(nodeKey, exprKey);
                                    tipNode.selectNext();
                                }
                            });
                            return;
                        }

                        // Insert CurrencyConversionNode
                        editor.update(() => {
                            const writableNode = $getNodeByKey(nodeKey);
                            if ($isTextNode(writableNode)) {
                                const targetUnit = 'USD'; // Default target
                                const newResultNode = $createCurrencyConversionNode(originalValue, upperUnit, targetUnit);
                                writableNode.insertAfter(newResultNode);
                                lastExprRef.current.set(nodeKey, exprKey);
                                // Move selection to end of new node
                                newResultNode.selectNext(); 
                            }
                        });
                    }
                    
                    // Processed one valid conversion, stop looking back
                    return;
                }
            });
        });
    }, [editor]);

    return null;
}
