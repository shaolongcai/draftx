import { useEffect, useState } from "react";
import { Theme, ThemeProvider } from '@mui/material'
import { I18nProvider } from '@/contexts/I18nContext';
import { NotificationsProvider } from '@toolpad/core/useNotifications';
import { EventProvider } from './contexts/EvenContext'
import { forestTheme, darkTheme, defaultTheme, whiteTheme } from './theme'
import { GlobalContext } from '@/contexts/GlobalContext';

// Provider 初始化与订阅（示例）
function RootProviders({ children }) {

    const [lang, setLang] = useState('en-US');
    const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme)

    useEffect(() => {
        window.electronAPI.getConfig('app_language').then(setLang);
        return () => { /* 如果暴露了移除监听就调用 */ };
    }, []);

    // 主题变更器
    const getTheme = (name: string) => {
        if (name === 'forest') {
            return forestTheme
        } else if (name === 'dark') {
            return darkTheme
        } else if (name === 'default') {
            return defaultTheme
        } else if (name === 'white') {
            return whiteTheme
        } else {
            return defaultTheme
        }
    }

    const setTheme = (themeName: string) => {
        console.log('setTheme', themeName)
        const theme = getTheme(themeName)
        setCurrentTheme(theme);
        // 获取背景颜色
        const bgColor = theme.palette.background.default
        if (bgColor) {
            window.electronAPI.setBackgroundColor(bgColor);
        }
        // 设置主题
        window.electronAPI.setConfig({ key: 'theme', value: themeName });
    }

    useEffect(() => {
        window.electronAPI.getConfig('theme').then((t) => {
            if (t) {
                const theme = getTheme(t)
                setCurrentTheme(theme)
            }
        })

        // 监听配置变更
        const offConfigChange = window.electronAPI.onConfigChange((config) => {
            if (config.key === 'theme') {
                const theme = getTheme(config.value)
                setCurrentTheme(theme)
            }
            // todo 删除单独的监听语言变更函数
            if (config.key === 'app_language') {
                console.log('切换语言', config.value)
                setLang(config.value)
            }
        });

        return () => {
            offConfigChange();
        };
    }, [])

    return (
        <I18nProvider defaultLanguage={lang} language={lang}>
            <ThemeProvider theme={currentTheme}>
                <GlobalContext.Provider value={{
                    setTheme,
                    trialEndDate: null,
                    setTrialEndDate: () => { },
                }}>
                    <NotificationsProvider
                        slotProps={{
                            snackbar: {
                                anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
                                autoHideDuration: 2000,
                            },
                        }}>
                        <EventProvider >
                            {children}
                        </EventProvider>
                    </NotificationsProvider>
                </GlobalContext.Provider>
            </ThemeProvider>
        </I18nProvider>
    );
}

export default RootProviders;