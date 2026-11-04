import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const isTsx = process.execArgv.some(a => a.includes('tsx')) || process.env.TSX_ACTIVE === 'true';
  if (!isTsx) {
    const { spawn } = await import('node:child_process');
    const child = spawn('npx', ['tsx', __filename, ...process.argv.slice(2)], {
      stdio: 'inherit',
      env: { ...process.env, TSX_ACTIVE: 'true' },
    });
    child.on('exit', (code) => process.exit(code ?? 0));
    return;
  }

  const { apiRouter } = await import('./src/server/apiRouter');
  const app = express();

  // Parse port from environment variable or CLI arguments (--port 3000 or -p 3000)
  let port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const portArgIndex = process.argv.findIndex(arg => arg === '--port' || arg === '-p');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(parsed)) port = parsed;
  }

  app.use(express.json({ limit: '10mb' }));
  app.use('/api', apiRouter);

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, host: '0.0.0.0', port, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`EcoTrack server running on http://0.0.0.0:${port}`);
  });
}

startServer();
