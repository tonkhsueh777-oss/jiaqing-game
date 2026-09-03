import { defineConfig, searchForWorkspaceRoot } from 'vite';

export default defineConfig({
  base: './',
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    fs: { allow: [searchForWorkspaceRoot(process.cwd()), '..'] }
  },
  build: { target: 'es2020' }
});
