import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { otpRouter } from './src/server/otpRouter';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();

  // Extract port and host from CLI args if provided
  let port = Number(process.env.PORT) || 3000;
  const portIndex = process.argv.indexOf('--port');
  if (portIndex !== -1 && process.argv[portIndex + 1]) {
    port = Number(process.argv[portIndex + 1]) || port;
  }

  let host = '0.0.0.0';
  const hostIndex = process.argv.indexOf('--host');
  if (hostIndex !== -1 && process.argv[hostIndex + 1]) {
    host = process.argv[hostIndex + 1];
  }

  app.use(express.json());

  // Mount server-side API routes
  app.use('/api', otpRouter);

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // In dev, mount Vite middleware
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, host, () => {
    console.log(`BahiKhata Server running at http://${host}:${port}`);
  });
}

startServer();
