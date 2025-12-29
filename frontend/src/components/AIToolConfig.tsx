import { Button, Stack, TextField } from "@mui/material"
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

    // 删除工具
    const handleDeleteTool = () => {

    }

    if (!open) return null

    return <CardDialog
        title="AI Tool"
        onClose={onClose}
        primaryBtnLabel="save"
        secondaryBtn={
            mode === 'edit' &&
            <Button variant='outlined' color='error'
                onClick={() => { deleteText === 'Delete' ? setDeleteText('Comfig delete？') : handleDeleteTool() }}
            >
                {deleteText}
            </Button>
        }
    >
        <Stack component="form" spacing={1}>
            <TextField label="Name" required />
            <TextField label="Prompt" required />
        </Stack>
    </CardDialog>
}

export default AIToolConfig