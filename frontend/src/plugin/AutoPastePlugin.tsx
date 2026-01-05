import { createCommand, LexicalCommand, $getSelection, $isRangeSelection, $createTextNode, $isParagraphNode, KEY_ENTER_COMMAND, LexicalNode, $isTextNode, $createParagraphNode, COMMAND_PRIORITY_CRITICAL, KEY_BACKSPACE_COMMAND, TextNode, ElementNode, $getNodeByKey } from "lexical";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef, useState } from "react";
import { $isMathNode, MathNode } from "@/nodes/MathNode";
import { Parser, Expression } from 'expr-eval';
import { useKeyPress } from "ahooks";
import { $createBlockTitleNode, $isBlockTitleNode } from "@/nodes/BlockTitleNode";
import { $createBlockTipNode, $isBlockTipNode } from "@/nodes/BlockTipNode";
import { $createPasteNode } from "@/nodes/PasteNode";
import useBlockNode from "@/hooks/useBlockNode";


// 定义开始与关闭自动粘贴的命令
export const OPEN_PASTE_COMMAND: LexicalCommand<{}> = createCommand('OPEN_PASTE_COMMAND')
export const CLOSE_PASTE_COMMAND: LexicalCommand<{}> = createCommand('CLOSE_PASTE_COMMAND')


/**
 * 自动粘贴插件
 */
export function AutoPastePlugin(): null {


    const [editor] = useLexicalComposerContext();
    const currentEditPNodeRef = useRef<ElementNode | TextNode | null>(null); // 当前编辑的段落节点
    const { removeBackspace, createBlockNode, removeEnter } = useBlockNode(editor, 'paste')


    useEffect(() => {

        return () => {
            removeEnter();
            removeBackspace();
        };
    }, [editor]);

    // 注册命令
    editor.registerCommand(
        OPEN_PASTE_COMMAND,
        (payload) => {
            console.log('触发命令')
            // 插入标题与tip节点
            createBlockNode('paste');
            // 开启监听复制
            return true;
        },
        COMMAND_PRIORITY_CRITICAL
    );

    return null
}