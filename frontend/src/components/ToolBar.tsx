import { Divider, IconButton, Stack, Tooltip, Typography, useColorScheme, useTheme } from "@mui/material";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
    AddCircleOutline as AddIcon,
    Assistant as AIChatIcon,
    GridView as AllIcon,
    Mode as DraftIcon,
    KeyboardArrowLeft as BackIcon,
    KeyboardArrowRight as ForwardIcon,
    ArrowCircleUp as UpdateIcon,
    FileDownload as ExportIcon,
} from "@mui/icons-material";
import { useEvent } from "@/contexts/EvenContext";
import ChatInput from "./ChatInput";
import { useKeyPress, useRequest } from "ahooks";
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
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);

    const inputRef = useRef<HTMLDivElement>(null);
    const { handleOnclickTool$, loadStickys$ } = useEvent();
    const isMac = window.electronUtils?.platform === 'darwin' || /macintosh|mac os x/i.test(navigator.userAgent);

    // 引入 MUI 主题
    const theme = useTheme();
    const { setMode, mode } = useColorScheme() //调用 setMode('主题色的键，例如red') 即可调用对应主题颜色

    // 检查更新
    const { data: updateInfo } = useRequest(async () => {
        return await window.electronAPI.checkForUpdates();
    });

    // 更新版本
    const handleUpdate = async () => {
        try {
            setIsDownloading(true);
            await window.electronAPI.downloadUpdate();
        } catch (error) {
            console.error('更新失败', error);
            setIsDownloading(false);
        }
    };

    // 获取工具栏按钮
    const toolButtons = useMemo<(ToolButtonProps | { isDivider: boolean })[]>(() => {
        const buttons: (ToolButtonProps | { isDivider: boolean })[] = [];

        // 开始配置toolbar
        if (currentPage === 'draft') {
            // 回退到上一个草稿
            buttons.push({
                icon: <BackIcon className={!historyStack.canBack() ? 'text-white/40!' : ''} />,
                disabled: !historyStack.canBack(),
                tip: isMac ? 'Back to the previous draft  ( ⌘ + [ )' : 'Back to the previous draft  ( Alt + [ )',
                onClick: () => handleForwardOrBack('back'),
            });

            // 前进到下一个草稿
            buttons.push({
                icon: <ForwardIcon className={!historyStack.canForward() ? 'text-white/40!' : ''} />,
                disabled: !historyStack.canForward(),
                tip: isMac ? 'Forward to the next draft  ( ⌘ + ] )' : 'Forward to the next draft  ( Alt + ] )',
                onClick: () => handleForwardOrBack('forward'),
            });

            buttons.push({
                isDivider: true,
            });
        }

        // 添加草稿
        buttons.push({
            icon: <AddIcon />,
            tip: isMac ? 'Add a new draft  ( ⌘ + N )' : 'Add a new draft  ( Alt + N )',
            onClick: () => {
                setCurrentPage('draft');
                handleOnclickTool$.emit('addDraft');
            },
        });

        // 显示所有草稿与搜索
        if (currentPage === 'draft') {
            buttons.push({
                icon: <AllIcon />,
                tip: 'Show all drafts',
                onClick: () => setCurrentPage('list'),
            });
        }

        // 回到草稿
        if (currentPage === 'list') {
            buttons.push({
                icon: <DraftIcon />,
                tip: 'Back the draft',
                onClick: () => setCurrentPage('draft'),
            });
        }

        // 对话
        if (currentPage === 'draft') {
            buttons.push({
                icon: <AIChatIcon />,
                tip: isMac ? 'Chat with AI (⌥ + C)' : 'Chat with AI (Alt + C)',
                onClick: () => setIsChatMode(true),
            });

            buttons.push({
                isDivider: true,
            });

            // 导出 Markdown
            buttons.push({
                icon: <ExportIcon />,
                tip: 'Export as Markdown',
                onClick: () => handleOnclickTool$.emit('exportMarkdown'),
            });
        }

        // 检查是否有更新
        if (updateInfo?.isUpdateAvailable) {
            buttons.push({
                isDivider: true,
            });

            if (isDownloading) {
                // 显示下载进度
                buttons.push({
                    icon: <Typography variant='body2' className="text-white text-xs font-mono">{`${Math.round(downloadProgress)}%`}</Typography>,
                    tip: `Downloading... ${Math.round(downloadProgress)}%`,
                    disabled: true
                });
            } else {
                // 显示更新按钮
                buttons.push({
                    icon: <UpdateIcon />,
                    tip: 'Update available',
                    className: 'animate-pulse text-green-400 hover:text-green-300',
                    onClick: handleUpdate,
                });
            }
        }

        return buttons;
    }, [currentPage, setCurrentPage, historyVersion, isMac, updateInfo, isDownloading, downloadProgress]);



    // 监听下载新版本
    useEffect(() => {
        window.electronAPI.onDownloadProgress((progress: number) => {
            console.log('下载进度', progress);
            setDownloadProgress(progress);
        })
    }, [])




    // 快速开启chat
    useKeyPress(isMac ? '⌥+c' : 'alt.c', () => {
        inputRef.current?.focus();
        setIsChatMode(!isChatMode);
    })

    // 前进快捷键
    useKeyPress((e) => (isMac ? e.metaKey : e.altKey) && e.key === ']', (e) => {
        e.preventDefault();
        handleForwardOrBack('forward');
    })

    // 后退快捷键
    useKeyPress((e) => (isMac ? e.metaKey : e.altKey) && e.key === '[', (e) => {
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
                className={`mx-auto rounded-xl overflow-hidden origin-center  transition-all duration-300 ease-out`}
                style={{
                    width: active ? '100%' : '5rem',
                    height: '2.25rem',
                    paddingLeft: active ? '0.5rem' : 0,
                    paddingRight: active ? '0.5rem' : 0,
                    background: active   // 展开：固定高度 + 中心缩放到 1 (B3、D9是AI换算的)
                        ? `linear-gradient(to right, ${theme.palette.primary.main}B3, ${theme.palette.primary.main}D9, ${theme.palette.primary.main})`
                        : `${theme.palette.primary.main}`,
                    transform: `scaleY(${active ? 1 : 0.12})`,  // 收起：保持高度为展开值，使用 scaleY 压到近似 1px（对称收缩）
                    transition: 'all 300ms ease-out',
                    transformOrigin: 'center',
                }}
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