import React from 'react'
import { Paper, Stack } from "@mui/material"
import DiscordIcon from '@/assets/icons/discord.svg'
import EmailIcon from '@/assets/icons/email.svg'
import { useNotifications } from '@toolpad/core/useNotifications'

const Contact: React.FC = () => {

    const notifications = useNotifications();

    // 复制邮箱
    const copyEmail = () => {
        navigator.clipboard.writeText('aenou634047622@gmail.com');
        notifications.show('Copied successfully', {
            severity: 'success',
            autoHideDuration: 1800,
        });
    };

    return (
        <Stack spacing={2} alignItems='center' direction='row'>
            <Paper
                elevation={0}
                onClick={() => window.electronAPI.openExternalUrl('https://discord.gg/TyArpAVf6A')}
                className='p-4 rounded-[8px]! box-border cursor-pointer'
            >
                <img src={DiscordIcon} className='w-10 h-10' />
            </Paper>
            <Paper
                elevation={0}
                className=' p-4 rounded-[8px]! box-border cursor-pointer'
                onClick={copyEmail}
            >
                <img src={EmailIcon} className='w-10 h-10' />
            </Paper>
        </Stack>
    )
}

export default Contact