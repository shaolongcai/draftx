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
                variant='outlined'
                onClick={() => window.electronAPI.openExternalUrl('https://discord.gg/qJHfsGXTzP')}
                className='border-[#9F7207] border bg-transparent p-4 rounded-[8px]! box-border cursor-pointer'
            >
                <img src={DiscordIcon} className='w-10 h-10' />
            </Paper>
            <Paper
                className='border-[#9F7207] border bg-transparent p-4 rounded-[8px]! box-border cursor-pointer'
                variant='outlined' onClick={copyEmail}>
                <img src={EmailIcon} className='w-10 h-10' />
            </Paper>
        </Stack>
    )
}

export default Contact