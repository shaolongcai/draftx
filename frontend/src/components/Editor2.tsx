import { Box, Card, Stack, Tooltip, Typography } from "@mui/material"

import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { CodeHighlightPlugin } from '@/plugin/CodeHighlightPlugin';
import { CodeActionPlugin } from '@/plugin/CodeActionPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { MarkdownShortcutPlugin } from "@/plugin/MarkdownShortcutPlugin";
import { MarkdownPastePlugin } from "@/plugin/MarkdownPastePlugin";
import { TableKeyboardPlugin } from "@/plugin/TableKeyboardPlugin";
import { MermaidPlugin } from "@/plugin/MermaidPlugin";
import { mermaidNode } from "@/nodes/MermaidNode";
import { ListItemNode, ListNode } from '@lexical/list';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { $createParagraphNode, $getRoot, $getSelection, $isRangeSelection, COMMAND_PRIORITY_CRITICAL, type EditorThemeClasses, PASTE_COMMAND } from 'lexical';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useEffect, useRef, useState } from "react";
import { useDebounceFn, useKeyPress, useUpdateEffect } from "ahooks";
import { v4 as uuidv4 } from 'uuid';
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useEvent } from "@/contexts/EvenContext";
import { HelpOutline } from "@mui/icons-material";
import dayjs from "dayjs";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import Vditor from "vditor";
import "vditor/dist/index.css";



interface EditorContextProps {
    getDeleteDay: (date: string) => void;
}
/**
 * 内容编辑器
 */
const EditorContext: React.FC<EditorContextProps> = ({
    getDeleteDay,
}) => {

    const [currentUuid, setCurrentUuid] = useState<string>('');
    const [vd, setVd] = useState<Vditor>();
    const lastSavedRef = useRef<{ title?: string; contentText: string }>({ title: '', contentText: '' }); // 上次已保存

    const [editor] = useLexicalComposerContext()
    const { loadStickys$ } = useEvent();
    const notification = useNotifications();

    // 监听粘贴事件
    useEffect(() => {
        const vditor = new Vditor('vditor', {
            toolbar: [],
            toolbarConfig: {
                hide: true
            },
            minHeight: 320,
            // typewriterMode: true,
            placeholder: '支持markdown格式输入...',
            input: (value: string) => {

                // 提取标题：从第一个 # 到下一个换行
                const titleMatch = value.match(/^#\s*(.*?)\s*$/m);
                const title = titleMatch ? titleMatch[1].trim() : undefined;
                // 触发保存
                save(title, value);
            },
            preview: {
                theme: {
                    current: 'editorTheme', // 文件名称
                    path: '/src/assets/content-theme/',
                }
            },
            after: () => {
                // vditor.setValue("`Vditor` 最小代码示例");
                setVd(vditor);
            },
        });
        // Clear the effect
        return () => {
            vd?.destroy();
            setVd(undefined);
        };
    }, []);



    // 初始化uuid
    useEffect(() => {
        setCurrentUuid(uuidv4());
    }, []);

    // 监听加载新的便利贴
    loadStickys$.useSubscription((sticky) => {
        // 新增天数
        window.electronAPI.addDeleteDay(sticky.id);
        getDeleteDay(sticky.deleted_at)
        // 清空编辑器内容
        editor.update(() => {
            const root = $getRoot();
            root.clear();
            // 插入新的便利贴内容
            try {
                // 创建root
                const root = $getRoot();
                root.append($createParagraphNode());
                // console.log('插入新内容', sticky);
                const initialEditorState = editor.parseEditorState(sticky.content_string);
                editor.setEditorState(initialEditorState);
                setCurrentUuid(sticky.uuid);
            } catch (error) {
                root.append($createParagraphNode()); // 解析失败时兜底：新增空段落
                console.log('解析失败，插入空段落', error);
            }
        });
    })

    const save = async (contentText: string, title?: string) => {
        // 内容为空则跳过
        if (!contentText) return;
        console.log('save')
        // 若无变更则跳过
        if (contentText === lastSavedRef.current.contentText) return
        try {
            //@todo 更改数据库
            window.electronAPI.saveSticky({
                uuid: currentUuid,
                title: title,
                content: contentText,
            });
            console.log('已自动保存', { title, contentText });
            // 如需提示可开启：message.success('已自动保存');
        } catch (error) {
            const msg = error instanceof Error ? error.message : '保存失败';
            console.error(msg);
        }
    }

    // 注册Shitf+A 新建便利贴
    useKeyPress('shift.enter', () => {
        save(lastSavedRef.current.contentText, lastSavedRef.current.title);
        setCurrentUuid(uuidv4());
        // 清空编辑器内容
        editor.update(() => {
            const root = $getRoot();
            root.clear();
        });

        notification.show('The sticky has been saved', {
            severity: 'success',
        });
    })

    return <div id="vditor" className="vditor" />

}



const Editor2 = () => {

    const [deletedAt, setDeletedAt] = useState<number>();

    const initialConfig = {
        namespace: 'MyEditor',
        theme: {},
        onError: (error: Error) => {
            console.error(error);
        },
        nodes: [
            HeadingNode,
            QuoteNode,
            ListNode,
            ListItemNode,
            CodeNode,
            CodeHighlightNode,
            LinkNode,
            AutoLinkNode,
            TableNode,
            TableCellNode,
            HorizontalRuleNode,
            TableRowNode,
            mermaidNode,
        ]
    };

    return <Card className="relative" >
        <LexicalComposer initialConfig={initialConfig}>
            <EditorContext getDeleteDay={(deletedAt) => {
                // 换成与今天的差距
                const diff = dayjs(deletedAt).diff(dayjs(), 'day');
                console.log('diff', diff);
                setDeletedAt(diff);
            }} />
        </LexicalComposer>
        <Stack direction='row' justifyContent='space-between' alignItems="center">
            <Stack direction="row" spacing={0.5} alignItems="center" >
                <Typography variant="bodySmall" color="textSecondary">
                    {/* 删除的天数，+3天是因为点击后会加3天删除时间，修改增加的删除时间时，需要同步更改这里 */}
                    {deletedAt ? deletedAt + 3 : 7} 天后删除
                </Typography>
                <Tooltip title="Each view adds 3 days to deletion">
                    <HelpOutline fontSize="small" className="cursor-pointer" color='action' />
                </Tooltip>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center" >
                <span className="border border-text-secondary border-gray-300  rounded px-2 py-1 text-xs leading-none">
                    ⇧
                </span>
                <Typography variant="bodySmall" color="textSecondary">+</Typography>
                <span className="border border-gray-300 rounded px-2 py-1 text-xs leading-none">
                    ↵
                </span>
                <Typography variant="bodySmall" color="textSecondary" className="pl-1">
                    新的便利贴
                </Typography>
            </Stack>
        </Stack>
    </Card>
}

export default Editor2