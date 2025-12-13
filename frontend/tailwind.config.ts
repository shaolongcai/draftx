import type { Config } from 'tailwindcss'

/**
 * Tailwind CSS V4 配置文件
 * 
 * 注意：Tailwind CSS V4 主要使用 CSS 變量進行配置
 * 此配置文件用於自定義主題和擴展功能
 */
const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  // 启用 important 模式，确保 Tailwind 样式优先级最高
  important: true,
  plugins: []
}

export default config

