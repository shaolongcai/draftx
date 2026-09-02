import { Switch } from "@/components/ui/switch"

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
 * @description 配置项组件（设置卡片内的一行）
 * @param value 配置项的值，取代按钮或者文字的文案
 * @param type 配置项的类型，决定了渲染的组件
 * @param onAction 配置项的操作函数，参数为配置项的值,switch 为 checked，button 为点击事件,当type为custom时，此参数无效
 * @param action 自定义的操作组件
 * @param disabled 是否禁用
 */
const SettingItem: React.FC<Props> = ({
    title,
    value,
    type,
    onAction,
    action,
    disabled = false,
}) => {

    // 渲染末位的操作
    const generateAction = (type: ActionType) => {
        switch (type) {
            case 'button':
                return (
                    <button
                        type='button'
                        disabled={disabled}
                        onClick={onAction}
                        className="cursor-pointer text-sm tracking-widest uppercase text-[#3A332C]/60 transition-colors hover:text-[#3A332C] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {value}
                    </button>
                )
            case 'switch':
                return (
                    <Switch
                        checked={!!value}
                        onCheckedChange={(checked) => onAction?.(checked)}
                        disabled={disabled}
                    />
                )
            case 'text':
                return (
                    <span className="text-sm text-[#3A332C]/60">
                        {value}
                    </span>
                )
            case 'custom':
                return action
            default:
                break;
        }
    }

    return (
        <div className="flex w-full items-center justify-between gap-4 py-3">
            <span className="text-[15px] text-[#3A332C]">
                {title}
            </span>
            {generateAction(type)}
        </div>
    )
}

export default SettingItem;
