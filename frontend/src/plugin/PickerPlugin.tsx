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
    LexicalEditor,
    TextNode,
    $createTextNode,
    $getSelection,
    $isRangeSelection,
    $createParagraphNode,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Menu, MenuItem } from '@mui/material';
import { $createHeadingNode } from '@lexical/rich-text';
import { INSERT_CHECK_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { OPEN_PASTE_COMMAND } from './AutoPastePlugin';
import { OPEN_CALCULATOR_COMMAND } from './MathPlugin';
// icon
import {
    h1 as H1Icon,
    h2 as H2Icon,
    h3 as H3Icon,
    ul as UnorderedListIcon,
    ol as OrderedListIcon,
    checklist as ChecklistIcon,
    autoPaste as AutoPasteIcon,
    calculator as CalculatorIcon,
    paragraph as ParagraphIcon,
} from '@/assets/icons/editIcon'


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


// 统一创建h模块
const createHeading = (editor: LexicalEditor, type: 'h1' | 'h2' | 'h3') => {
    editor.update(() => {
        const selection = $getSelection();
        if (!selection) return;

        const nodes = selection.getNodes();
        const targetNode = nodes[0];

        const headingNode = $createHeadingNode(type);

        // 获取原来节点的文字
        const textNode = $createTextNode(targetNode.getTextContent());
        targetNode.replace(headingNode);

        if (textNode) {
            headingNode.append(textNode);
        }
    });
}

// 获取选项
function getBaseOptions(editor: LexicalEditor) {

    return [
        // 普通段落
        new ComponentPickerOption('Paragraph', {
            icon: ParagraphIcon,
            keywords: ['p', '段落'],
            onSelect: () => {
                editor.update(() => {
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                        $setBlocksType(selection, () => $createParagraphNode());
                    }
                })
            }
        }),
        new ComponentPickerOption('Calculator', {
            icon: CalculatorIcon,
            keywords: ['Calculator', 'Math', '计算', '计数'],
            onSelect: () => {
                editor.update(() => {
                    editor.dispatchCommand(OPEN_CALCULATOR_COMMAND, undefined);
                });
            }
        }),
        new ComponentPickerOption('Auto paste', {
            icon: AutoPasteIcon,
            keywords: ['paste', '自动粘贴'],
            onSelect: () => {
                // 触发命令
                editor.dispatchCommand(OPEN_PASTE_COMMAND, undefined);
            }
        }),
        new ComponentPickerOption('Heading 1', {
            icon: H1Icon,
            keywords: ['h1'],
            onSelect: () => createHeading(editor, 'h1')
        }),
        new ComponentPickerOption('Heading 2', {
            icon: H2Icon,
            keywords: ['h2'],
            onSelect: () => createHeading(editor, 'h2')
        }),
        new ComponentPickerOption('Heading 3', {
            icon: H3Icon,
            keywords: ['h3'],
            onSelect: () => createHeading(editor, 'h3')
        }),
        new ComponentPickerOption('Checklist', {
            icon: ChecklistIcon,
            keywords: ['check', 'todo', 'task'],
            onSelect: () => {
                editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
            }
        }),
        new ComponentPickerOption('Number List', {
            icon: OrderedListIcon,
            keywords: ['number', 'ordered', 'ol'],
            onSelect: () => {
                editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
            }
        }),
        new ComponentPickerOption('Bullet List', {
            icon: UnorderedListIcon,
            keywords: ['bullet', 'unordered', 'ul'],
            onSelect: () => {
                editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
            }
        }),
    ];
}

export default function PickerPlugin(): JSX.Element {


    const [queryString, setQueryString] = useState<string | null>(null);

    const [editor] = useLexicalComposerContext();


    // 监听输入 / 符号，触发菜单
    const checkForTriggerMatch = useBasicTypeaheadTriggerMatch('/', {
        allowWhitespace: true,
        minLength: 0,
    });

    // 根据输入的 queryString 过滤选项
    const options = useMemo(() => {
        const baseOptions = getBaseOptions(editor);

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
                                sx={{
                                    fontSize: '14px',
                                    gap: '4px',
                                    '& svg': { width: 24, height: 24 }
                                }}
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
