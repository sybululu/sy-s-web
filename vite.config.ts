import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    publicDir: 'public',
    build: {
      rollupOptions: {
        output: {
          manualChunks: undefined
        }
      }
    },
    define: {},
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 5000,
      host: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      // 开发代理：将 /api/* 请求转发到后端（需设置 VITE_API_URL 或启动后端）
      proxy: env.VITE_API_URL
        ? undefined  // 已设置外部 API 地址，不启用代理
        : {
            '/api': {
              target: 'http://localhost:7860',
              changeOrigin: true,
            },
          },
    },
  };
});
