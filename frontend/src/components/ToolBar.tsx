import { IconButton, Stack, Tooltip } from "@mui/material";
import { ReactNode, useMemo, useState } from "react";
import {
    AddCircleOutline as AddIcon,
    Search as SearchIcon,
    GridView as AllIcon,
    Mode as DraftIcon,
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


interface Props {
    currentPage: 'draft' | 'list' //当前处在的页面
}
//主控件
const ToolBar: React.FC<Props> = ({ currentPage }) => {

    const [active, setActive] = useState(false);

    const { handleOnclickTool$ } = useEvent();

    const toolButtons = useMemo<ToolButtonProps[]>(() => {
        const buttons: ToolButtonProps[] = [
            {
                icon: <AddIcon />,
                className: 'hover:bg-[#9F7207]/70',
                tip: 'Add a new draft  (Alt + N)',
                onClick: () => handleOnclickTool$.emit('addDraft'),
            }
        ];

        if (currentPage === 'draft') {
            buttons.push({
                icon: <AllIcon />,
                className: 'hover:bg-[#9F7207]/70',
                tip: 'Show all drafts',
                onClick: () => handleOnclickTool$.emit('allList'),
            });
        }

        if (currentPage === 'list') {
            buttons.push({
                icon: <DraftIcon />,
                className: 'hover:bg-[#9F7207]/70',
                tip: 'Back the draft',
                onClick: () => handleOnclickTool$.emit('draft'),
            });
        }

        return buttons;
    }, [currentPage]);


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
                    justifyContent="space-between"
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