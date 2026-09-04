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
import { useEvent } from "@/contexts/EvenContext";


// 定义开始与关闭自动粘贴的命令
export const OPEN_PASTE_COMMAND: LexicalCommand<{}> = createCommand('OPEN_PASTE_COMMAND')
export const CLOSE_PASTE_COMMAND: LexicalCommand<{}> = createCommand('CLOSE_PASTE_COMMAND')


/**
 * 自动粘贴插件
 */
export function AutoPastePlugin(): null {



    const watchTimerRef = useRef<number | null>(null); // 轮询定时器
    const lastClipboardRef = useRef<string | null>(null); // 上次剪贴板文本

    const [editor] = useLexicalComposerContext();
    const { removeBackspace, createBlockNode, removeEnter } = useBlockNode(editor, 'paste')
    const { closePaste$ } = useEvent();


    useEffect(() => {

        return () => {
            removeEnter();
            removeBackspace();
        };
    }, [editor]);

    // 关闭粘贴
    closePaste$.useSubscription(() => {
        // 关闭监听复制
        if (watchTimerRef.current) {
            clearInterval(watchTimerRef.current);
            watchTimerRef.current = null;
        }
    })

    // 注册命令
    editor.registerCommand(
        OPEN_PASTE_COMMAND,
        (payload) => {
            // 插入标题与tip节点
            const containerNodeKey = createBlockNode('paste');
            // 防止第一个复制的文案被粘贴
            window.electronAPI.readClipboardText()
                .then(text => { lastClipboardRef.current = text || ''; })
            // 开启轮询（500ms）
            if (watchTimerRef.current) {
                clearInterval(watchTimerRef.current);
            }
            watchTimerRef.current = window.setInterval(async () => {
                const text = await window.electronAPI.readClipboardText();
                console.log('剪贴板文本:', text);
                // 添加节点
                if (text && text !== lastClipboardRef.current) {
                    lastClipboardRef.current = text;
                    console.log('添加节点:', text);
                    editor.update(() => {
                        const pNode = $createParagraphNode();
                        pNode.append($createTextNode(text));
                        console.log('节点:', $getNodeByKey(containerNodeKey));
                        const containerNode = $getNodeByKey(containerNodeKey);
                        const titleNode = (containerNode as ElementNode).getFirstChild();
                        titleNode.insertAfter(pNode);
                        // $getNodeByKey(containerNodeKey).append(pNode);
                    });
                }
            }, 500);

            return true; //阻止向下传播
        },
        COMMAND_PRIORITY_CRITICAL
    );

    return null
}