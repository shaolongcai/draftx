import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: './', // 重要：Electron需要相对路径
  publicDir: 'public', // 確保 public 目錄會被複製到 dist
  // 步骤1：指定前端开发服务器端口为 5174，避免与其他项目冲突
  server: {
    port: 5174,
    strictPort: true, // 端口被占用时直接报错，而不是自动切换
  },
  optimizeDeps: {
    include: [
      '@emotion/react',
      '@emotion/styled',
      '@mui/material/Tooltip',
    ],
  },
  plugins: [
    tailwindcss(),
    react()
  ],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        setting: path.resolve(__dirname, 'setting.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})
