import { SettingTitle } from "@/components"
import { Button, Paper, Stack, Typography } from "@mui/material"
import proTipsImg from '@/assets/images/pro.png'
import DiscordIcon from '@/assets/icons/discord.svg'
import { useNavigate } from 'react-router-dom'

/**
 * 升级Pro的提示
 */
const ProTips: React.FC = () => {

    const navigate = useNavigate()

    return (
        <>
            <SettingTitle title="Upgrade to Pro" />
            <Stack className="mt-6 " spacing={2} alignItems='center' >
                <Typography fontWeight={600} variant='headlineSmall' textAlign={'center'}>
                    Unlock AI enhanced and More
                </Typography>
                <Typography fontWeight={600} variant="headlineSmall" textAlign={'center'}>
                    $9,One-time, lifetime license.
                </Typography>
                <img src={proTipsImg} className="w-[50%]" alt="proTipsImg" />
                <Stack spacing={1} alignItems='center' >
                    <Paper
                        variant='outlined'
                        onClick={() => window.electronAPI.openExternalUrl('https://discord.gg/qJHfsGXTzP')}
                        className='border-[#9F7207] border bg-transparent p-4 rounded-[8px]! box-border cursor-pointer'
                    >
                        <img src={DiscordIcon} className='w-10 h-10' />
                    </Paper>
                    <Typography fontWeight={700} variant='bodyMedium' textAlign={'center'}>
                        Go to Discord to purchase an activation code.
                    </Typography>
                    <Typography color="text.secondary" variant='bodyMedium' textAlign={'center'}>
                        Each code can be used up to 3 times.
                    </Typography>
                </Stack>
                <Button
                    className="mb-6"
                    variant='contained'
                    onClick={() => navigate('/ActivationCode')}
                >
                    Enter Activation Code
                </Button>
            </Stack>
        </>
    )
}

export default ProTips