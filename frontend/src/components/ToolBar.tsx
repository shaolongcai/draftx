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



interface ToolButtonProps {
    icon: ReactNode;
    className?: string;
    tip?: string;
    onClick?: () => void;
}
// Icon按钮
const ToolButton: React.FC<ToolButtonProps> = ({
    icon,
    className,
    tip,
    onClick
}) => {
    return (
        <Tooltip title={tip}>
            <IconButton size="small" className={`text-white ${className}`}
                onClick={onClick}
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

    const inputRef = useRef<HTMLDivElement>(null);
    const { handleOnclickTool$ } = useEvent();


    // 快速开启chat
    useKeyPress('alt.c', () => {
        inputRef.current?.focus();
        setIsChatMode(!isChatMode);
    })

    // 获取工具栏按钮
    const toolButtons = useMemo<(ToolButtonProps | { isDivider: boolean })[]>(() => {
        const buttons: (ToolButtonProps | { isDivider: boolean })[] = [];

        // 开始配置toolbar
        if (currentPage === 'draft') {
            buttons.push({
                icon: <BackIcon />,
                className: 'hover:bg-[#9F7207]/70',
                tip: 'Back to the previous draft  (Alt + ⬅️)',
                onClick: () => {
                    // setCurrentPage('draft');
                    // handleOnclickTool$.emit('backDraft');
                },
            });

            buttons.push({
                icon: <ForwardIcon />,
                className: 'hover:bg-[#9F7207]/70',
                tip: 'Forward to the next draft  (Alt + ➡️)',
                onClick: () => {
                    // setCurrentPage('draft');
                    // handleOnclickTool$.emit('nextDraft');
                },
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
    }, [currentPage, setCurrentPage]);


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