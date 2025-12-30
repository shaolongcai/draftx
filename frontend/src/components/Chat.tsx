import { useState, useRef, useEffect } from "react"
import CardDialog from "./CardDialog"
import { Box, Stack, Typography, CircularProgress } from "@mui/material"
import { useChat, Message } from "../hooks/useChat"
import { useEvent } from "@/contexts/EvenContext"

interface ChatProps {
    toolId?: number; // 使用的技能
    onClose: () => void;
    currentStickyId?: number // 当前便利贴id
    open: boolean,
    currentContent: string
}

export const Chat: React.FC<ChatProps> = ({
    toolId,
    onClose,
    currentStickyId,
    open,
    currentContent
}) => {

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { messages, isLoading, error, sendMessage } = useChat({ toolId });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // 使用工具
    useEffect(() => {
        if (open && currentContent) {
            sendMessage(currentContent)
        }
    }, [open, currentContent])

    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    return (
        <CardDialog
            title="AI Chat"
            onClose={onClose}
            open={open}
        >
            <Stack spacing={2} sx={{ width: 400, height: 500 }}>
                {/* 消息列表 */}
                <Box
                    sx={{
                        flex: 1,
                        overflowY: 'auto',
                        p: 2,
                        bgcolor: '#f5f5f5',
                        borderRadius: 1,
                    }}
                >
                    {messages.map((msg: Message, index: number) => (
                        <Box
                            key={index}
                            sx={{
                                mb: 2,
                                display: 'flex',
                                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            }}
                        >
                            <Box
                                sx={{
                                    maxWidth: '70%',
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: msg.role === 'user' ? '#1976d2' : '#fff',
                                    color: msg.role === 'user' ? '#fff' : '#000',
                                    boxShadow: 1,
                                }}
                            >
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {msg.content}
                                </Typography>
                            </Box>
                        </Box>
                    ))}
                    {isLoading && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={16} />
                            <Typography variant="body2" color="text.secondary">
                                AI 正在思考...
                            </Typography>
                        </Box>
                    )}
                    {error && (
                        <Typography color="error" variant="body2">
                            错误: {error}
                        </Typography>
                    )}
                    <div ref={messagesEndRef} />
                </Box>
            </Stack>
        </CardDialog>
    );
}

export default Chat