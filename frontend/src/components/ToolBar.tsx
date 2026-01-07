import { IconButton, Stack, Tooltip } from "@mui/material";
import { ReactNode, useMemo, useState } from "react";
import {
    AddCircleOutline as AddIcon,
    Search as SearchIcon,
    GridView as AllIcon
} from "@mui/icons-material";
import { useEvent } from "@/contexts/EvenContext";



interface ToolButtonProps {
    icon: ReactNode;
    className?: string;
    tip?: string;
    onClick?: () => void;
}
// Icon按钮
const ToolButton: React.FC<ToolButtonProps> = ({
    icon,
    className,
    tip,
    onClick
}) => {
    return (
        <Tooltip title={tip}>
            <IconButton size="small" className={`text-white ${className}`}
                onClick={onClick}
            >
                {icon}
            </IconButton>
        </Tooltip>
    )
}


//主控件
const ToolBar: React.FC = () => {

    const [active, setActive] = useState(false);

    const { handleOnclickTool$ } = useEvent();

    const toolButtons = useMemo(() => [
        {
            icon: <AddIcon />,
            className: 'hover:bg-[#9F7207]/70',
            tip: 'Add a new Draft',
            onClick: () => handleOnclickTool$.emit('addDraft'),
        },
        {
            icon: <AllIcon />,
            className: 'hover:bg-[#9F7207]/70',
            tip: 'Show all Drafts',
            onClick: () => handleOnclickTool$.emit('allList'),
        }
    ], []);


    return (
        <div className="w-fit">
            <div
                className={` mx-auto rounded-2xl transition-all   
                    duration-300 ease-out 
                    ${active ? 'w-full px-2 py-1 bg-linear-to-r from-[#9F7207]/70 via-[#9F7207]/85 to-[#9F7207] opacity-100' :
                        'h-1 w-20 bg-[#9F7207]/45 '}`}
                onMouseEnter={() => setActive(true)}
                onMouseLeave={() => setActive(false)}
            >
                <Stack
                    alignItems="center"
                    direction="row"
                    className={`items-center gap-1 px-2 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                >
                    {toolButtons.map((button, index) => (
                        <ToolButton key={index} {...button} />
                    ))}
                </Stack>
            </div>
        </div>
    )
}


export default ToolBar;