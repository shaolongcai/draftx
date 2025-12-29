import { Card, Grid, Stack, Typography } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useState } from "react";
import AIToolConfig from "./AIToolConfig";



const Tool = () => {
    return <Card className="w-20 h-20 m-0 shadow-[4px_4px_0px_01px_rgba(0,0,0,1)] p-2 cursor-pointer" >
        <Stack alignItems='center' justifyContent='center' className="h-full">
            <Typography variant='bodyMedium' fontWeight={600}>
                AI 整理
            </Typography>
        </Stack>
    </Card>
}


/**
 * 对memo纸使用的的AI工具
 */
const AITools = () => {

    const [open, setOpen] = useState(false); //是否显示配置AI工作

    const handleAddTool = () => {
        // 检查有否配置AI供应商
        setOpen(true);
    }

    return (
        <>
            <AIToolConfig
                open={open}
                mode='add'
                onClose={() => { setOpen(false) }}
                onFinish={() => { setOpen(false) }}
            />
            {
                !open &&
                <Grid container spacing={2}
                    columns={3}
                    className='w-70 h-fit'
                >
                    <Grid>
                        <Card className="m-0 shadow-[4px_4px_0px_01px_rgba(0,0,0,1)] cursor-pointer"
                            onClick={handleAddTool}
                        >
                            <AddIcon />
                        </Card>
                    </Grid>
                    <Grid  >
                        <Tool />
                    </Grid>
                    <Grid  >
                        <Tool />
                    </Grid>
                    <Grid  >
                        <Tool />
                    </Grid>
                </Grid>
            }
        </>
    )
}

export default AITools;