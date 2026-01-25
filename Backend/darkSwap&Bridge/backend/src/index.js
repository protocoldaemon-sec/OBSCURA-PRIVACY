import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import swapRoutes from './routes/swap.js';
import webhookRoutes from './routes/webhooks.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'obscura-swap',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// Routes
app.use('/api/swap', swapRoutes);
app.use('/api/webhooks', webhookRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`Obscura Swap backend running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Privacy-powered by SilentSwap`);
});
