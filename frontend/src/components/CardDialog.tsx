import { Button, Card, IconButton, Stack, Typography } from "@mui/material"
import { Close as CloseIcon } from '@mui/icons-material';


interface Props {
    children: React.ReactNode;
    onClose: () => void;
    title: string;
    primaryBtnLabel?: string;
    primaryAction?: () => void;
    secondaryBtnLabel?: string;
    secondaryAction?: () => void;
    secondaryBtn?: React.ReactNode; //额外的次级按钮,使用这个，不需要使用secondaryBtnLabel和secondaryAction
}
/**
 * 自定义的卡片窗口
 * @param children 内容元素 
 */
const CardDialog: React.FC<Props> = ({
    children,
    onClose,
    title,
    primaryBtnLabel,
    primaryAction,
    secondaryBtnLabel,
    secondaryAction,
    secondaryBtn
}) => {
    return <Card className="w-100">
        <Stack spacing={2} >
            <Stack direction='row' alignItems='center' justifyContent='space-between'>
                <Typography variant='headlineMedium'>
                    {title}
                </Typography>
                <IconButton size='medium' onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </Stack>
            {children}
            <Stack spacing={1} className="mx-auto">
                {
                    primaryBtnLabel &&
                    <Button variant='contained' onClick={primaryAction}
                        fullWidth={false}
                        size='medium'
                    >
                        {primaryBtnLabel}
                    </Button>
                }
                {/* 次级按钮，优先显示自己传入的 */}
                {
                    (secondaryBtnLabel || secondaryBtn) &&
                    (
                        secondaryBtn ||
                        <Button variant='outlined' onClick={secondaryAction}
                            size='medium'
                        >
                            {secondaryBtnLabel}
                        </Button>
                    )
                }
            </Stack>
        </Stack>
    </Card>
}


export default CardDialog