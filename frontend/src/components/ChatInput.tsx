import { Chip, IconButton, InputBase, Stack } from "@mui/material"
import {
    Send as SendIcon,
    SwapHoriz as AiIcon,
    Cancel as CloseIcon
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import { useEffect, useRef, useState } from "react";
import { useEvent } from "@/contexts/EvenContext";
import { useKeyPress, useUpdateLayoutEffect } from "ahooks";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import useChat from "@/hooks/useChat";
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { $createParagraphNode, $createTextNode, $getNodeByKey, $getRoot, $isTextNode, ParagraphNode } from "lexical";
import { $createLoadingNode, $isLoadingNode } from "@/nodes/LoadingNode";

interface Props {
    onClose: () => void
}

const ChatInput: React.FC<Props> = ({ onClose }) => {

    const [inputMode, setInputMode] = useState<'whitDraft' | 'freedom'>('whitDraft')
    const [inputValue, setInputValue] = useState('')
    const [textNodeKey, setTextNodeKey] = useState('')

    const theme = useTheme()
    const { aiAnswer, isLoading, error, messages, sendMessage, clearMessages } = useChat();
    const [editor] = useLexicalComposerContext();
    const inputRef = useRef<HTMLInputElement>(null);

    // 回车发送消息
    useKeyPress('enter', () => {
        clearMessages();
        createAIRespone();
    }, {
        target: inputRef
    })

    // 统一的AI生成 ， 可以考虑放到  onSelectOption 中
    const createAIRespone = async () => {
        clearMessages();
        editor.setEditable(false); //先禁用编辑器
        editor.read(() => {
            // 将draft的内容以markdown格式导出
            const markdown = $convertToMarkdownString(TRANSFORMERS);
            console.log('markdown', markdown)
            // 增加一个段落以承载AI内容
            editor.update(() => {
                // 创建loading
                const pNode = $createParagraphNode();
                const loadingNode = $createLoadingNode('AI Generating...');
                pNode.append(loadingNode);
                // pNode 插入到 root的最后面
                $getRoot().append(pNode);
                // 插入一个空格， 以确保后续的文本节点可以正常选中
                const textNode = $createTextNode(' ');
                setTextNodeKey(textNode.getKey()); // 保存文本节点的key
                pNode.append(textNode);
                textNode.select()
                sendMessage(inputValue, inputMode === 'freedom' ? '' : markdown);
            })
        })
    }

    // 更新editor的状态
    useEffect(() => {
        editor.setEditable(!isLoading); // 加载中时禁用编辑器
    }, [isLoading])

    // 更新消息内容
    useUpdateLayoutEffect(() => {
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
                        console.log('aiAnswer', aiAnswer);
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

    return (
        <Stack
            direction='row'
            spacing={1}
            alignItems="center"
            className="px-4 py-2"
            sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.45), //背景颜色透明度
                p: 1,
                borderRadius: 4,
                position: 'relative',
                bottom: '24px',
            }}
        >
            <IconButton
                onClick={onClose}
                size="small"
                sx={{
                    color: alpha(theme.palette.primary.main, 0.45),
                    '&:hover': {
                        color: alpha(theme.palette.primary.main, 0.85),
                    }
                }}
            >
                <CloseIcon fontSize="small" />
            </IconButton>
            <Chip
                icon={<AiIcon />}
                label={inputMode === 'whitDraft' ? 'Generate with draft' : 'freedom'}
                size="small"
                className="px-2 py-1 absolute top-[-32px] left-0"
                color='primary'
                onClick={() => setInputMode(inputMode === 'whitDraft' ? 'freedom' : 'whitDraft')}
                sx={{
                    cursor: 'pointer',
                    '& .MuiChip-deleteIcon': {
                        color: theme.palette.primary.contrastText,
                        '&:hover': {
                            color: alpha(theme.palette.primary.contrastText, 0.7)
                        }
                    },
                    '& .MuiChip-icon': {
                        color: theme.palette.primary.contrastText
                    },
                    '&:hover': {
                        bgcolor: theme.palette.primary.dark,
                    }
                }}
            />
            <InputBase
                ref={inputRef}
                placeholder="Press Enter to send"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                fullWidth
                sx={{
                    ml: 1,
                    flex: 1,
                    color: theme.palette.text.primary,
                    '& input::placeholder': {
                        color: 'rgba(0, 0, 0, 0.65)', // 45% 透明度
                    }
                }}
            />
            {/* <IconButton
                size="small"
                sx={{
                    color: theme.palette.primary.contrastText,
                    '&:hover': {
                        bgcolor: 'rgba(159, 114, 7, 0.08)',
                    }
                }}
            >
                <SendIcon fontSize="small" />
            </IconButton> */}
        </Stack>
    )
}


export default ChatInput