import { Button, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SettingTitle } from "@/components";
import { useTranslation } from "@/contexts/I18nContext";


const HotkeysConfig = () => {
    const [shortcut, setShortcut] = useState<string>('Alt+z');

    const notification = useNotifications();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { t } = useTranslation();

    // 检查是否已完成初始配置，检查热键配置
    useEffect(() => {
        const checkConfig = async () => {
            const saved = await window.electronAPI.getConfig('launchShortcut');
            if (saved) {
                setShortcut(saved);
                // 需要检查是否已经设置,仅非设置页需要自动跳过
                const from = searchParams.get('from');
                if (from !== 'setting') {
                    navigate('/');
                }
            }
        }
        checkConfig();
    }, []);

    // 监听键盘按下
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();

            const keys: string[] = [];
            // 处理修饰键
            if (e.ctrlKey) keys.push('Ctrl');
            if (e.metaKey) keys.push('Meta'); // Electron globalShortcut uses 'Command' or 'Cmd' on Mac, 'Super' on Linux, 'Meta' is DOM. We store 'Meta' or 'Command'? Electron prefers 'Command' for Mac.
            if (e.shiftKey) keys.push('Shift');
            if (e.altKey) keys.push('Alt');

            // 处理主键
            let key = e.key.toUpperCase();

            // 忽略单独的修饰键触发(暂时没用)
            if (['CONTROL', 'SHIFT', 'ALT', 'META'].includes(key)) {
                key = '';
            }

            // Fix: 当按下Option(Alt)键时，e.key会变成特殊字符(如π, œ等)，需要使用e.code来获取物理按键
            // 另外，Mac下Option+I/N/E会产生'Dead'键，也需要通过code处理
            // "ß".toUpperCase() ( 大写 )的结果是 "SS" （两个字符），所以会跳过这里的处理，需要直接使用e.key
            if ((e.altKey && e.key.length === 1) || key === 'DEAD') {
                // e.code 通常是 'KeyS', 'Digit1' 等格式
                if (e.code.startsWith('Key')) {
                    key = e.code.replace('Key', '').toUpperCase();
                } else if (e.code.startsWith('Digit')) {
                    key = e.code.replace('Digit', '');
                }
                // 其他情况暂时保持原样或继续处理
            }


            // 特殊键映射
            const keyMap: Record<string, string> = {
                ' ': 'Space',
                '+': 'Plus',
                'ARROWUP': 'Up',
                'ARROWDOWN': 'Down',
                'ARROWLEFT': 'Left',
                'ARROWRIGHT': 'Right',
                'ESCAPE': 'Esc',
                'INSERT': 'Insert',
                'DELETE': 'Delete',
                'HOME': 'Home',
                'END': 'End',
                'PAGEUP': 'PageUp',
                'PAGEDOWN': 'PageDown',
                'TAB': 'Tab',
                'BACKSPACE': 'Backspace',
                'ENTER': 'Enter', // Electron use Return often, or Enter
            };

            if (keyMap[key]) {
                key = keyMap[key];
            } else if (key === 'ENTER') {
                key = 'Enter';
            }

            if (key) {
                // 如果已经存在该键（例如修饰键），则不重复添加
                // 也要检查 keys 中是否已经有相同的字符（比如 Alt+S 场景下，keys里可能有 'Alt'，但不能再有 'S' 如果之前误判了）
                // 这里主要是防止 key 本身已经在 keys 里了
                if (!keys.includes(key)) {
                    keys.push(key);
                }
            }

            // 去重（防止修饰键被重复添加）
            const uniqueKeys = Array.from(new Set(keys));

            // 至少要有一个键才更新，避免空状态
            if (uniqueKeys.length > 0) {
                setShortcut(uniqueKeys.join('+'));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // MAC专用的键盘渲染
    const formatShortcutForDisplay = (shortcutStr: string) => {
        const isMac = window.electronUtils?.platform === 'darwin' || /macintosh|mac os x/i.test(navigator.userAgent);
        if (!isMac) return shortcutStr;

        // Electron globalShortcut format vs Display format
        // Input: "Meta+Shift+S" or "Alt+Z"

        return shortcutStr
            .replace(/Meta/g, '⌘') // 1. Meta -> ⌘
            .replace(/Command/g, '⌘')
            .replace(/Ctrl/g, '⌃')
            .replace(/Alt/g, '⌥')
            .replace(/Shift/g, '⇧')
        // .replace(/\+/g, ' '); // 3. 移除这行，保留 + 号链接组合键
    };

    // 点击保存
    const handleSave = async () => {
        try {
            await window.electronAPI.setConfig({
                key: 'launchShortcut',
                value: shortcut,
                type: 'string'
            });
            notification.show('Shortcut saved successfully', { severity: 'success', autoHideDuration: 1200 });
            // 根据参数判断跳转路径
            const from = searchParams.get('from');
            navigate(from === 'setting' ? '/' : '/'); // 设置页面进入的，保存后回到设置页面
        } catch (error) {
            console.error('Failed to save shortcut:', error);
            notification.show('Failed to save', { severity: 'error', autoHideDuration: 2000 });
        }
    };

    // 系统保留快捷键列表
    const reservedShortcuts = ['Alt+[', 'Alt+]', 'Alt+C', 'Alt+N'];
    // 检查是否为保留快捷键（不区分大小写）
    const isReserved = reservedShortcuts.some(s => s.toLowerCase() === shortcut.toLowerCase());

    return (
        <>
            {
                // 仅设置页面进入需要标题
                searchParams.get('from') === 'setting' && (
                    <SettingTitle title={t('app.shortcut.title')} />
                )
            }
            <Stack spacing={3} alignItems='center' justifyContent='center' className="h-screen pb-20">
                <Typography variant='bodyLarge' fontWeight={700} textAlign='center' color='textPrimary'>
                    {t('app.shortcut.brief')}
                </Typography>
                <Stack alignItems="center" spacing={1}>
                    <Typography
                        variant='headlineMedium'
                        className={`border-2 px-4 py-2 rounded-xl transition-colors ${isReserved
                            ? 'border-red-500 text-red-500 bg-red-50'
                            : 'border-[#9F7207]'
                            }`}
                        color='textPrimary'
                    >
                        {formatShortcutForDisplay(shortcut)}
                    </Typography>
                    {isReserved && (
                        <Typography variant="bodySmall" color="error" textAlign='center' >
                            {t('app.shortcut.error')}
                        </Typography>
                    )}
                </Stack>

                <Button
                    variant='contained'
                    size='large'
                    onClick={handleSave}
                    disabled={isReserved}
                    color={isReserved ? "error" : "primary"}
                >
                    {t('app.shortcut.button')}
                </Button>
            </Stack>
        </>
    )
}

export default HotkeysConfig;