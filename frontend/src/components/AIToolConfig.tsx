import { Button, Stack, TextField, Typography } from "@mui/material"
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

    // 删除工具
    const handleDeleteTool = () => {

    }

    if (!open) return null

    return <CardDialog
        title="AI Tool"
        onClose={onClose}
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
                <Stack component="form" spacing={1}>
                    <TextField label="Tool name" required size='small' />
                    <TextField multiline minRows={3} maxRows={5} label="Prompt" required size='small' />
                </Stack>
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