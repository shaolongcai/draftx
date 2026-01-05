import { $createBlockTipNode } from "@/nodes/BlockTipNode";
import { $createBlockTitleNode, $isBlockTitleNode } from "@/nodes/BlockTitleNode";
import { $createMathNode, $isMathNode, MathNode } from "@/nodes/MathNode";
import { $createPasteNode, $isPasteNode, PasteNode } from "@/nodes/PasteNode";
import { $createParagraphNode, $createTextNode, $getSelection, $isParagraphNode, $isRangeSelection, $isTextNode, COMMAND_PRIORITY_CRITICAL, ElementNode, KEY_BACKSPACE_COMMAND, KEY_ENTER_COMMAND, LexicalEditor } from "lexical";
import { LexicalNode } from "lexical";



/**
 * 处理块节点的各种操作
 * @param editor 
 * @param block 
 */
const useBlockNode = (editor: LexicalEditor, blockType: 'math' | 'paste') => {

    // 判断是否为block节点
    const isBlockNode = (node: LexicalNode): boolean => {
        return $isMathNode(node) || $isPasteNode(node);
    }

    // 创建块级节点
    const createBlockNode = (content: string) => {
        // 插入标准块结构：容器:[标题,段落：[占位符]]
        const selection = $getSelection();
        let containerNode: MathNode | PasteNode
        switch (blockType) {
            case 'math':
                containerNode = $createMathNode();
                break;
            case 'paste':
                containerNode = $createPasteNode();
                break;
            default:
                break;
        }
        // 插入容器到当前位置
        selection.insertNodes([containerNode]);
        // 容器内插入标题节点
        const titleNode = $createBlockTitleNode();
        containerNode.append(titleNode);
        // 容器内插入段落节点
        const inputParagraph = $createParagraphNode();
        containerNode.append(inputParagraph);
        // 段落内插入占位符节点
        const tipNode = $createBlockTipNode();
        inputParagraph.append(tipNode);
        // 占位符节点前插入一个文本节点
        const inputText = $createTextNode('');
        inputText.selectStart();
        tipNode.insertBefore(inputText);
    };

    // Backspace：在输入段落开头且无内容时，删除整个数学块
    const removeBackspace = editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        (event: KeyboardEvent) => {
            try {
                const selection = $getSelection();
                if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false;

                const anchorNode = selection.anchor.getNode();
                let current: LexicalNode | null = anchorNode; //模块的节点
                while (current && !isBlockNode(current)) {
                    current = current.getParent();
                }
                if (!isBlockNode(current)) return false;

                // 若blockNode节点只有一个子节点，且没内容，直接删除
                const childrens = (current as ElementNode).getChildren();
                if (!childrens || (childrens.length === 1 && !childrens[0].getTextContent())) {
                    (current as ElementNode).remove();
                    return true;
                }

                // 只有一个段落节点，且段落是否没有文字
                const children = (current as MathNode).getChildren();
                const childrenText = children[1].getTextContent();
                if (children.length > 2 || childrenText) return false; // 有段落（包括了标题的节点）或者有文字时返回

                event.preventDefault();
                (current as MathNode).remove();
                // editor.update(() => {
                //     const after = $createParagraphNode();
                //     (current as MathNode).insertAfter(after);
                //     (current as MathNode).remove();
                //     after.select();
                // });
                // return true;
            } catch (error) {
                const msg = error instanceof Error ? error.message : '升级失败';
                console.error(msg);
                return false;
            }
        },
        COMMAND_PRIORITY_CRITICAL
    );


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
                if (prevText || anchorNodeText || !$isParagraphNode(prevSibling)) return false;

                // 向上找到所属的 MathNode
                let current: LexicalNode | null = anchorNode;
                while (current && !isBlockNode(current)) {
                    current = current.getParent();
                }
                if (!isBlockNode(current)) return false;

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
                    const blockNode = current as ElementNode;

                    // 删除标题节点（如果存在）
                    const children = blockNode.getChildren();
                    const firstChild = children[0];
                    if (firstChild && $isBlockTitleNode(firstChild)) {
                        firstChild.remove();
                    }
                    // 创建普通段落，并迁移输入段落的文本
                    // 2) 构造一个普通段落，累积文本（避免段落嵌套）
                    const paragraph = $createParagraphNode();
                    const texts = blockNode
                        .getChildren()
                        .filter((n) => $isParagraphNode(n))
                        .map((n) => n.getTextContent().trim())
                        .filter(Boolean);
                    if (texts.length) {
                        paragraph.append($createTextNode(texts.join('\n')));
                    }
                    // 3) 用普通段落替换整个 block 节点，并选中
                    blockNode.replace(paragraph);
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

    return {
        createBlockNode,
        removeEnter,
        removeBackspace
    }

}

export default useBlockNode;