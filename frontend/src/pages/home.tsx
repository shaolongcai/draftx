import { useState, useEffect, useRef } from 'react'
import { Card, Grid, Stack, Typography } from '@mui/material'
import { EditorContext, ToolBar } from '@/components'
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { mermaidNode } from "@/nodes/MermaidNode";
import { ListItemNode, ListNode } from '@lexical/list';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import dayjs from "dayjs";
import { theme } from "@/theme/editorTheme";
import { MathNode } from "@/nodes/MathNode";
import { MathItemNode } from "@/nodes/MathItemNode";
import { BlockTitleNode } from "@/nodes/BlockTitleNode";
import { BlockTipNode } from "@/nodes/BlockTipNode";
import { PasteNode } from "@/nodes/PasteNode";
// import ToolBar from "./ToolBar";
import { LoadingNode } from "@/nodes/LoadingNode";
import { $createParagraphNode, $getRoot } from 'lexical';
// import { useSettings } from '@/contexts/SettingContext';

const Editor: React.FC = () => {

    const [deletedAt, setDeletedAt] = useState<number>();
    const [cardSize, setCardSize] = useState({ width: 400, height: 400 });
    const [showTips, setShowTips] = useState(true);

    const initialConfig = {
        namespace: 'MyEditor',
        theme: theme,
        onError: (error: Error) => {
            console.error(error.message);
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
            BlockTitleNode,
            BlockTipNode,
            mermaidNode,
            MathNode,
            MathItemNode,
            PasteNode,
            LoadingNode
        ],
    };

    useEffect(() => {
        const t = setTimeout(() => setShowTips(false), 5000)
        return () => clearTimeout(t)
    }, [])

    // 调整卡片大小
    const startResize = (edge: 'e' | 's' | 'se') => (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            const startWidth = cardSize.width;
            const startHeight = cardSize.height;
            const startX = e.clientX;
            const startY = e.clientY;

            const onMove = (ev: MouseEvent) => {
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;

                setCardSize(prev => {
                    let nextWidth = prev.width;
                    let nextHeight = prev.height;

                    if (edge === 'e' || edge === 'se') {
                        nextWidth = Math.min(Math.max(360, startWidth + dx), 800); //最大800，最小360
                    }
                    if (edge === 's' || edge === 'se') {
                        nextHeight = Math.min(Math.max(360, startHeight + dy), 800); //最大800，最小360
                    }
                    return { width: nextWidth, height: nextHeight };
                });
            };

            const onUp = () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
            };

            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
        } catch (error) {
            const msg = error instanceof Error ? error.message : '升级失败';
            console.error(msg);
        }
    };

    return <div className="overflow-hidden"
    // style={{ width: cardSize.width, height: cardSize.height }}
    >
        {/* 顶部拖动句柄 */}
        {/* <div
            className="drag absolute top-0 left-0 right-0 h-8 z-10 "
        /> */}
        {/* 右侧缩放句柄：横向缩放
        <div
            onMouseDown={startResize('e')}
            className="absolute right-0 top-0 h-full w-2 cursor-ew-resize opacity-0 hover:opacity-100 transition-opacity duration-150"
        />
        底部缩放句柄：纵向缩放
        <div
            onMouseDown={startResize('s')}
            className="absolute left-0 bottom-0 w-full h-2 cursor-ns-resize opacity-0 hover:opacity-100 transition-opacity duration-150"
        />
        右下角缩放句柄：同时缩放
        <div
            onMouseDown={startResize('se')}
            className="absolute right-0 bottom-0 w-3 h-3 cursor-nwse-resize opacity-0 hover:opacity-100 transition-opacity duration-150"
        /> */}
        <LexicalComposer initialConfig={initialConfig}>
            <EditorContext />
        </LexicalComposer>
        <Stack direction='row' justifyContent='center' alignItems="center"
            className="absolute bottom-4 left-0 right-0 px-4 h-4"
        >
            {/* <ToolBar currentPage='draft' /> */}
            {/* <Stack direction="row" spacing={0.5} alignItems="center"
                className={`transition-opacity duration-700 ${showTips ? 'opacity-100' : 'opacity-0'}`}
            >
                <span className="border border-text-secondary border-gray-300 text-gray-600 rounded px-2 py-1 text-xs leading-none">
                    Alt
                </span>
                <Typography variant="bodySmall" color='textTertiary'>+</Typography>
                <span className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-600 leading-none">
                    N
                </span>
                <Typography variant="bodySmall" color="textTertiary" className="pl-1">
                    New draft
                </Typography>
            </Stack> */}
        </Stack>
        {/* 删除提示标记点 (应该改为超过30日未查看的草稿将会被删除) */}
        {/* <Tooltip title={`After ${deletedAt ? deletedAt + 3 : 7} days will be deleted`}>
            <div className={`absolute bottom-6 right-6 w-2 h-2  rounded-full 
            ${deletedAt + 3 > 6 ? 'bg-[#34C759]/0' : 'bg-[#FF8D28]'}`} />
        </Tooltip> */}
    </div>
}

export default Editor
