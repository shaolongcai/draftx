import { Button, FormControlLabel, FormGroup, Stack, TextField, Typography } from "@mui/material"
import CardDialog from "./CardDialog"
import { useState } from "react";



interface Props {
    onClose: () => void;
    mode: 'add' | 'edit'
    onFinish: () => void
    open: boolean,
    tool?: {
        name: string,
        prompt: string
    }
}
const AIToolConfig: React.FC<Props> = ({
    onClose,
    open,
    mode,
    tool,
    onFinish
}) => {

    const [deleteText, setDeleteText] = useState('Delete');
    const [isReadyAi, setIsReadyAi] = useState(true); //是否已经配置好AI


    // 处理表单提交
    const saveAITool = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // 获取表单数据
        const formData = new FormData(e.currentTarget);
        const toolName = formData.get('toolName') as string;
        const prompt = formData.get('prompt') as string;

        // 验证
        if (!toolName?.trim() || !prompt?.trim()) {
            console.error('请填写完整信息');
            return;
        }

        // 构建数据
        const toolData = {
            name: toolName,
            prompt: prompt
        };

        console.log('保存AI工具配置:', toolData);

        // TODO: 调用API保存
        // window.electronAPI.setConfig({
        //     key: 'ai_tools',
        //     value: JSON.stringify(toolData),
        //     type: 'string'
        // });

        onFinish();

    }

    // 删除工具
    const handleDeleteTool = () => {

    }

    if (!open) return null

    return <CardDialog
        title="AI Tool"
        onClose={onClose}
        primaryAction={() => {
            // 触发表单提交
            const form = document.querySelector('form') as HTMLFormElement;
            if (form) {
                form.requestSubmit();
            }
        }}
        primaryBtnLabel={isReadyAi ? 'Save' : ''}
        secondaryBtn={
            mode === 'edit' &&
            <Button variant='outlined' color='error'
                onClick={() => { deleteText === 'Delete' ? setDeleteText('Comfig delete？') : handleDeleteTool() }}
            >
                {deleteText}
            </Button>
        }
    >
        {
            isReadyAi ?
                <form onSubmit={saveAITool} >
                    <Stack spacing={2}>
                        <TextField
                            name="toolName"
                            label="Tool name"
                            required
                            size='small'
                            fullWidth
                            defaultValue={tool?.name || ''}
                        />
                        <TextField
                            name="prompt"
                            label="Prompt"
                            multiline
                            minRows={3}
                            maxRows={5}
                            required
                            size='small'
                            fullWidth
                            defaultValue={tool?.prompt || ''}
                        />
                    </Stack>
                </form>
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
    </CardDialog>
}

export default AIToolConfig