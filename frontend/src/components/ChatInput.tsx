import { Chip, IconButton, InputBase, Stack, Tooltip } from "@mui/material"
import {
    SwapHoriz as AiIcon,
    Cancel as CloseIcon
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import { useEffect, useRef, useState } from "react";
import { useKeyPress } from "ahooks";
import useChat from "@/hooks/useChat";
import { useEditor } from "@/contexts/EditorContext";
import { useTranslation } from "@/contexts/I18nContext";



interface Props {
    onClose: () => void
}

const ChatInput: React.FC<Props> = ({ onClose }) => {

    const [inputMode, setInputMode] = useState<'whitDraft' | 'freedom'>('whitDraft')
    const [inputValue, setInputValue] = useState('')

    const theme = useTheme()
    const { aiAnswer, isLoading, sendMessage, clearMessages } = useChat();
    const { vditorRef } = useEditor();
    const { t } = useTranslation()
    const inputRef = useRef<HTMLInputElement>(null);
    // 已写入编辑器的 AI 回答长度（aiAnswer 是累计值，每次只追加增量）
    const writtenLengthRef = useRef(0);

    useEffect(() => {
        // 确保组件挂载后聚焦
        const timer = setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 50);
        return () => clearTimeout(timer);
    }, []);

    // 回车发送消息
    useKeyPress('enter', () => {
        clearMessages();
        createAIRespone();
    }, {
        target: inputRef
    })

    // 统一的AI生成
    const createAIRespone = async () => {
        const vditor = vditorRef.current;
        if (!vditor || isLoading) return;
        // 检查是否有配置AI
        const provider = await window.electronAPI.getConfig('ai_provider');
        if (!provider) {
            vditor.insertValue(`\n\n${t('app.chatWithAI.configureTips')}\n`);
            return;
        }
        // 检查是否激活
        const isActivated = await window.electronAPI.verifyLicense();
        if (!isActivated) {
            vditor.insertValue('\n\nPlease activate the software first\n');
            return;
        }
        clearMessages();
        // 将当前笔记内容以 markdown 作为上下文
        const markdown = vditor.getValue();
        writtenLengthRef.current = 0;
        // 换行后承载AI内容
        vditor.insertValue('\n\n');
        sendMessage(inputValue, inputMode === 'freedom' ? '' : markdown);
    }

    // 加载中时禁用编辑器
    useEffect(() => {
        const vditor = vditorRef.current;
        if (!vditor) return;
        if (isLoading) {
            vditor.disabled();
        } else {
            vditor.enable();
        }
    }, [isLoading])

    // 流式回答增量写入编辑器
    useEffect(() => {
        if (!aiAnswer) return;
        const vditor = vditorRef.current;
        if (!vditor) return;
        const chunk = aiAnswer.slice(writtenLengthRef.current);
        if (!chunk) return;
        writtenLengthRef.current = aiAnswer.length;
        try {
            vditor.insertValue(chunk);
        } catch (error) {
            console.log('更新AI内容失败', error);
        }
    }, [aiAnswer])

    // 组件卸载时确保编辑器恢复可用
    useEffect(() => {
        return () => {
            vditorRef.current?.enable();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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
            <Tooltip title={t(`app.chatWithAI.close.${window.electronUtils.platform === 'win32' ? 'win' : 'mac'}`)}>
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
            </Tooltip>
            <Chip
                icon={<AiIcon />}
                label={inputMode === 'whitDraft' ? t('app.chatWithAI.chip.withDraft') : t('app.chatWithAI.chip.freedom')}
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
                inputRef={inputRef}
                placeholder={t('app.chatWithAI.placeholder')}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                fullWidth
                sx={{
                    ml: 1,
                    flex: 1,
                    color: theme.palette.text.primary,
                    '& input::placeholder': {
                        color: theme.palette.text.primary,
                    }
                }}
            />
        </Stack>
    )
}


export default ChatInput
