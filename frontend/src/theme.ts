import { createTheme } from "@mui/material";
// When using TypeScript 3.x and below
// import '@mui/lab/themeAugmentation';

//主题
export const theme = createTheme({

    //组件
    components: {

        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '16px',
                    padding: '24px',
                    backgroundColor: '#F9F3E5',
                    border: '1px solid rgba(0, 0, 0, 0.25)',
                    boxShadow: '0px 2px 2px rgba(0, 0, 0, 0.05)',
                }
            }
        },

        // 按钮
        MuiButton: {
            styleOverrides: {
                contained: {
                    backgroundColor: '#9F7207',
                    color: '#FFFFFF',
                    border: 'none',
                    '&:hover': {
                        backgroundColor: '#333333',
                    }
                }
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
    palette: {
        text: {
            primary: 'rgba(0, 0, 0, 0.85)', //在背景上的颜色
            secondary: 'rgba(0, 0, 0, 0.65)',
            tertiary: 'rgba(0, 0, 0, 0.45)',
            disabled: 'rgba(0, 0, 0, 0.25)',
        },
        background: {
            default: '#F9F3E5',
            paper: '#FFFFFF',
        },
        primary: {
            main: '#9F7207',
            // light: '#FFE5B4',
            // dark: '#664D03',
            contrastText: '#FFFFFF',
        },
        // secondary: {
        //     main: '#D4E4F6',
        // },
        error: {
            main: '#FF4D4F',
        },
    }
})