/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Paper, Stack, Typography } from "@mui/material"
import { useNotifications } from "@toolpad/core/useNotifications";
import { SettingTitle } from "@/components";
import { useTranslation } from "@/contexts/I18nContext";
import { useEffect, useMemo, useState } from "react";

const AIToolConfig: React.FC = () => {
    const { t } = useTranslation();
    const notifications = useNotifications();
    const [mcpEntryPath, setMcpEntryPath] = useState('');

    useEffect(() => {
        window.electronAPI.getMcpEntryPath()
            .then((value) => {
                setMcpEntryPath(value);
            })
            .catch(() => {
                setMcpEntryPath('');
            });
    }, []);

    const escapedPath = useMemo(() => {
        if (!mcpEntryPath) {
            return '<YOUR_MCP_SERVER_ABSOLUTE_PATH>\\\\dist\\\\index.js';
        }
        return mcpEntryPath.replace(/\\/g, '\\\\');
    }, [mcpEntryPath]);

    const mcpConfigSnippet = [
        '"draftx-mcp": {',
        '  "command": "node",',
        '  "args": [',
        `    "${escapedPath}"`,
        '  ],',
        '  "env": {}',
        '}'
    ].join('\n');


    const handleCopy = async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            notifications.show(t('app.settings.mcpCommandCopied' as any), {
                severity: 'success',
                autoHideDuration: 1500,
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : '复制失败';
            notifications.show(msg, {
                severity: 'error',
                autoHideDuration: 2000,
            });
        }
    }

    return <>
        <SettingTitle title={t('app.settings.mcpProvider')} />
        <Stack spacing={2} className="mt-6">
            <Typography variant="bodyMedium" color="textPrimary">
                {t('app.settings.mcpCommandDesc' as any)}
            </Typography>
            <Paper variant="outlined" className="rounded-2xl p-4 bg-black/70 border-white/20">
                <Typography
                    component="pre"
                    variant="bodyMedium"
                    className="whitespace-pre-wrap break-all text-green-300 font-mono"
                >
                    {mcpConfigSnippet}
                </Typography>
            </Paper>
            <Typography variant="bodySmall" color="textSecondary">
                {t('app.settings.mcpPathTip' as any)}
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="center">
                <Button variant="contained" onClick={() => handleCopy(mcpConfigSnippet)}>
                    {t('app.settings.mcpCopyCommand' as any)}
                </Button>
                {/* <Button variant="outlined" onClick={() => navigate(-1)}>
                    {t('app.common.close')}
                </Button> */}
            </Stack>
        </Stack>
    </>
}

export default AIToolConfig
