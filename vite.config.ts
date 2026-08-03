import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  // Relative base so one build works at both /design-patterns/ (production)
  // and /design-patterns/dev/ (preview). Requires every page to sit at the
  // same depth — keep pattern pages flat at the project root.
  base: './',
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        command: resolve(__dirname, 'command.html'),
      },
    },
  },
});
