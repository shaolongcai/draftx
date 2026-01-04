import { createCommand, LexicalCommand, COMMAND_PRIORITY_EDITOR, $getSelection, $isRangeSelection, $createTextNode, $isParagraphNode, KEY_ENTER_COMMAND, LexicalNode, $isTextNode, $createParagraphNode, COMMAND_PRIORITY_CRITICAL, KEY_BACKSPACE_COMMAND, COMMAND_PRIORITY_LOW, COMMAND_PRIORITY_HIGH } from "lexical";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState } from "react";
import { $isMathNode, MathNode } from "@/nodes/MathNode";

/**
 * 计算插件，包含数学计算以及单位换算
 */


// 定义一个命令
export const INSER_MATH_COMMAND: LexicalCommand<{

}> = createCommand('INSER_MATH_BLOCK')



// 注册命令 + 提供节点
export function MathPlugin(): null {


    const [activeMathNodeKey, setActiveMathNodeKey] = useState<string | null>(null);

    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        // // 自动清理：仅剩标题或内容为空时，移除整个节点
        // const removeTransform = editor.registerNodeTransform(MathNode, (node) => {
        //     try {
        //         const children = node.getChildren();
        //         if (children.length === 0) {
        //             node.remove();
        //             return;
        //         }
        //         // 过滤掉标题段（“数学模块”）和空段落
        //         const contentChildren = children.filter((child) => {
        //             if ($isParagraphNode(child)) {
        //                 const text = child.getTextContent().trim();
        //                 return text !== '' && text !== '数学模块';
        //             }
        //             return true;
        //         });
        //         if (contentChildren.length === 0) {
        //             node.remove();
        //         }
        //     } catch (error) {
        //         const msg = error instanceof Error ? error.message : '升级失败';
        //         console.error(msg);
        //     }
        // });

        // Enter：在数学块末尾时，跳出到块外新段落
        const removeEnter = editor.registerCommand(
            KEY_ENTER_COMMAND,
            (event: KeyboardEvent) => {
                if (event.defaultPrevented) {
                    return false;
                }
                try {

                    const selection = $getSelection();
                    if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false;

                    // 获取选中位置的节点
                    const anchorNode = selection.anchor.getNode();

                    // 判断前面两个节点是否为换行节点（内容为空）
                    const anchorNodeText = anchorNode.getTextContent().trim() || '';
                    const prevSibling = anchorNode.getPreviousSibling();
                    const prevText = prevSibling?.getTextContent().trim() || '';
                    console.log('anchorNodeText', anchorNodeText)
                    console.log('prevText', prevText)
                    if (prevText || anchorNodeText) return false;

                    // 向上找到所属的 MathNode
                    let current: LexicalNode | null = anchorNode;
                    while (current && !$isMathNode(current)) {
                        current = current.getParent();
                    }
                    if (!$isMathNode(current)) return false;

                    // 判断是否位于 MathNode 的最后一个子段落的末尾
                    const lastChild = (current as MathNode).getLastChild();
                    if (!lastChild) return false;

                    // 找到 anchor 所属的 MathNode 直接子节点
                    let directChild: LexicalNode | null = anchorNode;
                    while (directChild && directChild.getParent() !== current) {
                        directChild = directChild.getParent();
                    }
                    if (directChild !== lastChild) return false;

                    // 判断光标是否在该段落末尾
                    let atEnd = true;
                    if ($isParagraphNode(directChild)) {
                        const lastLeaf = directChild.getLastDescendant();
                        if (lastLeaf && $isTextNode(lastLeaf)) {
                            atEnd = selection.anchor.offset === lastLeaf.getTextContentSize();
                        }
                    }
                    if (!atEnd) return false;

                    event.preventDefault();
                    editor.update(() => {
                        const paragraph = $createParagraphNode();
                        (current as MathNode).insertAfter(paragraph);
                        paragraph.select();
                    });
                    return true;
                } catch (error) {
                    const msg = error instanceof Error ? error.message : '升级失败';
                    console.error(msg);
                    return false;
                }
            },
            COMMAND_PRIORITY_CRITICAL
        );

        // Backspace：在输入段落开头且无内容时，删除整个数学块
        const removeBackspace = editor.registerCommand(
            KEY_BACKSPACE_COMMAND,
            (event: KeyboardEvent) => {
                try {
                    const selection = $getSelection();
                    if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false;

                    const anchorNode = selection.anchor.getNode();
                    let current: LexicalNode | null = anchorNode; //模块的节点
                    while (current && !$isMathNode(current)) {
                        current = current.getParent();
                    }
                    if (!$isMathNode(current)) return false;

                    // 知否只有一个段落节点，且段落是否没有文字
                    const children = (current as MathNode).getChildren();
                    const childrenText = children[0].getTextContent();
                    if (children.length > 1 || childrenText) return false; // 有段落或者有文字时返回

                    event.preventDefault();
                    editor.update(() => {
                        const after = $createParagraphNode();
                        (current as MathNode).insertAfter(after);
                        (current as MathNode).remove();
                        after.select();
                    });
                    return true;
                } catch (error) {
                    const msg = error instanceof Error ? error.message : '升级失败';
                    console.error(msg);
                    return false;
                }
            },
            COMMAND_PRIORITY_CRITICAL
        );

        return () => {
            // removeTransform();
            removeEnter();
            removeBackspace();
        };
    }, [editor]);

    return null
}