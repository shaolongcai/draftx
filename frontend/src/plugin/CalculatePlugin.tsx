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
import { $isCaluResultNode, $createCaluResultNode, CaluResultNode } from "@/nodes/CaluResultNode";

// ... existing imports

export function CalculatePlugin(): null {
    const [calcResult, setCalcResult] = useState<number | null>(null);
    const [editor] = useLexicalComposerContext();
    // 使用 Map 存储每个节点最后一次计算的表达式，防止删除结果后死循环重新计算
    // Key: NodeKey, Value: last calculated expression string
    const lastExprRef = useRef<Map<string, string>>(new Map());
    const currentEditPNodeRef = useRef<ElementNode | TextNode | null>(null); // 当前编辑的段落节点
    const { removeBackspace, createBlockNode, removeEnter } = useBlockNode(editor, 'math')

    // 实时更新结果：监听编辑器变化，自动计算并修正结果
    useEffect(() => {
        return editor.registerUpdateListener(({ editorState, tags }) => {
            // 如果是历史记录操作（撤销/重做），不触发计算逻辑，避免状态混乱
            if (tags.has('historic')) return;

            editorState.read(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) return;
                const node = selection.anchor.getNode();
                if (!$isTextNode(node)) return;

                const text = node.getTextContent();
                const nodeKey = node.getKey();

                // 必须包含 = 且不能只是 =
                if (!text.includes('=')) {
                    // 如果文本中没有 =，清除该节点的缓存记录，以便下次输入 = 时能正常触发
                    if (lastExprRef.current.has(nodeKey)) {
                        lastExprRef.current.delete(nodeKey);
                    }
                    return;
                }

                // 找到所有 = 的位置
                const equalIndices: number[] = [];
                for (let i = 0; i < text.length; i++) {
                    if (text[i] === '=') equalIndices.push(i);
                }

                // 从后往前处理
                for (let i = equalIndices.length - 1; i >= 0; i--) {
                    const equalIndex = equalIndices[i];

                    // 1. 提取算式
                    const prevEqualIndex = i > 0 ? equalIndices[i - 1] : -1;
                    const sliceStart = prevEqualIndex + 1;
                    const potentialExpr = text.slice(sliceStart, equalIndex);

                    const match = potentialExpr.match(/([\d\.\+\-\*\/\(\)\s]+)$/);
                    if (!match) continue;

                    const exprRaw = match[0];
                    if (!/[+\-*\/]/.test(exprRaw)) continue;

                    // 2. 计算
                    const result = safeEvalExpression(exprRaw);
                    if (result === null) continue;
                    const newResultStr = result.toString();

                    // 3. 检查节点状态
                    // 检查 = 号是否是该 TextNode 的有效结尾
                    const suffix = text.slice(equalIndex + 1);

                    // 如果后缀还有非空内容，说明还没有拆分或者用户在后面输入，暂不处理，以免打断输入
                    // 只有当 = 是最后的内容（忽略空格）时才尝试插入结果节点
                    if (suffix.trim().length > 0) {
                        continue;
                    }

                    const lastExpr = lastExprRef.current.get(nodeKey);
                    const nextSibling = node.getNextSibling();

                    if ($isCaluResultNode(nextSibling)) {
                        // 场景 A: 结果节点已存在 -> 更新结果
                        if (nextSibling.__result !== newResultStr) {
                            editor.update(() => {
                                const writableResultNode = $getNodeByKey(nextSibling.getKey());
                                if ($isCaluResultNode(writableResultNode)) {
                                    const newNode = $createCaluResultNode(newResultStr);
                                    writableResultNode.replace(newNode);
                                    lastExprRef.current.set(nodeKey, exprRaw);
                                }
                            });
                        } else {
                            // 结果一致也更新缓存，防止后续误判
                            lastExprRef.current.set(nodeKey, exprRaw);
                        }
                    } else {
                        // 场景 B: 结果节点不存在 -> 插入新节点
                        // 关键防御：如果表达式和上次一样，说明用户刚刚删除了结果节点，不要重新插入！
                        if (lastExpr === exprRaw) {
                            return;
                        }

                        // 执行插入
                        editor.update(() => {
                            const writableNode = $getNodeByKey(nodeKey);
                            if ($isTextNode(writableNode)) {
                                const newResultNode = $createCaluResultNode(newResultStr);
                                writableNode.insertAfter(newResultNode);
                                lastExprRef.current.set(nodeKey, exprRaw);
                                // 光标放到结果节点后面
                                newResultNode.selectEnd();
                            }
                        });
                    }

                    // 处理完一个有效的就不再继续往前找了
                    return;
                }
            });
        });
    }, [editor]);

    return null
}