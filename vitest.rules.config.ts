import { defineConfig } from 'vitest/config';

// セキュリティルールのテスト用（Firebase エミュレーターが必要）
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts'],
    testTimeout: 20000,
    fileParallelism: false,
  },
});
