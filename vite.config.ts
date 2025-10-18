import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type UserConfigExport } from 'vite';
import svgr from 'vite-plugin-svgr';

export default ({ mode }: { mode: string }): UserConfigExport => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    plugins: [react(), svgr()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      open: true,
    },
    build: {
      outDir: process.env.BUILD_FOLDER || 'dist',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name].js`,
          chunkFileNames: `assets/[name].js`,
          assetFileNames: `assets/[name].[ext]`,
        },
      },
    },
  });
};
