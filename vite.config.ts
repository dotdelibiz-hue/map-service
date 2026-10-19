import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages などサブパスで公開するときは BASE_PATH=/リポジトリ名/ を指定
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  build: {
    // 地図ライブラリ（Leaflet）と React を含むため。Firebase SDK は本番モードのときだけ別ファイルで読み込みます
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
