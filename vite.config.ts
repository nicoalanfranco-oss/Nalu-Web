import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

const BUILD_TIMESTAMP = Date.now();

// Plugin para inyectar automáticamente un timestamp único en el Service Worker y version.json en cada build
function versionManagerPlugin(): Plugin {
  return {
    name: 'version-manager-plugin',
    closeBundle() {
      const versionData = {
        version: '1.2.0',
        buildTime: BUILD_TIMESTAMP,
        timestamp: new Date(BUILD_TIMESTAMP).toISOString(),
      };

      // 1. Escribir dist/version.json
      const versionDistPath = path.resolve(__dirname, 'dist/version.json');
      fs.writeFileSync(versionDistPath, JSON.stringify(versionData, null, 2), 'utf8');

      // 2. Inyectar timestamp en dist/sw.js
      const swDistPath = path.resolve(__dirname, 'dist/sw.js');
      if (fs.existsSync(swDistPath)) {
        let content = fs.readFileSync(swDistPath, 'utf8');
        content = content.replace(/__BUILD_TIMESTAMP__/g, String(BUILD_TIMESTAMP));
        fs.writeFileSync(swDistPath, content, 'utf8');
      }
      console.log(`[Version Plugin] Injected build timestamp ${BUILD_TIMESTAMP} into dist/version.json and dist/sw.js`);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  define: {
    __APP_BUILD_TIME__: JSON.stringify(String(BUILD_TIMESTAMP)),
  },
  plugins: [react(), versionManagerPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5176,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
});
