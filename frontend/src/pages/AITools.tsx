import { SettingItem, SettingTitle } from "@/components"
import { Paper, Stack, Typography } from "@mui/material"
import { useRequest } from "ahooks"
import { useNavigate } from "react-router-dom"



const AITools = () => {

    const navigate = useNavigate()

    // 获取AI配置
    const { data: aiConfig } = useRequest(
        () => window.electronAPI.getConfig('ai_provider'),
    )

    // 获取AI工具
    const { data } = useRequest(
        () => window.electronAPI.getAITools(),
    )


    return <div >
        {
            aiConfig ?
                <>
                    <SettingTitle title="AI Tools" />
                    <Stack spacing={3} alignItems='center' className="mt-6">
                        <Stack spacing={2} className="w-full" alignItems="center">
                            {
                                (data as AIToolItem[])?.map((item) => {
                                    return <SettingItem
                                        key={item.id}
                                        title={item.name}
                                        type="button"
                                        value='eidt'
                                        onAction={() => { navigate(`/AIToolConfig?id=${item.id}`) }}
                                    />
                                })
                            }
                            <Paper
                                className="cursor-pointer w-full rounded-2xl bg-transparent border border-dashed border-black/25 px-4 py-3 flex items-center justify-center"
                                variant='outlined'
                                onClick={() => { navigate('/AIToolConfig') }}
                            >
                                <span className="text-4xl text-gray-400">+</span>
                            </Paper>
                        </Stack>
                    </Stack>
                </>
                :
                <Stack spacing={2}>
                    <Typography variant='bodyMedium'>
                        Please
                        {' '}
                        <Typography component="span" color="primary"
                            className="cursor-pointer font-bold"
                        >add AI configuration</Typography>
                        {' '}
                        first
                    </Typography>
                    <Typography variant='bodyMedium'>
                        After adding, you can use AI to organize your memos or any custom AI behavior
                    </Typography>
                </Stack>
        }
    </div>
}


export default AITools;