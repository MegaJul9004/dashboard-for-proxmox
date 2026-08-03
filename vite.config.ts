import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxmoxUrl = env.VITE_PROXMOX_URL;
  const proxmoxToken = env.VITE_PROXMOX_TOKEN;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      proxy: proxmoxUrl
        ? {
            '/api2': {
              target: proxmoxUrl,
              changeOrigin: true,
              secure: false, // accept self-signed SSL certificates from Proxmox
              configure: (proxy) => {
                proxy.on('proxyReq', (proxyReq) => {
                  if (proxmoxToken) {
                    proxyReq.setHeader('Authorization', `PVEToken=${proxmoxToken}`);
                  }
                });
              },
            },
          }
        : undefined,
    },
  };
});
