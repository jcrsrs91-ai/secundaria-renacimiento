import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

const mockPath = path.resolve('scratch/verify/mock-useGlobalConfig.js').replace(/\\/g, '/');

export default defineConfig({
  root: path.resolve('.'),
  plugins: [
    {
      name: 'mock-global-config',
      enforce: 'pre',
      resolveId(id) {
        if (/hooks\/useGlobalConfig(\.js)?$/.test(id)) return mockPath;
        return null;
      },
    },
    tailwindcss(),
    react(),
  ],
  server: { port: 5199, strictPort: true },
});
