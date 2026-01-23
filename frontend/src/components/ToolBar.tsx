import { Divider, IconButton, Stack, Tooltip } from "@mui/material";
import { ReactNode, useMemo, useRef, useState } from "react";
import {
    AddCircleOutline as AddIcon,
    Assistant as AIChatIcon,
    GridView as AllIcon,
    Mode as DraftIcon,
    KeyboardArrowLeft as BackIcon,
    KeyboardArrowRight as ForwardIcon,
} from "@mui/icons-material";
import { useEvent } from "@/contexts/EvenContext";
import ChatInput from "./ChatInput";
import { useKeyPress } from "ahooks";
import { historyStack } from "@/utils/histroyStack";



interface ToolButtonProps {
    icon: ReactNode;
    className?: string;
    tip?: string;
    onClick?: () => void;
    disabled?: boolean;
}
// Icon按钮
const ToolButton: React.FC<ToolButtonProps> = ({
    icon,
    className,
    tip,
    onClick,
    disabled = false,
}) => {
    return (
        <Tooltip title={tip}>
            <IconButton size="small" className={`text-white ${className}`}
                onClick={onClick}
                disabled={disabled}
            >
                {icon}
            </IconButton>
        </Tooltip>
    )
}


interface Props {
    currentPage: 'draft' | 'list' //当前处在的页面
    setCurrentPage: (page: 'draft' | 'list') => void;
}
//主控件
const ToolBar: React.FC<Props> = ({
    currentPage,
    setCurrentPage,
}) => {

    const [active, setActive] = useState(false);
    const [isChatMode, setIsChatMode] = useState(false);
    const [historyVersion, setHistoryVersion] = useState(0); // 历史版本号，用于刷新按钮状态

    const inputRef = useRef<HTMLDivElement>(null);
    const { handleOnclickTool$, loadStickys$ } = useEvent();


    // 快速开启chat
    useKeyPress('alt.c', () => {
        inputRef.current?.focus();
        setIsChatMode(!isChatMode);
    })

    // 前进快捷键
    useKeyPress((e) => e.altKey && e.key === ']', (e) => {
        e.preventDefault();
        handleForwardOrBack('forward');
    })

    // 后退快捷键
    useKeyPress((e) => e.altKey && e.key === '[', (e) => {
        e.preventDefault();
        handleForwardOrBack('back');
    })

    // 前进或后退草稿
    const handleForwardOrBack = (type: 'forward' | 'back') => {
        // 判断能否触发
        const canTrigger = type === 'forward' ? historyStack.canForward() : historyStack.canBack();
        if (!canTrigger) return
        const uuid = type === 'forward' ? historyStack.forward() : historyStack.back();
        // 获取下一个草稿
        if (uuid) {
            // 获取草稿详情
            window.electronAPI.getDraftByUuid(uuid).then(draft => {
                if (draft) {
                    loadStickys$.emit({ ...draft, content: draft.content_json } as DraftResult)
                }
                // 如果已删掉，则跳过一个,并且把这个uuid从历史堆栈中删除
                else {
                    handleForwardOrBack(type);
                    // 从历史堆栈中删除这个uuid
                    historyStack.remove(uuid);
                }
            });
        }
    }

    // 监听外部加载事件（如 Editor 新建草稿或加载列表），也需要刷新按钮状态
    loadStickys$.useSubscription(() => {
        setHistoryVersion(v => v + 1);
    });

    // 获取工具栏按钮
    const toolButtons = useMemo<(ToolButtonProps | { isDivider: boolean })[]>(() => {
        const buttons: (ToolButtonProps | { isDivider: boolean })[] = [];

        // 开始配置toolbar
        if (currentPage === 'draft') {
            // 回退到上一个草稿
            buttons.push({
                icon: <BackIcon className={!historyStack.canBack() ? 'text-white/40!' : ''} />,
                className: 'hover:bg-[#9F7207]/70',
                disabled: !historyStack.canBack(),
                tip: 'Back to the previous draft  (Alt + [)',
                onClick: () => handleForwardOrBack('back'),
            });

            // 前进到下一个草稿
            buttons.push({
                icon: <ForwardIcon className={!historyStack.canForward() ? 'text-white/40!' : ''} />,
                className: 'hover:bg-[#9F7207]/70',
                disabled: !historyStack.canForward(),
                tip: 'Forward to the next draft  (Alt + ])',
                onClick: () => handleForwardOrBack('forward'),
            });

            buttons.push({
                isDivider: true,
            });
        }

        // 添加草稿
        buttons.push({
            icon: <AddIcon />,
            className: 'hover:bg-[#9F7207]/70',
            tip: 'Add a new draft  (Alt + N)',
            onClick: () => {
                setCurrentPage('draft');
                handleOnclickTool$.emit('addDraft');
            },
        });

        // 显示所有草稿与搜索
        if (currentPage === 'draft') {
            buttons.push({
                icon: <AllIcon />,
                className: 'hover:bg-[#9F7207]/70',
                tip: 'Show all drafts',
                onClick: () => setCurrentPage('list'),
            });
        }

        // 回到草稿
        if (currentPage === 'list') {
            buttons.push({
                icon: <DraftIcon />,
                className: 'hover:bg-[#9F7207]/70',
                tip: 'Back the draft',
                onClick: () => setCurrentPage('draft'),
            });
        }

        // 对话
        if (currentPage === 'draft') {
            buttons.push({
                icon: <AIChatIcon />,
                className: 'hover:bg-[#9F7207]/70',
                tip: 'Chat with AI (Alt + C)',
                onClick: () => setIsChatMode(true),
            });
        }

        return buttons;
    }, [currentPage, setCurrentPage, historyVersion]);


    if (isChatMode) {
        return <ChatInput
            onClose={() => {
                setIsChatMode(false)
                setActive(false);
            }} />;
    }


    return (
        <div className="mx-auto w-fit">
            <div
                className={`mx-auto rounded-xl overflow-hidden origin-center 
                        transition-all duration-300 ease-out
                        ${active
                        // 展开：固定高度 + 中心缩放到 1
                        ? 'w-full h-9 px-2 bg-linear-to-r from-[#9F7207]/70 via-[#9F7207]/85 to-[#9F7207] scale-y-100'
                        // 收起：保持高度为展开值，使用 scaleY 压到近似 1px（对称收缩）
                        : 'w-20 h-9 bg-[#9F7207]/25 scale-y-[0.12]'
                    }`}
                onMouseEnter={() => setActive(true)}
                onMouseLeave={() => setActive(false)}
            >
                <Stack
                    alignItems="center"
                    direction="row"
                    justifyContent="space-between"
                    className={`items-center gap-1 px-2 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                >
                    {toolButtons.map((button, index) => {
                        if ((button as any).isDivider) {
                            return (
                                <Divider
                                    key={index}
                                    orientation="vertical"
                                    variant="middle"
                                    flexItem
                                    sx={{
                                        bgcolor: 'rgba(255,255,255,0.3)',
                                        my: 1,
                                        mx: 0.5,
                                    }}
                                />
                            )
                        }
                        return <ToolButton key={index} {...button as ToolButtonProps} />
                    })}
                </Stack>
            </div>
        </div>
    )
}


export default ToolBar;