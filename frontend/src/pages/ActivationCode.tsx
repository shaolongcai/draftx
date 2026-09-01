import { useTranslation } from "@/contexts/I18nContext"
import { alpha } from "@mui/material/styles"
import { Button, Paper, Stack, TextField, Typography, useTheme } from "@mui/material"
import { useEffect, useState } from "react"
import axios from 'axios'
import { useNotifications } from "@toolpad/core/useNotifications"
import DiscordIcon from '@/assets/icons/discord.svg'
import { useNavigate } from "react-router-dom"
import { TrialType } from "@/type/electron"

const DISCORD_URL = 'https://discord.gg/TyArpAVf6A'

const ActivationCode: React.FC = () => {
    const [machineId, setMachineId] = useState('')
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [trialType, setTrialType] = useState<TrialType | null>(null)

    const notifications = useNotifications()
    const navigate = useNavigate()
    const theme = useTheme()
    const { t } = useTranslation()


    // 获取试用状态
    useEffect(() => {
        window.electronAPI.verifyTrial().then(trialRes => {
            setTrialType(trialRes.trialType)
        })
    }, [])

    useEffect(() => {
        window.electronAPI.getMachineId().then(setMachineId)
    }, [])

    // 开始试用
    const handleStartTrial = () => {
        window.electronAPI.startTrial().then(res => {
            if (res.success) {
                navigate('/')
                return
            }
            throw res.message
        })
            .catch(err => {
                console.error(err)
                const msg = err instanceof Error ? err.message : 'Trial start failed';
                notifications.show(msg, {
                    severity: 'error',
                    autoHideDuration: 1800,
                })
            })
    }

    const handleJoinDiscord = () => {
        window.electronAPI.openExternalUrl(DISCORD_URL)
    }

    const handleActivate = async () => {
        if (!code.trim() || !machineId) return

        setLoading(true)
        try {
            const res = await axios.post('https://api.draftx.cc/osai/activationCode/use', { code, deviceHash: machineId })
            if (res.data.code === 0) {
                notifications.show(t('app.settings.activationSuccessToast'), {
                    severity: 'success',
                    autoHideDuration: 1200,
                })
                const licenseData = {
                    payload: res.data.data.payload,
                    signature: res.data.data.signature,
                }
                await window.electronAPI.setConfig({
                    key: 'licenseData',
                    value: JSON.stringify(licenseData),
                    type: 'string'
                })
                navigate('/')
                return
            }
            throw res.data.errMsg
        } catch (error) {
            console.error(error)
            const msg = error instanceof Error ? error.message : String(error)
            notifications.show(msg, {
                severity: 'error',
                autoHideDuration: 1800,
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div>
                <Stack spacing={3} alignItems='center'>
                    <Paper
                        elevation={0}
                        onClick={handleJoinDiscord}
                        sx={{
                            width: 84,
                            height: 84,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '18px',
                            border: `1px solid ${alpha(theme.palette.primary.main, 1)}`,
                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.14),
                                transform: 'translateY(-1px)',
                            },
                        }}
                    >
                        <img src={DiscordIcon} className="h-10 w-10" alt="discord" />
                    </Paper>

                    <Stack spacing={1} alignItems='center'>
                        <Typography variant='headlineSmall' textAlign='center' color='text.primary'>
                            {t('app.settings.activationJoinDiscord')}
                        </Typography>
                        <Typography
                            variant='titleLarge'
                            textAlign='center'
                            sx={{ color: theme.palette.primary.main, fontWeight: 800 }}
                        >
                            {t('app.settings.activationPrice')}
                        </Typography>
                    </Stack>
                    <Stack spacing={1.25} className="w-full">
                        <TextField
                            fullWidth
                            variant="outlined"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleActivate()
                                }
                            }}
                            placeholder={t('app.settings.activationCodePlaceholder')}
                            disabled={loading}
                            size="small"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '14px',
                                    backgroundColor: alpha(theme.palette.background.default, 0.18),
                                    '& fieldset': {
                                        borderColor: alpha(theme.palette.text.primary, 0.24),
                                    },
                                    '&:hover fieldset': {
                                        borderColor: alpha(theme.palette.primary.main, 0.5),
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: theme.palette.primary.main,
                                    },
                                },
                                '& .MuiInputBase-input': {
                                    py: 1.5,
                                    color: theme.palette.text.primary,
                                },
                                '& .MuiInputBase-input::placeholder': {
                                    opacity: 1,
                                    color: alpha(theme.palette.text.primary, 0.56),
                                },
                            }}
                        />
                        <Typography
                            variant='bodySmall'
                            sx={{ color: alpha(theme.palette.text.primary, 0.68), lineHeight: 1.7 }}
                        >
                            {t('app.settings.activationCodeHelper')}
                        </Typography>
                    </Stack>

                    <Stack spacing={1.5} className="w-full" >
                        <Button
                            variant='contained'
                            color='primary'
                            onClick={handleActivate}
                            disabled={!code.trim() || !machineId || loading}
                            fullWidth
                            size="large"
                            sx={{ borderRadius: '12px', fontWeight: 700, boxShadow: 'none' }}
                        >
                            {loading ? t('app.settings.activationLoading') : t('app.settings.activationButton')}
                        </Button>
                        <Button
                            variant='outlined'
                            color='primary'
                            onClick={handleStartTrial}
                            fullWidth
                            size="large"
                            disabled={trialType === 'EXPIRED' || trialType === 'MISMATCH'}
                            sx={{ borderRadius: '12px', py: 1.05, fontWeight: 700 }}
                        >
                            {(trialType === 'EXPIRED' || trialType === 'MISMATCH') ?
                                t('app.settings.activationTrialExpired') :
                                t('app.settings.activationTrialButton')}
                        </Button>
                    </Stack>
                </Stack>
            </div>
        </>
    )
}

export default ActivationCode
