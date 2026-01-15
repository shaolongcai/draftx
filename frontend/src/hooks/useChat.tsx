import { useState, useEffect, useCallback, useRef } from 'react';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    type: 'stream' | 'done';
}



export const useChat = () => {

    const [aiAnswer, setAiAnswer] = useState<string>('');  // AI的回答
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const currentMessageRef = useRef<string>('');

    useEffect(() => {
        // 监听流式数据
        const unsubscribeData = window.electronAPI.onChatStream((chunk) => {
            currentMessageRef.current += chunk.content;
            // console.log('接收到的chunk', chunk);
            setAiAnswer(prev => prev + chunk.content)
            if (chunk.type === 'done') {
                setIsLoading(false);
            }
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];

                if (lastMessage && lastMessage.role === 'assistant') {
                    lastMessage.content = currentMessageRef.current;
                    lastMessage.type = chunk.type;
                } else {
                    newMessages.push({
                        role: 'assistant',
                        content: currentMessageRef.current,
                        type: chunk.type,
                    });
                }

                return newMessages;
            });
        });

        // 监听流式结束
        const unsubscribeEnd = window.electronAPI.onChatStreamEnd(() => {
            currentMessageRef.current = '';
        });

        // 监听流式错误
        const unsubscribeError = window.electronAPI.onChatStreamError((errorMsg: string) => {
            setError(errorMsg);
            setIsLoading(false);
            currentMessageRef.current = '';
        });

        // 清理监听器
        return () => {
            unsubscribeData();
            unsubscribeEnd();
            unsubscribeError();
            setAiAnswer('');
        };
    }, []);

    const sendMessage = useCallback((message: string, toolId: number) => {
        if (isLoading) return;

        setError(null);
        setIsLoading(true);
        currentMessageRef.current = '';

        // 添加用户消息
        setMessages(prev => [...prev, {
            role: 'user',
            content: message || '',
            type: 'stream',
        }]);

        // 发起流式请求
        window.electronAPI.chatStream(message, toolId);
    }, [isLoading]);

    const clearMessages = useCallback(() => {
        setMessages([]);
        setAiAnswer('');
        setError(null);
    }, []);

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        clearMessages,
        aiAnswer
    };
};

export default useChat;
