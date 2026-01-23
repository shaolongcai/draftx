import { Button, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useNavigate } from "react-router-dom";


const HotkeysConfig = () => {
    const [shortcut, setShortcut] = useState<string>('Alt+z');

    const notification = useNotifications();
    const navigate = useNavigate();

    // 检查是否已完成初始配置，检查热键配置
    useEffect(() => {
        const init = async () => {
            const saved = await window.electronAPI.getConfig('launchShortcut');
            if (saved) {
                setShortcut(saved);
            }
        }
        init();
    }, []);

    // 监听键盘按下
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();

            const keys: string[] = [];
            // 处理修饰键
            if (e.ctrlKey) keys.push('Ctrl');
            if (e.metaKey) keys.push('Meta');
            if (e.shiftKey) keys.push('Shift');
            if (e.altKey) keys.push('Alt');

            // 处理主键
            let key = e.key.toUpperCase();

            // 忽略单独的修饰键触发(暂时没用)
            if (['CONTROL', 'SHIFT', 'ALT', 'META'].includes(key)) {
                key = '';
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
                keys.push(key);
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

        return shortcutStr
            .replace(/Command/g, '⌘')
            .replace(/Control/g, '⌃')
            .replace(/Alt/g, '⌥')
            .replace(/Shift/g, '⇧')
            .replace(/\+/g, ' '); // Mac shortcuts usually don't use + separator in display
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
            // 根据上一个页面的来源判断跳转路径
            const from = window.history.state?.from || '/';
            console.log('from', from);
            navigate(from === '/' ? '/draft' : '/settings'); // 设置页面进入的，保存后回到设置页面
        } catch (error) {
            console.error('Failed to save shortcut:', error);
            notification.show('Failed to save', { severity: 'error', autoHideDuration: 2000 });
        }
    };

    return (
        <Stack spacing={3} alignItems='center' justifyContent='center' className="h-screen pb-20">
            <Typography variant='bodyLarge' fontWeight={700} textAlign='center'>
                Press any key combination to set the launch shortcut
            </Typography>
            <Typography
                variant='headlineMedium'
                className="border-2 border-[#9F7207]  px-4 py-2 rounded-xl"
            >
                {formatShortcutForDisplay(shortcut)}
            </Typography>
            {/* 如果是系统保留键则标红 */}
            <Button variant='contained' size='large' onClick={handleSave}>
                完成设置
            </Button>
        </Stack>
    )
}

export default HotkeysConfig;