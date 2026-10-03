import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'api-server-middleware',
      async configureServer(server) {
        const { default: express } = await import('express');
        const jsonBodyParser = express.json({
          limit: '10mb',
          type: ['application/json', 'text/plain', 'application/*+json'],
          verify: (req: any, _res: any, buf: Buffer) => {
            req.rawBody = buf.toString('utf-8');
          },
        });
        const urlEncodedParser = express.urlencoded({
          extended: true,
          limit: '10mb',
          verify: (req: any, _res: any, buf: Buffer) => {
            if (!req.rawBody) {
              req.rawBody = buf.toString('utf-8');
            }
          },
        });
        const { handleNodeApiRequest } = await import('./src/server/otpRouter.ts');

        // 1. Dedicated request parsing (body-parser) middleware for API requests
        server.middlewares.use((req, res, next) => {
          if (req.url && (req.url.startsWith('/api/') || req.url === '/api')) {
            return jsonBodyParser(req, res, (err) => {
              if (err) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, error: 'Invalid JSON request payload' }));
              }
              urlEncodedParser(req, res, (urlErr) => {
                if (urlErr) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ success: false, error: 'Invalid URL-encoded payload' }));
                }
                if (!(req as any).body) {
                  (req as any).body = {};
                }
                next();
              });
            });
          }
          next();
        });

        // 2. Route handler middleware for otpRouter endpoints
        server.middlewares.use(async (req, res, next) => {
          if (!req.url || (!req.url.startsWith('/api/') && req.url !== '/api')) {
            return next();
          }
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
