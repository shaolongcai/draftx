import { Card, Grid, Stack, Typography } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useState } from "react";
import AIToolConfig from "./AIToolConfig";
import { useRequest } from "ahooks";
import Chat from "./Chat";


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
    mode: 'add' | 'edit'
}
/**
 * 对memo纸使用的的AI工具
 */
const AITools: React.FC<Props> = ({
    mode
}) => {

    const [open, setOpen] = useState(false); //是否显示配置AI工作
    const [openChat, setOpenChat] = useState(false)

    const handleAddTool = () => {
        // 检查有否配置AI供应商
        setOpen(true);
    }

    // 获取配置好的AI工具
    const { data } = useRequest(
        () => window.electronAPI.getAITools(),
    )

    return (
        <div >
            <Chat open={openChat} onClose={() => { setOpenChat(false) }} />
            <AIToolConfig
                open={open}
                mode={mode}
                onClose={() => { setOpen(false) }}
                onFinish={() => { setOpen(false) }}
            />
            {
                !open &&
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
                                    onClick={() => { setOpenChat(true) }}
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