import { useState, useRef, useEffect } from "react"
import CardDialog from "./CardDialog"
import { Box, Stack, Typography, CircularProgress } from "@mui/material"
import { useChat } from "../hooks/useChat"
import { useEvent } from "@/contexts/EvenContext"
import Vditor from "vditor";

interface ChatProps {
    toolId?: number; // 使用的技能
    toolName?: string; // 使用的技能名称
    onClose: () => void;
    currentStickyId?: number // 当前便利贴id
    open: boolean,
    currentContent: string
}

export const Chat: React.FC<ChatProps> = ({
    toolId,
    toolName,
    onClose,
    currentStickyId,
    open,
    currentContent
}) => {

    const vdRef = useRef<Vditor | undefined>(undefined);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { aiAnswer, isLoading, error, sendMessage, clearMessages } = useChat({ toolId });

    // 初始化编辑器
    useEffect(() => {
        if (!open) return;

        // 解决时序的问题，浏览器完成重绘后，事件循环取出宏任务队列中的回调（setTimeout）执行
        const timer = setTimeout(() => {
            const element = document.getElementById('vditor-chat');
            if (!element) {
                console.error('vditor-chat element not found');
                return;
            }

            const vditor = new Vditor('vditor-chat', {
                toolbar: [],
                toolbarConfig: {
                    hide: true,
                },
                minHeight: 320,
                preview: {
                    theme: {
                        current: 'editorTheme',
                        path: './content-theme/',
                    },
                    markdown: {
                        mark: true,
                    }
                },
                after: () => {
                    vdRef.current = vditor;
                    // vditor.disabled();
                },
            });
        }, 0);

        return () => {
            clearTimeout(timer);
            if (vdRef.current) {
                vdRef.current.destroy();
                vdRef.current = undefined;
            }
        };
    }, [open]);

    // 更新内容
    useEffect(() => {
        if (!vdRef.current) return
        console.log('aiAnswer', aiAnswer)
        console.log('vdRef.current exists:', !!vdRef.current);
        vdRef.current?.setValue(aiAnswer);
    }, [aiAnswer]);

    // 使用工具
    useEffect(() => {
        if (open && !isLoading) {
            sendMessage(currentContent)
        }
        return () => {
            clearMessages()
        }
    }, [open])

    useEffect(() => {
        scrollToBottom();
    }, [aiAnswer]);

    // 滚动到底部，实际上没什么用
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <CardDialog
            title={toolName}
            onClose={onClose}
            open={open}
        >
            {/* 消息 */}
            <Box className='min-h-48 max-h-120 overflow-y-auto'>
                {isLoading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} />
                        <Typography variant="body2" color="text.secondary">
                            AI thinking...
                        </Typography>
                    </Box>
                )}
                <div id="vditor-chat" className="vditor" />
                {/* <Typography variant='bodyMedium' >
                    {aiAnswer}
                </Typography> */}
                {error && (
                    <Typography color="error" variant="body2">
                        错误: {error}
                    </Typography>
                )}
                <div ref={messagesEndRef} />
            </Box>
        </CardDialog>
    );
}

export default Chat