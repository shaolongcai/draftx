import { useState, useEffect, useCallback, useRef } from 'react';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface UseChatOptions {
    toolId?: number;
}

export const useChat = (options?: UseChatOptions) => {

    const [aiAnswer, setAiAnswer] = useState<string>('');  // AI的回答
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const currentMessageRef = useRef<string>('');

    useEffect(() => {
        // 监听流式数据
        const unsubscribeData = window.electronAPI.onChatStream((chunk: string) => {
            currentMessageRef.current += chunk;
            setAiAnswer(prev => prev + chunk)
            setIsLoading(false); //有结果时即不需要loading
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];

                if (lastMessage && lastMessage.role === 'assistant') {
                    lastMessage.content = currentMessageRef.current;
                } else {
                    newMessages.push({
                        role: 'assistant',
                        content: currentMessageRef.current
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

    const sendMessage = useCallback((message?: string) => {
        if (isLoading) return;

        setError(null);
        setIsLoading(true);
        currentMessageRef.current = '';

        // 添加用户消息
        setMessages(prev => [...prev, {
            role: 'user',
            content: message
        }]);

        // 发起流式请求
        window.electronAPI.chatStream(message, options?.toolId);
    }, [isLoading, options?.toolId]);

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
