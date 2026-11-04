import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './src/server/apiRouter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/api', apiRouter);

// Serve built assets in production
app.use(express.static(path.resolve(__dirname, 'dist')));

app.get('*', (_req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`EcoTrack server running on http://0.0.0.0:${PORT}`);
});
