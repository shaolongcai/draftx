import { Button, Stack, TextField } from "@mui/material"
import { useNotifications } from "@toolpad/core/useNotifications";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSearchParams } from 'react-router-dom';
import { useRequest } from "ahooks";
import { SettingTitle } from "@/components";

const AIToolConfig: React.FC = () => {

    const [isConfirmDelete, setIsConfirmDelete] = useState(false);
    const [toolName, setToolName] = useState(''); // 工具名称
    const [prompt, setPrompt] = useState(''); // Prompt

    const [searchParams] = useSearchParams();
    const notifications = useNotifications();
    const navigate = useNavigate();
    const id = searchParams.get('id'); // 从 URL 获取 id 参数
    const mode = id ? 'edit' : 'add';

    // 获取AI工具详情
    useRequest(
        () => window.electronAPI.getAITools(Number(id)),
        {
            ready: mode === 'edit',
            onSuccess: (data: AIToolItem) => {
                setToolName(data.name);
                setPrompt(data.prompt);
            }
        }
    )


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
        window.electronAPI.saveAITool(toolData);
        notifications.show('AI tool saved successfully', {
            severity: 'success',
            autoHideDuration: 1500,
        });
        navigate(-1);
    }

    // 删除工具
    const handleDeleteTool = () => {
        // 如果是第一次需要再确认一次
        if (!isConfirmDelete) {
            setIsConfirmDelete(true);
            return;
        }
        try {
            window.electronAPI.deleteAITool(Number(id));
            notifications.show('AI tool deleted successfully', {
                severity: 'success',
                autoHideDuration: 1500,
            });
            navigate(-1);
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown error';
            notifications.show(msg, {
                severity: 'error',
                autoHideDuration: 2000,
            });
        } finally {
            setIsConfirmDelete(false);
        }
    }

    if (!open) return null

    return <>
        <form onSubmit={saveAITool} >
            <SettingTitle title="AI Tool Config" />
            <Stack spacing={2} className="mt-6">
                <TextField
                    name="toolName"
                    label="Tool name"
                    required
                    size='small'
                    fullWidth
                    value={toolName}
                    onChange={(e) => setToolName(e.target.value)}
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
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />
            </Stack>
            <Stack spacing={1} className="mt-6">
                <Button
                    variant='contained'
                    className="w-fit mx-auto"
                    onClick={() => {
                        const form = document.querySelector('form') as HTMLFormElement;
                        if (form) {
                            form.requestSubmit();
                        }
                    }}
                    size='medium'
                >
                    {mode === 'add' ? 'Add' : 'Save'}
                </Button>
                {mode === 'edit' && (
                    <Button
                        variant='outlined'
                        className="w-fit mx-auto"
                        color="error"
                        onClick={handleDeleteTool}
                        size='medium'
                    >
                        {isConfirmDelete ? 'Confirm Delete' : 'Delete'}
                    </Button>
                )}
            </Stack>
        </form>
    </>
}

export default AIToolConfig