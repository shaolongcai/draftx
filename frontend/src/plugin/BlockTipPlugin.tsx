import { $getSelection, $isRangeSelection, $isParagraphNode, $isTextNode, $getNodeByKey, LexicalNode, ElementNode, TextNode } from "lexical";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from "react";
import { $isMathNode } from "@/nodes/MathNode";
import { $createBlockTipNode, $isBlockTipNode } from "@/nodes/BlockTipNode";
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

                    // 步骤：向上查找最近的自定义 block（Math/Paste）
                    let cur: ElementNode | TextNode | null = selection.anchor.getNode();
                    let inBlock = $isMathNode(cur) || $isPasteNode(cur);
                    while (cur && !inBlock) {
                        cur = cur.getParent();
                        inBlock = $isMathNode(cur) || $isPasteNode(cur);
                    }
                    if (!cur || !inBlock) return;
                    const block = cur as ElementNode;

                    // 寻找块节点的第二个节点（段落）中的节点数量是否大于2，或者段落中是否包含文本节点（第二个节点统一为段落）
                    const paragraph = block.getChildren()[1] as ElementNode;
                    // 步骤：仅统计 TextNode 文本，忽略占位符（避免抖动）
                    const hasText = block.getTextContent().length > 0
                    // .getChildren()
                    // .some((c) => $isTextNode(c) && c.getTextContent().length > 0);

                    const tipChild = paragraph.getChildren().find((c) => $isBlockTipNode(c));

                    if (hasText && tipChild) {
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
                                paragraph.append($createBlockTipNode());
                            }
                        }
                    });
                }
            } catch (error) {
                const msg = error instanceof Error ? error.message : '升级失败';
            }
        });

        return () => unregister();
    }, [editor]);

    return null
}