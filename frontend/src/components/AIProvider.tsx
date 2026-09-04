import { ConfigParams } from "@/type/electron";
import { Autocomplete, Button, Stack, TextField, Typography } from "@mui/material"
import { useRequest } from "ahooks";
import { useEffect, useState } from "react";
import SettingTitle from "./SettingTitle";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@toolpad/core/useNotifications";

// ollama关联的模型列表
const DEFAULT_OLLAMA_MODELS: string[] = [
    'qwen2.5:0.5b', 'qwen2.5:1.8b', 'qwen2.5:3b', 'qwen2.5:7b', 'qwen2.5:14b', 'qwen2.5:32b', 'qwen2.5:72b',
    'qwen2.5-vl:3b', 'qwen2.5-vl:7b', 'qwen2-vl:7b',
    'llama3.1:8b', 'llama3.1:70b', 'llama3:8b', 'llama3:70b', 'llama2:7b', 'llama2:13b',
    'mistral:7b', 'mixtral:8x7b', 'mixtral:8x22b',
    'gemma:2b', 'gemma:7b', 'gemma2:2b', 'gemma2:9b', 'gemma2:27b',
    'phi3:mini', 'phi3:medium', 'phi3:3.8b',
    'codellama:7b', 'codellama:13b', 'codellama:34b', 'codegemma:7b',
    'qwen2.5-coder:7b', 'qwen2.5-coder:32b', 'starcoder2:15b',
    'deepseek-coder:6.7b', 'deepseek-coder:33b',
    'llava:7b', 'llava:13b', 'llava-phi3:3.8b',
    'moondream:1b', 'bakllava:7b', 'yi:34b',
    'orca-mini:3b', 'wizardlm2:7b', 'wizardlm2:13b',
    'openhermes:7b', 'nous-hermes:13b', 'aya:8b', 'aya:35b'
];


const AIProvider: React.FC = () => {

    const [apiHost, setApiHost] = useState('http://127.0.0.1:11434');
    const [apiHostError, setApiHostError] = useState('');
    const [modelID, setModelID] = useState<string | undefined>();
    const [modelIDError, setModelIDError] = useState('');
    const [modelOptions, setModelOptions] = useState<string[]>(DEFAULT_OLLAMA_MODELS);

    const navigate = useNavigate();
    const notification = useNotifications();

    // 新增：拉取本地 Ollama 已安装模型并合并（作用：让选项包含本地 models）
    useEffect(() => {
        const fetchModels = async () => {
            try {
                const res = await fetch(`${apiHost}/api/tags`);
                const json = await res.json();
                const names: string[] = Array.isArray(json?.models) ? json.models.map((m: { name: string }) => m.name) : [];
                if (names.length) {
                    setModelOptions(Array.from(new Set([...DEFAULT_OLLAMA_MODELS, ...names])));
                }
            } catch (error) {
                const msg = error instanceof Error ? error.message : '拉取本地 Ollama 已安装模型失败'
                console.log(msg)
                // notification.show(msg,{
                //     severity: 'error',
                // })
            }
        };
        fetchModels();
    }, [apiHost]);

    useRequest(window.electronAPI.getConfig, {
        defaultParams: ['ai_provider'],
        onSuccess: (dataString: string) => {
            const data = JSON.parse(dataString);
            console.log('data', data)
            setApiHost(data?.host || 'http://127.0.0.1:11434');
            setModelID(data?.model);
        }
    });

    // 应用配置
    const handleApply = async () => {
        console.log('应用配置', apiHost, modelID)

        // 检查
        if (!apiHost || !modelID) {
            setApiHostError(!apiHost ? 'please input API Host' : '');
            setModelIDError(!modelID ? 'please input Model ID' : '');
            return;
        }

        // 检查ollama服务是否正常
        const checkRes = await window.electronAPI.checkOllamaServer(apiHost, modelID);
        if (checkRes.code !== 0) {
            notification.show(checkRes.errMsg, {
                severity: 'error',
                autoHideDuration: 12000,
            })
            return;
        }
        // todo检查
        const data = JSON.stringify({
            host: apiHost,
            model: modelID,
            provider: 'ollama',
        })
        const params: ConfigParams = {
            key: 'ai_provider',
            value: data,
            type: 'string',
        }
        await window.electronAPI.setConfig(params);  // 接口设置配置
        navigate(-1);
    }

    return (
        <div >
            <SettingTitle title="AI Provider" />
            <Stack spacing={3} alignItems='center' className="mt-6">
                <Stack spacing={2} className="w-full" alignItems="center">
                    <Typography variant='titleSmall' color='text.secondary' className="w-full" >
                        Ollama
                    </Typography>
                    <TextField
                        required
                        label='API Host'
                        variant='standard'
                        placeholder='Please input API address'
                        onChange={(e) => setApiHost(e.target.value)}
                        value={apiHost}
                        fullWidth
                        error={Boolean(apiHostError)}
                        helperText={apiHostError}
                    />
                    <Autocomplete
                        freeSolo
                        options={modelOptions}
                        value={modelID ?? ''}
                        onChange={(_, newValue) => setModelID((newValue as string) || '')}
                        onInputChange={(_, newInputValue) => setModelID(newInputValue)}
                        className="w-full"
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                required
                                label='Model ID'
                                variant='standard'
                                fullWidth
                                error={Boolean(modelIDError)}
                                helperText={modelIDError}
                            />
                        )}
                    />
                    <Button
                        variant='contained'
                        className="w-fit"
                        fullWidth={false}
                        onClick={handleApply}
                    >
                        Save
                    </Button>
                    {/* <Button
                        variant='outlined'
                        className="w-fit"
                        fullWidth={false}
                        onClick={() => { navigate(-1) }}
                    >
                        Cancel
                    </Button> */}
                </Stack>
            </Stack>
        </div>
    )
}

export default AIProvider