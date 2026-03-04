import { Theme } from "@mui/material";
import { createTheme } from '@mui/material/styles';
// When using TypeScript 3.x and below
// import '@mui/lab/themeAugmentation';


//主题
export const theme = createTheme({

    // cssVariables: {
    //     colorSchemeSelector: 'class', // 使用 class 切换主题，避免闪烁
    // },
    colorSchemes: {
        // light: {
        //     palette: {
        //         primary: {
        //             main: '#0F766E',
        //             contrastText: '#FFFFFF',
        //         },
        //         text: {
        //             primary: 'rgba(0, 0, 0, 0.85)',
        //         },
        //         background: {
        //             default: '#FFFFFF',
        //             paper: '#FAFAFA',
        //         },
        //     },
        // },
        // dark: {
        //     palette: {
        //         primary: {
        //             main: '#E36F1C',
        //             contrastText: '#FFFFFF',
        //         },
        //         text: {
        //             primary: '#FFFFFF',
        //         },
        //         background: {
        //             default: '#0A0A0A',
        //             paper: '#2D2D2D',

        //         },
        //         // ...other tokens
        //     },
        // },
    },

    //组件
    components: {

        MuiCard: {
            styleOverrides: {
                root: ({ theme }: { theme: Theme }) => ({
                    borderRadius: '16px',
                    padding: '24px',
                    backgroundColor: theme.palette.background.default,
                    border: '1px solid rgba(0, 0, 0, 0.25)',
                    boxShadow: '0px 2px 2px rgba(0, 0, 0, 0.05)',
                }),
            },
        },

        // 按钮
        MuiButton: {
            styleOverrides: {
                contained: ({ theme }: { theme: Theme }) => ({
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    border: 'none',
                    '&:hover': {
                        backgroundColor: theme.palette.background.paper, // 85% 透明度
                    }
                })
            }
        },

        MuiChip: {
            styleOverrides: {
                outlinedPrimary: {
                    borderColor: '#3AACFF',
                    color: '#1890FF',
                }
            }
        },

        // 更具体的图标颜色设置
        MuiSvgIcon: {
            styleOverrides: {
                root: {
                    '&.MuiChip-deleteIcon': {
                        color: '#3AACFF', // 只对Button组件的图标应用
                    }
                }
            }
        },
    },



    //字体
    typography: {
        //页面大标题
        headlineLarge: {
            fontSize: '32px',
            lineHeight: '40px',
            fontWeight: "bold",
        },
        //页面中标题
        headlineMedium: {
            fontSize: '28px',
            lineHeight: '36px',
            fontWeight: "bold",
        },
        //页面小标题
        headlineSmall: {
            fontSize: '24px',
            lineHeight: '32px',
            fontWeight: "bold",
        },
        //卡片等大标题
        titleLarge: {
            fontSize: '22px',
            lineHeight: '28px',
            fontWeight: "bold",
        },

        //卡片等中标题
        titleMedium: {
            fontSize: '16px',
            lineHeight: '24px',
            fontWeight: "bold",
        },

        //卡片等小标题
        titleSmall: {
            fontSize: '14px',
            lineHeight: '20px',
            fontWeight: "bold",
        },

        //大标签
        labelLarge: {
            fontSize: '14px',
            lineHeight: '20px',
            fontWeight: 'Regular',
        },
        //中标签
        labelMedium: {
            fontSize: '12px',
            lineHeight: '16px',
            fontWeight: 'Regular',
        },
        //小标签
        labelSmall: {
            fontSize: '11px',
            lineHeight: '16px',
            fontWeight: 'Regular',
        },

        //内容文字
        bodyLarge: {
            fontSize: '16px',
            lineHeight: '24px',
            fontWeight: 'Regular',
        },

        bodyMedium: {
            fontSize: '14px',
            lineHeight: '20px',
            fontWeight: 'Regular',
        },

        //内容文字(小号)
        bodySmall: {
            fontSize: '12px',
            lineHeight: '16px',
            fontWeight: 'Regular',
        },
    },


    //调色板
    // palette: {
    //     text: {
    //         primary: 'rgba(0, 0, 0, 0.85)', //在背景上的颜色
    //         secondary: 'rgba(0, 0, 0, 0.65)',
    //         tertiary: 'rgba(0, 0, 0, 0.45)',
    //         disabled: 'rgba(0, 0, 0, 0.25)',
    //     },
    //     background: {
    //         default: '#F9F3E5',
    //         paper: '#FFFFFF',
    //     },
    //     primary: {
    //         main: '#9F7207',
    //         // light: '#FFE5B4',
    //         // dark: '#664D03',
    //         contrastText: '#FFFFFF',
    //     },
    //     // secondary: {
    //     //     main: '#D4E4F6',
    //     // },
    //     error: {
    //         main: '#FF4D4F',
    //     },
    // }
})

// 默认主题
export const defaultTheme = createTheme(theme, {
    palette: {
        primary: {
            main: '#9F7207',
            contrastText: '#FFFFFF',
        },
        text: {
            primary: 'rgba(0, 0, 0, 0.85)',
        },
        background: {
            default: '#F9F3E5',
            paper: '#2D2D2D',
        },
    },
})

// 森林主题
export const forestTheme = createTheme(theme, {
    palette: {
        primary: {
            main: '#51B343',
            contrastText: '#FFFFFF',
        },
        text: {
            primary: 'rgba(0, 0, 0, 0.85)',
        },
        background: {
            default: '#F5FFF5',
            paper: '#DEFFDE',
        },
    },
})

// 暗黑主题
export const darkTheme = createTheme(theme, {
    palette: {
        primary: {
            main: '#E36F1C',
            contrastText: '#FFFFFF',
        },
        text: {
            primary: '#FFFFFF',
        },
        background: {
            default: '#0A0A0A',
            paper: '#2D2D2D',

        },
    },
})