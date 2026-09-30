import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { handleNodeApiRequest } from './src/server/otpRouter';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'api-server-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          try {
            const handled = await handleNodeApiRequest(req, res);
            if (!handled) {
              next();
            }
          } catch (err) {
            next(err);
          }
        });
      },
    },
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: ["localhost", ".preview.app.github.dev"],
  },
});
