import React, { useEffect, useState } from 'react';
import { SettingTitle } from '@/components';
import { Box, Card, CardActionArea, CardMedia, Grid, Stack, Typography, useTheme } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import { useGlobal } from '@/contexts/GlobalContext';
// Import images
import themeDefault from '@/assets/images/theme-default.png';
import themeDark from '@/assets/images/theme-drak.png'; // Note: filename has typo 'drak'
import themeForest from '@/assets/images/theme-forest.png';
import themeWhite from '@/assets/images/theme-white.png';
import { ConfigParams } from '@/type/electron';

interface ThemeOption {
    name: string;
    key: string;
    image: string;
}

const themes: ThemeOption[] = [
    { name: 'Default', key: 'default', image: themeDefault },
    { name: 'Dark', key: 'dark', image: themeDark },
    { name: 'Forest', key: 'forest', image: themeForest },
    { name: 'White', key: 'white', image: themeWhite },
];

const ThemeSelect: React.FC = () => {
    const [currentTheme, setCurrentTheme] = useState<string>('default');
    const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);

    const theme = useTheme()
    const { setTheme } = useGlobal()

    useEffect(() => {
        window.electronAPI.getConfig('theme').then((theme: string) => {
            setCurrentTheme(theme || 'default');
        });
    }, []);

    const handleThemeSelect = async (key: string) => {
        setCurrentTheme(key);
        setTheme(key)
        const params: ConfigParams = {
            key: 'theme',
            value: key,
            type: 'string', // Assuming type is string based on usage
        };
        await window.electronAPI.setConfig(params);
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <SettingTitle title="Theme" />
            <Box sx={{ p: 1, flex: 1, overflowY: 'auto' }}>
                <Grid container spacing={2} >
                    {themes.map((customTheme) => (
                        <Grid size={6} key={customTheme.key}>
                            <Card
                                sx={{
                                    p: '0px',
                                    position: 'relative',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    border: currentTheme === customTheme.key ? `2px solid ${theme.palette.primary.main}` : '1px solid #ccc',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    },
                                }}
                                onMouseEnter={() => setHoveredTheme(customTheme.key)}
                                onMouseLeave={() => setHoveredTheme(null)}
                            >
                                <CardActionArea onClick={() => handleThemeSelect(customTheme.key)} sx={{ p: '0px' }}>
                                    <CardMedia
                                        component="img"
                                        image={customTheme.image}
                                        alt={customTheme.name}
                                        sx={{
                                            aspectRatio: '16/13',
                                            objectFit: 'cover',
                                        }}
                                    />

                                    {/* Theme Name Overlay - Shows on Hover */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            bgcolor: 'rgba(0, 0, 0, 0.6)',
                                            color: 'white',
                                            p: 1,
                                            textAlign: 'center',
                                            opacity: hoveredTheme === customTheme.key ? 1 : 0,
                                            transition: 'opacity 0.3s ease',
                                        }}
                                    >
                                        <Typography variant="body1" fontWeight="bold">
                                            {customTheme.name}
                                        </Typography>
                                    </Box>

                                    {/* Selected Checkmark */}
                                    {currentTheme === customTheme.key && (
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                top: 8,
                                                right: 8,
                                                color: '#3AACFF',
                                                bgcolor: 'white',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <CheckCircleIcon fontSize="medium" />
                                        </Box>
                                    )}
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Box>
    );
};

export default ThemeSelect;
