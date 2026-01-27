import { createCommand, LexicalCommand, $getSelection, $isRangeSelection, $createTextNode, $isParagraphNode, KEY_ENTER_COMMAND, LexicalNode, $isTextNode, $createParagraphNode, COMMAND_PRIORITY_CRITICAL, KEY_BACKSPACE_COMMAND, TextNode, ElementNode, $getNodeByKey, $insertNodes, $getRoot, ParagraphNode } from "lexical";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $createHorizontalRuleNode } from '@/nodes/HorizontalRuleNode';

export const RANDOM_COMMAND: LexicalCommand<undefined> = createCommand('RANDOM_COMMAND')

/**
 * 随机工具
 * 按照上面段落里的元素，随机一个段落
 */
export default function RandomPlugin(): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        // 注册命令
        return editor.registerCommand(
            RANDOM_COMMAND,
            () => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) return false;

                const anchorNode = selection.anchor.getNode();
                // 获取当前块级节点
                let currentBlock: LexicalNode | null = anchorNode;
                while (currentBlock && currentBlock.getParent() !== $getRoot()) {
                    if (currentBlock.getParent()) {
                        currentBlock = currentBlock.getParent();
                    } else {
                        break;
                    }
                }

                if (!currentBlock) return false;

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

                if (candidates.length === 0) return true;

                // 3. 在刚才找到的段落，随机找到一个
                const randomNode = candidates[Math.floor(Math.random() * candidates.length)];

                editor.update(() => {
                    // 2. 插入分割的虚线
                    const hr = $createHorizontalRuleNode();

                    // 3. 复制到分割虚线的下方
                    const p = $createParagraphNode();
                    // 克隆节点内容，保留格式
                    randomNode.getChildren().forEach(child => {
                        if ($isTextNode(child)) {
                            const newText = $createTextNode(child.getTextContent());
                            newText.setFormat(child.getFormat());
                            newText.setStyle(child.getStyle());
                            newText.setDetail(child.getDetail());
                            newText.setMode(child.getMode());
                            p.append(newText);
                        }
                    });

                    // 获取当前选中的节点（命令触发的位置）
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                        const anchorNode = selection.anchor.getNode();
                        // 找到当前所在的块级节点
                        let currentBlock = anchorNode;
                        while (currentBlock && currentBlock.getParent() !== $getRoot()) {
                            if (currentBlock.getParent()) {
                                currentBlock = currentBlock.getParent()!;
                            } else {
                                break;
                            }
                        }

                        if (currentBlock) {
                            // 检查当前块是否为空（去除空格后）
                            const isEmpty = currentBlock.getTextContent().trim() === '';

                            if (isEmpty) {
                                // 如果是空段落，直接替换
                                currentBlock.replace(hr);
                            } else {
                                // 如果有内容，插在后面
                                currentBlock.insertAfter(hr);
                            }

                            // 在分割线后面插入随机段落
                            hr.insertAfter(p);
                            // 将光标移动到新段落的末尾
                            p.select();
                        }
                    }
                });

                return true; //阻止向下传播
            },
            COMMAND_PRIORITY_CRITICAL
        );
    }, [editor]);

    return null;
}