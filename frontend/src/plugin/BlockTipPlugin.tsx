import { $getSelection, $isRangeSelection, $isParagraphNode, $getNodeByKey, LexicalNode, ElementNode, $isElementNode, $createParagraphNode, $createTextNode } from "lexical";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from "react";
import { $isMathNode } from "@/nodes/MathNode";
import { $createBlockTipNode, $isBlockTipNode } from "@/nodes/BlockTipNode";
import { $isPasteNode } from "@/nodes/PasteNode";


const calcuPlaceholder = 'This is a calculation block. You can evaluate expressions directly, e.g., 2+2; pressing = will automatically give you 4.';
const pastePlaceholder = 'Auto-paste: everything you copy will be pasted here automatically and wrapped with new lines.';

/**
 * 处理提示节点的显示或删除
 */
export function BlockTipPlugin(): null {

    const [editor] = useLexicalComposerContext();


    useEffect(() => {
        // 编辑器收集所有update后，会生成新的editorState，并广播事件
        const unregister = editor.registerUpdateListener(({ editorState }) => {
            try {
                let addTipParagraphKey: string | null = null;
                let removeTipKey: string | null = null;
                let placeholder: string = '';

                // 作用：只读阶段定位 block 和输入段落，计算是否需要增删占位符
                editorState.read(() => {
                    const selection = $getSelection();
                    if (!$isRangeSelection(selection)) return;

                    const anchorNode = selection.anchor.getNode();
                    let targetElement: ElementNode | null = null;

                    // 1. 检查是否在特殊 block 中 (Math/Paste)
                    let cur: LexicalNode | null = anchorNode;
                    while (cur) {
                        if ($isMathNode(cur) || $isPasteNode(cur)) {
                            targetElement = cur as ElementNode;
                            break;
                        }
                        cur = cur.getParent();
                    }
                    // 2. 如果不是特殊 block，则跳出
                    if (!targetElement) {
                        return
                    }

                    // 配备占位符
                    if ($isMathNode(targetElement)) {
                        placeholder = calcuPlaceholder;
                    } else if ($isPasteNode(targetElement)) {
                        placeholder = pastePlaceholder;
                    }

                    // 3. 判断是否需要添加或删除占位符
                    if (targetElement) {
                        const hasText = targetElement.getTextContent().trim().length > 0;
                        const children = targetElement.getChildren();
                        const paragraphCount = children.filter(c => $isParagraphNode(c)).length;

                        // 查找是否存在包含 BlockTipNode 的段落
                        let tipNode: LexicalNode | null = null;
                        for (const child of children) {
                            if ($isParagraphNode(child)) {
                                const foundTip = child.getChildren().find(grandChild => $isBlockTipNode(grandChild));
                                if (foundTip) {
                                    tipNode = foundTip;
                                    break;
                                }
                            }
                        }

                        // 如果有文字 OR 有多于一个段落（回车了），则删除占位符
                        if ((hasText || paragraphCount > 1) && tipNode) {
                            removeTipKey = tipNode.getKey();
                        } else if (!hasText && paragraphCount <= 1 && !tipNode) {
                            addTipParagraphKey = targetElement.getKey();
                        }
                    }
                });

                // 作用：仅在状态变化时写入，避免更新-监听循环
                if (addTipParagraphKey || removeTipKey) {
                    editor.update(() => {
                        if (removeTipKey) {
                            const tipNode = $getNodeByKey(removeTipKey);
                            if (tipNode) tipNode.remove();
                        }
                        if (addTipParagraphKey) {
                            const container = $getNodeByKey(addTipParagraphKey);
                            if (container && $isElementNode(container)) {
                                // 再次检查是否已经有 tip (防止并发更新)
                                const hasTip = container.getChildren().some(child =>
                                    $isParagraphNode(child) &&
                                    child.getChildren().some(grandChild => $isBlockTipNode(grandChild))
                                );
                                const hasText = container.getTextContent().trim().length > 0;

                                if (!hasTip && !hasText) {
                                    const tipChild = $createBlockTipNode(placeholder);
                                    const textNode = $createTextNode('');

                                    // 检查是否已经存在空段落，如果有则复用
                                    const existingParagraph = container.getChildren().find(child => $isParagraphNode(child));

                                    if (existingParagraph && $isElementNode(existingParagraph)) {
                                        existingParagraph.clear(); // 确保它是空的
                                        existingParagraph.append(textNode, tipChild);
                                        textNode.select();
                                    } else {
                                        const p = $createParagraphNode();
                                        p.append(textNode, tipChild);
                                        container.append(p);
                                        textNode.select();
                                    }
                                }
                            }
                        }
                    });
                }


            } catch (error) {
                const msg = error instanceof Error ? error.message : '处理提示节点时出错';
                console.error(msg);
            }
        });

        return () => {
            unregister();
        };
    }, [editor]);

    return null
}