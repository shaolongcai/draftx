import { useState } from "react";
import { ThemeProvider } from '@mui/material'
import { theme } from './theme'
// import { I18nProvider } from './contexts/I18nContext';
import { NotificationsProvider } from '@toolpad/core/useNotifications';
// import { globalContext } from '@/contexts/globalContext';
import { EventProvider } from './contexts/EvenContext'
import { forestTheme, darkTheme, defaultTheme } from './theme'

// Provider 初始化与订阅（示例）
function RootProviders({ children }) {
    const [lang, setLang] = useState('zh-CN');

    // useEffect(() => {
    //     window.electronAPI.getConfig('app_language').then(setLang);
    //     const off = window.electronAPI.onLanguageChanged((l) => setLang(l));
    //     return () => { /* 如果暴露了移除监听就调用 */ };
    // }, []);


    const [isReadyAI, setIsReadyAI] = useState<boolean>(false);
    const currentTheme = window.electronAPI.getConfig('theme')

    // 主题变更器
    const getTheme = () => {
        if (currentTheme === 'forest') {
            return forestTheme
        } else if (currentTheme === 'dark') {
            return darkTheme
        } else {
            // return defaultTheme
            return forestTheme
        }
    }

    return (
        // <I18nProvider defaultLanguage={lang}>
        <ThemeProvider theme={getTheme()}>
            {/* <globalContext.Provider value={{
                    os: getOs(),
                    gpuInfo,
                    setGpuInfo,
                    isReadyAI,
                    setIsReadyAI,
                }}> */}
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
            {/* </globalContext.Provider> */}
        </ThemeProvider>
        // </I18nProvider>
    );
}

export default RootProviders;