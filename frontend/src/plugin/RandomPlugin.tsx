import { createCommand, LexicalCommand, $getSelection, $isRangeSelection, $createTextNode, $isParagraphNode, KEY_ENTER_COMMAND, LexicalNode, $isTextNode, $createParagraphNode, COMMAND_PRIORITY_CRITICAL, KEY_BACKSPACE_COMMAND, TextNode, ElementNode, $getNodeByKey, $insertNodes, $getRoot, ParagraphNode, KEY_DOWN_COMMAND, COMMAND_PRIORITY_LOW } from "lexical";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef } from 'react';
import { $createHorizontalRuleNode } from '@/nodes/HorizontalRuleNode';
import { $createBlockTipNode } from "@/nodes/BlockTipNode";

export default function RandomPlugin(): null {
    const [editor] = useLexicalComposerContext();
    const isTriggeringRef = useRef(false);

    useEffect(() => {
        const removeKeyDown = editor.registerCommand(
            KEY_DOWN_COMMAND,
            (event) => {
                if (event.key === ':') {
                    editor.getEditorState().read(() => {
                        const selection = $getSelection();
                        if ($isRangeSelection(selection) && selection.isCollapsed()) {
                            const anchor = selection.anchor;
                            const node = anchor.getNode();
                            if ($isTextNode(node)) {
                                const text = node.getTextContent();
                                const textBefore = text.slice(0, anchor.offset);
                                if (textBefore.endsWith('random')) {
                                    isTriggeringRef.current = true;
                                }
                            }
                        }
                    });
                } else {
                    // Reset flag on other keys to be safe
                    isTriggeringRef.current = false;
                }
                return false;
            },
            COMMAND_PRIORITY_LOW
        );

        const removeTransform = editor.registerNodeTransform(TextNode, (textNode) => {
            if (!isTriggeringRef.current) return;
            
            const text = textNode.getTextContent();
            if (!text.endsWith('random:')) return;

            // 重置 flag，防止重复触发
            isTriggeringRef.current = false;

            // 获取当前块级节点
            let currentBlock: LexicalNode | null = textNode;
            while (currentBlock && currentBlock.getParent() !== $getRoot()) {
                if (currentBlock.getParent()) {
                    currentBlock = currentBlock.getParent();
                } else {
                    break;
                }
            }

            if (!currentBlock) return;

            // 1. 选中命令时，会按照光标往上找每个段落，直到一个空段落
            const candidates: ParagraphNode[] = [];
            let sibling = currentBlock.getPreviousSibling();

            while (sibling) {
                // 4. 忽略所有非段落的节点，如果不是段落则跳过
                if ($isParagraphNode(sibling)) {
                    // 直到一个空段落
                    if (sibling.getTextContent().trim() === '') {
                        break;
                    }
                    candidates.push(sibling);
                }
                // 继续向上找
                sibling = sibling.getPreviousSibling();
            }

            console.log('所有段落', candidates);

            if (candidates.length === 0) return;

            // 3. 在刚才找到的段落，随机找到一个
            const randomNode = candidates[Math.floor(Math.random() * candidates.length)];

            // 插入到 random: 后面
            let lastNode: LexicalNode = textNode;
            randomNode.getChildren().forEach(child => {
                if ($isTextNode(child)) {
                    const newText = $createTextNode(child.getTextContent());
                    newText.setFormat(child.getFormat());
                    newText.setStyle(child.getStyle());
                    newText.setDetail(child.getDetail());
                    newText.setMode(child.getMode());
                    lastNode.insertAfter(newText);
                    lastNode = newText;
                }
            });

            // 将光标移动到新内容的末尾
            lastNode.selectEnd();
        });

        return () => {
            removeKeyDown();
            removeTransform();
        };
    }, [editor]);

    return null;
}