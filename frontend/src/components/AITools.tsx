import { Card, Grid, Stack, Typography } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useEffect, useState } from "react";
import AIToolConfig from "../pages/AIToolConfig";
import { useRequest } from "ahooks";
import Chat from "./Chat";
import { useEvent } from "@/contexts/EvenContext";


interface ToolProps {
    name: string,
    emoji?: string,
    onClick: () => void
}
const Tool: React.FC<ToolProps> = ({
    name, emoji,
    onClick
}) => {
    return <Card className="w-20 h-20 m-0 shadow-[4px_4px_0px_01px_rgba(0,0,0,1)] p-2 cursor-pointer" onClick={onClick}>
        <Stack alignItems='center' justifyContent='center' className="h-full">
            <Typography variant='bodyMedium' fontWeight={600}>
                {name}
            </Typography>
        </Stack>
    </Card>
}


interface Props {
    mode: 'add' | 'edit',
    open: boolean
}
/**
 * 对memo纸使用的的AI工具
 */
const AITools: React.FC<Props> = ({
    mode,
    open
}) => {

    const [openConfig, setOpenConfig] = useState(false); //是否显示配置AI工作
    const [openChat, setOpenChat] = useState(false)
    const [currentContent, setCurrentContent] = useState('') // 当前的便利贴内容
    const [currentToolId, setCurrentToolId] = useState<number>() //工具ID
    const [currentToolName, setCurrentToolName] = useState<string>() //工具名称

    const { refreshContent$ } = useEvent()

    // 关闭时重置状态
    useEffect(() => {
        setOpenChat(false)
        setOpenConfig(false)
    }, [open])

    // 刷新便利贴内容
    refreshContent$.useSubscription((content) => {
        setCurrentContent(content)
    })

    const handleAddTool = () => {
        // 检查有否配置AI供应商
        setOpenConfig(true);
    }

    // 获取配置好的AI工具
    const { data } = useRequest(
        () => window.electronAPI.getAITools(),
    )

    if (!open) return null

    return (
        <div >
            <Chat
                toolId={currentToolId}
                toolName={currentToolName}
                open={openChat}
                onClose={() => { setOpenChat(false) }}
                currentContent={currentContent}
            />
            <AIToolConfig
                open={openConfig}
                mode={mode}
                onClose={() => { setOpenConfig(false) }}
                onFinish={() => { setOpenConfig(false) }}
            />
            {
                !openConfig && !openChat &&
                <Grid container spacing={2}
                    columns={3}
                    className='w-70 h-fit m-3'
                >

                    <Grid>
                        <Card className="m-0 shadow-[4px_4px_0px_01px_rgba(0,0,0,1)] cursor-pointer"
                            onClick={handleAddTool}
                        >
                            <AddIcon />
                        </Card>
                    </Grid>
                    {
                        (data as AIToolItem[] || []).map(item => {
                            return <Grid>
                                <Tool
                                    name={item.name}
                                    emoji={item.emoji}
                                    onClick={() => {
                                        setCurrentToolId(item.id)
                                        setCurrentToolName(item.name)
                                        setOpenChat(true)
                                    }}
                                />
                            </Grid>
                        })
                    }
                </Grid>
            }
        </div>
    )
}

export default AITools;