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

    return (
        <div className="h-full px-[48px] py-[32px] flex flex-col">
            <SettingTitle title="MCP" />
            <Paper
                elevation={0}
                className="mt-6 flex-1 rounded-2xl p-6 flex flex-col bg-[#EBE1D3]"
            >
                <Typography variant="titleLarge" color="textPrimary">
                    AI Sever
                </Typography>
                <Stack spacing={0.5} className="mt-3">
                    <Typography variant="bodyMedium" color="textPrimary">
                        {t('app.settings.mcpCommandDesc' as any)}
                    </Typography>
                    <Typography variant="bodyMedium" color="textPrimary">
                        {t('app.settings.mcpPathTip' as any)}
                    </Typography>
                </Stack>
                <Paper
                    elevation={0}
                    className="mt-4 rounded-xl p-4 bg-[#DCD9CC]"
                >
                    <Typography
                        component="pre"
                        variant="bodyMedium"
                        color="textPrimary"
                        className="whitespace-pre-wrap break-all font-mono"
                    >
                        {mcpConfigSnippet}
                    </Typography>
                </Paper>
                <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleCopy(mcpConfigSnippet)}
                    className="mt-6"
                    sx={{
                        bgcolor: '#8D8577',
                        borderRadius: '12px',
                        py: 1.5,
                        boxShadow: 'none',
                        '&:hover': { bgcolor: '#7C7466', boxShadow: 'none' },
                    }}
                >
                    {t('app.settings.mcpCopyCommand' as any)}
                </Button>
            </Paper>
        </div>
    )
}

export default AIToolConfig
