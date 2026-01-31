import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef } from 'react';
import { $getSelection, $isRangeSelection, $isTextNode, $getNodeByKey } from 'lexical';
import { $createUnitConversionNode, $isUnitConversionNode, UnitConversionNode } from '../nodes/UnitConversionNode';
import { isValidUnit, getDefaultTargetUnit, convertUnit, normalizeUnit } from '../utils/unitConversion';

export function UnitConversionPlugin(): null {
    const [editor] = useLexicalComposerContext();
    // Cache to prevent infinite loop or re-inserting when user deletes the result
    // Key: NodeKey, Value: last matched expression string (e.g., "1km")
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
                    // Look back from equalIndex
                    const prevEqualIndex = i > 0 ? equalIndices[i - 1] : -1;
                    const sliceStart = prevEqualIndex + 1;
                    const potentialExpr = text.slice(sliceStart, equalIndex);

                    // Regex to match: Number + Optional Space + Unit at the end of the string
                    // Updated to allow numbers in unit (e.g., m2, m3) and caret (e.g. m^2)
                    const regex = /(\d+(?:\.\d+)?)\s*([a-zA-Z0-9³²\/\^]+)\s*$/;
                    const match = potentialExpr.match(regex);

                    if (!match) continue;

                    const [fullMatch, valueStr, unitStr] = match;

                    // Validate unit (with alias support)
                    if (!isValidUnit(unitStr)) continue;
                    
                    // Normalize unit (e.g., m2 -> m²)
                    const normalizedUnitStr = normalizeUnit(unitStr);
                    const originalValue = parseFloat(valueStr);

                    // 2. Check node state
                    // Check if '=' is the effective end of this TextNode (ignoring spaces)
                    // If suffix has content, we might not want to intervene unless it's just spaces
                    const suffix = text.slice(equalIndex + 1);
                    if (suffix.trim().length > 0) {
                        continue;
                    }

                    const lastExpr = lastExprRef.current.get(nodeKey);
                    const nextSibling = node.getNextSibling();
                    
                    // Unique key for this expression state
                    // Use normalized unit for key stability
                    const exprKey = `${valueStr}${normalizedUnitStr}`;

                    if ($isUnitConversionNode(nextSibling)) {
                        // Scenario A: Result node exists -> Update result if needed
                        const siblingNode = nextSibling as UnitConversionNode;
                        
                        if (siblingNode.__originalValue !== originalValue || siblingNode.__originalUnit !== normalizedUnitStr) {
                             editor.update(() => {
                                const writableResultNode = $getNodeByKey(siblingNode.getKey());
                                if ($isUnitConversionNode(writableResultNode)) {
                                    // Try to preserve target unit if type is same
                                    const newDefault = getDefaultTargetUnit(normalizedUnitStr);
                                    
                                    const newNode = $createUnitConversionNode(originalValue, normalizedUnitStr, newDefault);
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

                        // Insert
                        editor.update(() => {
                            const writableNode = $getNodeByKey(nodeKey);
                            if ($isTextNode(writableNode)) {
                                const targetUnit = getDefaultTargetUnit(normalizedUnitStr);
                                const newResultNode = $createUnitConversionNode(originalValue, normalizedUnitStr, targetUnit);
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
