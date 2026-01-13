import { Paper, Stack, Typography, Button, Switch } from "@mui/material"
// import { useTranslation } from '@/contexts/I18nContext';


type ActionType = 'button' | 'switch' | 'custom' | 'text'

interface Props {
    title: string;
    value?: string | boolean;
    type: ActionType;
    onAction?: (value: boolean | string | React.MouseEvent) => void;
    action?: React.ReactNode;
    disabled?: boolean;
}

/**
 * @description 配置项组件
 * @param value 配置项的值，取代按钮或者文字的文案
 * @param type 配置项的类型，决定了渲染的组件
 * @param onAction 配置项的操作函数，参数为配置项的值,switch 为 checked，button 为点击事件,当type为custom时，此参数无效
 * @param action 自定义的操作组件
 * @param disabled 是否禁用
 * @returns 
 */
const SettingItem: React.FC<Props> = ({
    title,
    value,
    type,
    onAction,
    action,
    disabled = false,
}) => {

    // const { t } = useTranslation();

    // 渲染末位的操作
    const generateAction = (type: ActionType) => {
        switch (type) {
            case 'button':
                return (
                    <Button
                        sx={{
                            fontWeight: 'bold',
                            border: '1px solid transparent',
                            boxSizing: 'border-box',
                            '&:focus': {
                                outline: 'none',
                                border: '1px solid #fff',
                                boxShadow: 'none'
                            },
                            '&:active': {
                                outline: 'none',
                                border: '1px solid #fff',
                                boxShadow: 'none'
                            },
                            '&:hover': {
                                border: '1px solid #fff'
                            }
                        }}
                        variant='text'
                        className="text-white"
                        onClick={onAction}
                    >
                        {value}
                    </Button>
                )
            case 'switch':
                return (
                    <Switch
                        sx={{
                            '& .MuiSwitch-track': {
                                backgroundColor: '#fff !important',
                                opacity: 0.45
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: '#fff !important',
                                opacity: 1
                            },
                            // 圆点为白色
                            '& .MuiSwitch-thumb': {
                                backgroundColor: '#fff !important',
                                border: '1px solid #000'
                            }
                        }}
                        checked={value as boolean}
                        onChange={(_e, checked) => onAction(checked)}
                        disabled={disabled}
                    />
                )
            case 'text':
                return (
                    <Typography variant='bodyMedium' color="text.primary" >
                        {value}
                    </Typography>
                )
            case 'custom':
                return action
            default:
                break;
        }
    }

    return (
        <Paper className="bg-[#9F7207] px-4 py-3 rounded-2xl w-full" variant='outlined' >
            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                <Typography variant='bodyLarge' color="text.primary" className=" text-white" >
                    {title}
                </Typography>
                {generateAction(type)}
            </Stack>
        </Paper>
    )
}

export default SettingItem;
