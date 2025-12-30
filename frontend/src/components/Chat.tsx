import { useState, useRef, useEffect } from "react"
import CardDialog from "./CardDialog"
import { Box, TextField, IconButton, Stack, Typography, CircularProgress } from "@mui/material"
import { Send as SendIcon } from "@mui/icons-material"
import { useChat, Message } from "../hooks/useChat"

interface ChatProps {
    toolId?: number;
    onClose: () => void;
    open:boolean
}

export const Chat: React.FC<ChatProps> = ({ 
    toolId, onClose,
    open
 }) => {
    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { messages, isLoading, error, sendMessage } = useChat({ toolId });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (inputMessage.trim() && !isLoading) {
            sendMessage(inputMessage);
            setInputMessage('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

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
                    {messages.length === 0 && (
                        <Typography color="text.secondary" align="center">
                            开始对话...
                        </Typography>
                    )}
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

                {/* 输入框 */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        multiline
                        maxRows={3}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="输入消息..."
                        disabled={isLoading}
                        size="small"
                    />
                    <IconButton
                        color="primary"
                        onClick={handleSend}
                        disabled={!inputMessage.trim() || isLoading}
                    >
                        <SendIcon />
                    </IconButton>
                </Box>
            </Stack>
        </CardDialog>
    );
}

export default Chat