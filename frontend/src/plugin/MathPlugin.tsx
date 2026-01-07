import { createCommand, LexicalCommand, $getSelection, $isRangeSelection, $createTextNode, $isParagraphNode, KEY_ENTER_COMMAND, LexicalNode, $isTextNode, $createParagraphNode, COMMAND_PRIORITY_CRITICAL, KEY_BACKSPACE_COMMAND, TextNode, ElementNode, $getNodeByKey } from "lexical";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef, useState } from "react";
import { $isMathNode, MathNode } from "@/nodes/MathNode";
import { Parser, Expression } from 'expr-eval';
import { useKeyPress } from "ahooks";
import { $isBlockTitleNode } from "@/nodes/BlockTitleNode";
import { $createBlockTipNode, $isBlockTipNode } from "@/nodes/BlockTipNode";
import useBlockNode from "@/hooks/useBlockNode";

/**
 * 计算插件，包含数学计算以及单位换算
 */


// 定义一个命令
export const OPEN_CALCULATOR_COMMAND: LexicalCommand<{

}> = createCommand('OPEN_CALCULATOR_COMMAND')


// 计算表达式
function safeEvalExpression(expr: string): number | null {
    let result: number | null = null;
    try {
        // 规范化输入：将全角数字/符号转为半角，保证可计算
        const exprNorm = expr.normalize('NFKC');
        // 解析并计算
        const parser = new Parser();
        result = parser.evaluate(exprNorm);

        if (typeof result === 'number' && Number.isFinite(result)) {
            return result;
        }
        return null;
    } catch (error) {
        return null;
    }
}


// 注册命令 + 提供节点
export function MathPlugin(): null {

    const [mathResult, setMathResult] = useState<number | null>(null);

    const [editor] = useLexicalComposerContext();
    const currentEditPNodeRef = useRef<ElementNode | TextNode | null>(null); // 当前编辑的段落节点
    const { removeBackspace, createBlockNode, removeEnter } = useBlockNode(editor, 'math')

    // 更新提示的计算结果
    useKeyPress((e) => e.key === '=', () => {
        // 显示结果
        if (mathResult !== null) {
            editor.update(() => {
                const textNode = $createTextNode(` ${mathResult.toString()}`);
                // textNode.setStyle('color:#9F7207');
                currentEditPNodeRef.current?.insertAfter(textNode);
                textNode.selectEnd();
            })
        }
    }, {
        events: ['keyup'],
        exactMatch: true
    })

    // 实时变更= 后的结果
    useEffect(() => {
        try {
            editor.update(() => {
                const node = currentEditPNodeRef.current;
                if (!node || !$isTextNode(node)) return;
                const text = node.getTextContent();
                const oldRelust = text.split('=')[1]?.trim();
                if (oldRelust && mathResult !== null) {
                    // 结果为空：移除结果文本节点并清理 ref
                    // 分割文本，保留等号前的内容
                    const newText = text.split('=')[0] + '= ' + mathResult.toString();
                    // 结果变化：更新文本
                    node.setTextContent(newText);
                }
            });
        } catch (error) {

        }
    }, [mathResult]);

    useEffect(() => {
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
                    if (prevText || anchorNodeText || !$isParagraphNode(prevSibling)) return false;

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
                        const mathNode = current as MathNode;

                        // 删除标题节点（如果存在）
                        const children = mathNode.getChildren();
                        const firstChild = children[0];
                        if (firstChild && $isBlockTitleNode(firstChild)) {
                            firstChild.remove();
                        }
                        // 创建普通段落，并迁移输入段落的文本
                        // 2) 构造一个普通段落，累积文本（避免段落嵌套）
                        const paragraph = $createParagraphNode();
                        const texts = mathNode
                            .getChildren()
                            .filter((n) => $isParagraphNode(n))
                            .map((n) => n.getTextContent().trim())
                            .filter(Boolean);
                        if (texts.length) {
                            paragraph.append($createTextNode(texts.join('\n')));
                        }
                        // 3) 用普通段落替换整个 math 节点，并选中
                        mathNode.replace(paragraph);
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

                    // 若mathNode节点只有一个子节点，且没内容，直接删除
                    const childrens = (current as MathNode).getChildren();
                    if (!childrens || (childrens.length === 1 && !childrens[0].getTextContent())) {
                        (current as MathNode).remove();
                        return true;
                    }

                    // 只有一个段落节点，且段落是否没有文字
                    const children = (current as MathNode).getChildren();
                    const childrenText = children[1].getTextContent();
                    if (children.length > 2 || childrenText) return false; // 有段落（包括了标题的节点）或者有文字时返回

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

        // 实时计算并展示“结果段落”
        const removeUpdate = editor.registerUpdateListener(({ editorState }) => {
            try {
                editorState.read(() => {
                    // 获取光标位置
                    const selection = $getSelection();
                    if (!$isRangeSelection(selection)) return;
                    let node: LexicalNode | null = selection.anchor.getNode();
                    while (node && !$isMathNode(node)) node = node.getParent(); // 找到最近的 MathNode 父节点
                    if (!$isMathNode(node)) return;

                    // 预期结构：输入段,输入 = 号显示结果
                    const inputParagraph = selection.anchor.getNode();
                    currentEditPNodeRef.current = inputParagraph;
                    if (!inputParagraph) return;

                    // 获取输入段落的文字内容
                    const expr = inputParagraph.getTextContent().trim();
                    // 过滤expr，若有 = 则分割，取前面
                    const exprWithoutEqual = expr.split('=')[0].trim();
                    const result = safeEvalExpression(exprWithoutEqual);
                    // console.log('执行的expr', exprWithoutEqual);
                    // console.log('计算结果', result);
                    setMathResult(result);
                });
            } catch (error) {
                const msg = error instanceof Error ? error.message : '升级失败';
            }
        })

        return () => {
            removeUpdate();
            removeEnter();
            removeBackspace();
        };
    }, [editor]);


    // 注册命令
    editor.registerCommand(
        OPEN_CALCULATOR_COMMAND,
        (payload) => {
            // 插入标题与tip节点
            const containerNodeKey = createBlockNode('math');

            return true; //阻止向下传播
        },
        COMMAND_PRIORITY_CRITICAL
    );

    return null
}