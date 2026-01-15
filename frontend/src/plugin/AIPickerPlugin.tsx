/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { JSX } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    LexicalTypeaheadMenuPlugin,
    MenuOption,
    useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import {
    $getRoot,
    LexicalEditor,
    TextNode,
    $createParagraphNode,
    $createTextNode,
    $isParagraphNode,
    $isTextNode,
    $getSelection,
    $isRangeSelection,
    LexicalNode,
    $isElementNode,
    ParagraphNode,
    $getNodeByKey,
} from 'lexical';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Menu, MenuItem } from '@mui/material';
import { useRequest, useUpdateLayoutEffect } from 'ahooks';
import useChat from '@/hooks/useChat';
import { $createLoadingNode, $isLoadingNode } from '@/nodes/LoadingNode';


class ComponentPickerOption extends MenuOption {
    // What shows up in the editor
    title: string;
    // Icon for display
    icon?: JSX.Element;
    // For extra searching.
    keywords: Array<string>;
    // TBD
    keyboardShortcut?: string;
    // What happens when you select this option?
    onSelect: (queryString: string) => void;

    constructor(
        title: string,
        options: {
            icon?: JSX.Element;
            keywords?: Array<string>;
            keyboardShortcut?: string;
            onSelect: (queryString: string) => void;
        },
    ) {
        super(title);
        this.title = title;
        this.keywords = options.keywords || [];
        this.icon = options.icon;
        this.keyboardShortcut = options.keyboardShortcut;
        this.onSelect = options.onSelect.bind(this);
    }
}


/**
 * 选择AI工具菜单
 */
export default function AiPickerPlugin(): JSX.Element {


    const [queryString, setQueryString] = useState<string | null>(null);
    const [baseOptions, setBaseOptions] = useState<ComponentPickerOption[]>([]);
    const [textNodeKey, setTextNodeKey] = useState<string | null>(null); //AI内容的节点

    const [editor] = useLexicalComposerContext();
    const { aiAnswer, isLoading, error, messages, sendMessage, clearMessages } = useChat();

    // 获取AI工具
    useRequest(
        () => window.electronAPI.getAITools(),
        {
            onSuccess: (data: AIToolItem[]) => {
                console.log('data', data);
                const options = data.map((item: AIToolItem) => new ComponentPickerOption(
                    `${item.name}`,
                    {
                        icon: <div>{item.emoji}</div>,
                        keywords: [],
                        onSelect: () => createAIRespone(item.id),
                    }));
                setBaseOptions(options);
            }
        }
    )

    // 统一的AI生成 ， 可以考虑放到  onSelectOption 中
    const createAIRespone = async (toolId: number) => {
        // 检查是否有配置AI
        const provider = await window.electronAPI.getConfig('ai_provider');
        if (!provider) {
            editor.update(() => {
                const root = $getRoot();
                const pNode = $createParagraphNode();
                const tNode = $createTextNode('Please configure the AI provider in settings first');
                pNode.append(tNode);
                root.append(pNode);
                pNode.selectEnd();
            })
            return;
        }
        // 检查是否激活
        const isActivated = await window.electronAPI.verifyLicense();
        if (!isActivated) {
            editor.update(() => {
                const root = $getRoot();
                const pNode = $createParagraphNode();
                const tNode = $createTextNode('Please activate the software first');
                pNode.append(tNode);
                root.append(pNode);
                pNode.selectEnd();
            })
            return;
        }
        clearMessages();
        editor.setEditable(false); //先禁用编辑器
        editor.read(() => {
            const root = $getRoot();
            // 获取光标往上的所有文案
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) {
                throw new Error('未找到有效光标');
            }
            const anchor = selection.anchor;
            const anchorNode = anchor.getNode();
            const anchorOffset = anchor.offset;

            // 找到光标所在的顶层块（root 的直接子元素）
            let topBlock: LexicalNode | null = anchorNode;
            while (topBlock && topBlock.getParent() && topBlock.getParent() !== root) {
                topBlock = topBlock.getParent();
            }
            if (!topBlock) topBlock = root;

            // 从文档头到顶层块之前累积，再在该块内部累积到锚点
            let aboveText = '';
            for (const child of root.getChildren()) {
                if (child === topBlock) {
                    aboveText += collectTextUpToAnchor(child, anchorNode, anchorOffset);
                    break;
                } else {
                    aboveText += child.getTextContent() + '\n';
                }
            }

            console.log('aboveText', aboveText);
            sendMessage(aboveText, toolId);

            // 增加一个段落以承载AI内容
            editor.update(() => {
                let pNode: ParagraphNode | null = null;
                console.log('anchorNode', anchorNode)
                if ($isParagraphNode(anchorNode) && anchorNode.getTextContent().trim() === '') {
                    pNode = anchorNode;
                }
                else {
                    pNode = $createParagraphNode();
                    anchorNode.insertAfter(pNode)
                }
                // 创建loading
                const loadingNode = $createLoadingNode('AI Generating...');
                pNode.append(loadingNode);
                // 如果本来就是空段落，则只需要增加文本节点
                const textNode = $createTextNode(' ');
                setTextNodeKey(textNode.getKey()); // 保存文本节点的key
                pNode.append(textNode);
                textNode.select()
            })
        })
    }

    // 根据loading更新编辑器的禁用与否
    useEffect(() => {
        editor.setEditable(!isLoading);
    }, [isLoading])

    // 更新消息内容
    useUpdateLayoutEffect(() => {
        // 更新消息内容
        if (aiAnswer) {
            // console.log('messagesType', messages[messages.length - 1].type);
            editor.read(() => {
                const textNode = $getNodeByKey(textNodeKey!);
                try {
                    // 先删掉loading节点
                    const pNode = textNode.getParent();
                    const loadingNode = pNode?.getChildren().find(child => $isLoadingNode(child));
                    editor.update(() => {
                        loadingNode?.remove();

                        if ($isTextNode(textNode)) {
                            textNode.setTextContent(aiAnswer);
                            textNode.getParent()?.selectEnd(); // 每更新一次都将光标移动到最后
                        }
                    })
                } catch (error) {
                    editor.update(() => {
                        if ($isTextNode(textNode)) {
                            textNode.setTextContent('AI generation failed');
                            textNode.getParent()?.selectEnd(); // 每更新一次都将光标移动到最后
                        }
                    })
                    console.log('更新AI内容失败', error);
                }
            })
        }
    }, [aiAnswer, messages])

    function collectAllText(node: LexicalNode): string {
        if ($isTextNode(node)) return node.getTextContent();
        if ($isElementNode(node)) {
            let s = '';
            for (const child of node.getChildren()) s += collectAllText(child);
            return s;
        }
        return '';
    }

    // 判断 target 是否在 ancestor 子树内
    function isDescendantOf(target: LexicalNode, ancestor: LexicalNode): boolean {
        let cur: LexicalNode | null = target;
        while (cur) {
            if (cur === ancestor) return true;
            cur = cur.getParent();
        }
        return false;
    }

    // 在 node 内部，累积直到到达 anchor（文本节点取 slice(0, offset)，元素节点取前 offset 个子树）
    function collectTextUpToAnchor(node: LexicalNode, anchorNode: LexicalNode, anchorOffset: number): string {
        if (node === anchorNode) {
            if ($isTextNode(node)) return node.getTextContent().slice(0, anchorOffset);
            if ($isElementNode(node)) {
                const children = node.getChildren();
                let s = '';
                for (let i = 0; i < Math.min(anchorOffset, children.length); i++) {
                    s += collectAllText(children[i]);
                }
                return s;
            }
            return '';
        }

        if ($isTextNode(node)) return node.getTextContent();

        if ($isElementNode(node)) {
            let s = '';
            for (const child of node.getChildren()) {
                if (isDescendantOf(anchorNode, child)) {
                    s += collectTextUpToAnchor(child, anchorNode, anchorOffset);
                    break;
                } else {
                    s += collectAllText(child);
                }
            }
            return s;
        }

        return '';
    }

    const checkForTriggerMatch = useBasicTypeaheadTriggerMatch('·', {
        allowWhitespace: true,
        minLength: 0,
    });

    // 过滤选项
    const options = useMemo(() => {
        // const baseOptions = getBaseOptions();

        if (!queryString) {
            return baseOptions;
        }

        const regex = new RegExp(queryString, 'i');

        return [
            ...baseOptions.filter(
                (option) =>
                    regex.test(option.title) ||
                    option.keywords.some((keyword) => regex.test(keyword)),
            ),
        ];
    }, [editor, queryString]);

    // 菜单选项的回调
    const onSelectOption = useCallback(
        (
            selectedOption: ComponentPickerOption,
            nodeToRemove: TextNode | null,
            closeMenu: () => void,
            matchingString: string,
        ) => {
            editor.update(() => {
                nodeToRemove?.remove();
                selectedOption.onSelect(matchingString);
                closeMenu();
            });
        },
        [editor],
    );

    return (
        <>
            <LexicalTypeaheadMenuPlugin<ComponentPickerOption>
                onQueryChange={setQueryString}
                onSelectOption={onSelectOption}
                triggerFn={checkForTriggerMatch}
                options={options}
                menuRenderFn={(
                    anchorElementRef,
                    { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
                ) => {
                    // 1) 仅在锚点存在且有选项时渲染
                    if (!anchorElementRef.current || !options.length) return null;

                    // 2) 用坐标方式定位，避免左上角跳动
                    const rect = anchorElementRef.current.getBoundingClientRect();
                    const anchorPosition = {
                        top: Math.round(rect.bottom),
                        left: Math.round(rect.left),
                    };

                    return <Menu
                        onClose={() => {
                            // 使用一个空选项来关闭菜单
                            selectOptionAndCleanUp(new ComponentPickerOption('', {
                                icon: <i className="icon bullet" />,
                                keywords: [],
                                onSelect: () => { }
                            }))
                        }}
                        // 使用坐标定位而不是元素定位
                        anchorReference="anchorPosition"
                        anchorPosition={anchorPosition}
                        open={anchorElementRef.current !== null}
                        // 不夺取焦点，保持编辑器可继续输入
                        disableAutoFocus
                        disableEnforceFocus
                        disableRestoreFocus
                        // PaperProps={{ onMouseDown: (e: any) => e.preventDefault() }}
                        MenuListProps={{
                            autoFocusItem: false,
                            // onMouseDown: (e) => e.preventDefault(),
                        }}
                        // 对齐（左下到左上），稳定视觉位置
                        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                    >
                        {options.map((option, i: number) => (
                            <MenuItem
                                sx={{ fontSize: '16px' }}
                                onMouseDown={(e) => e.preventDefault()}
                                selected={selectedIndex === i}
                                onClick={() => {
                                    setHighlightedIndex(i);
                                    selectOptionAndCleanUp(option);
                                }}
                                onMouseEnter={() => {
                                    setHighlightedIndex(i);
                                }}
                                key={option.key}
                            >
                                {option.icon}
                                {option.title}
                            </MenuItem>
                        ))}
                    </Menu>
                }}
            />
        </>
    );
}
