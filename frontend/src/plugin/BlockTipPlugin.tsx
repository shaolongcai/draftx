import { $getSelection, $isRangeSelection, $isParagraphNode, $isTextNode, $getNodeByKey, LexicalNode, ElementNode, TextNode, COMMAND_PRIORITY_CRITICAL, KEY_ENTER_COMMAND, $isElementNode, COMMAND_PRIORITY_HIGH } from "lexical";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from "react";
import { $isMathNode } from "@/nodes/MathNode";
import { $createBlockTipNode, $isBlockTipNode, BlockTipNode } from "@/nodes/BlockTipNode";
import { $isPasteNode } from "@/nodes/PasteNode";


/**
 * 处理提示节点的显示或删除
 */
export function BlockTipPlugin(): null {

    const [editor] = useLexicalComposerContext();


    useEffect(() => {
        const unregister = editor.registerUpdateListener(({ editorState }) => {
            try {
                let addTipParagraphKey: string | null = null;
                let removeTipKey: string | null = null;

                // 作用：只读阶段定位 block 和输入段落，计算是否需要增删占位符
                editorState.read(() => {
                    const selection = $getSelection();
                    if (!$isRangeSelection(selection)) return;

                    // 情况1：若回车后增加了新段落节点，删除占位符（即单纯回车也需要删除节点）
                    const selectionNode = selection.anchor.getNode()
                    if ($isParagraphNode(selectionNode.getPreviousSibling())) {
                        // 寻找tip节点
                        const tipChild = (selectionNode as ElementNode).getChildren().find((c) => $isBlockTipNode(c));
                        if (tipChild) {
                            editor.update(() => {
                                tipChild.remove();
                            })
                        }
                    }

                    // 向上查找最近的自定义 block（Math/Paste）
                    let cur: ElementNode | TextNode | null = selection.anchor.getNode();
                    let inBlock = $isMathNode(cur) || $isPasteNode(cur);
                    while (cur && !inBlock) {
                        cur = cur.getParent();
                        inBlock = $isMathNode(cur) || $isPasteNode(cur);
                    }
                    if (!cur || !inBlock) return;
                    const block = cur as ElementNode;

                    // 情况2：在片段中，若段落中包含文本节点，删除占位符
                    const paragraph = block.getChildren()[1] as ElementNode;
                    const hasText = block.getTextContent().length > 0

                    const tipChild = paragraph.getChildren().find((c) => $isBlockTipNode(c));
                    if ((hasText) && tipChild) {
                        removeTipKey = tipChild.getKey();
                    } else if (!hasText && !tipChild) {
                        addTipParagraphKey = paragraph.getKey();
                    }
                });

                // 作用：仅在状态变化时写入，避免更新-监听循环
                if (addTipParagraphKey || removeTipKey) {
                    editor.update(() => {
                        if (removeTipKey) {
                            const tip = $getNodeByKey(removeTipKey);
                            if (tip) tip.remove();
                        }
                        if (addTipParagraphKey) {
                            const paragraph = $getNodeByKey(addTipParagraphKey);
                            if (paragraph && $isParagraphNode(paragraph)) {
                                paragraph.append($createBlockTipNode(''));
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