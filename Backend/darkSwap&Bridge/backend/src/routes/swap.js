import express from 'express';
import { getQuote, getSupportedAssets } from '../services/silentswap.js';

const router = express.Router();

/**
 * GET /api/swap/quote
 * Get a quote for a cross-chain swap
 */
router.get('/quote', async (req, res) => {
  try {
    const { fromChainId, toChainId, fromToken, toToken, amount, userAddress } = req.query;

    if (!fromChainId || !toChainId || !fromToken || !toToken || !amount || !userAddress) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['fromChainId', 'toChainId', 'fromToken', 'toToken', 'amount', 'userAddress'],
      });
    }

    const result = await getQuote({
      fromChainId: parseInt(fromChainId),
      toChainId: parseInt(toChainId),
      fromToken,
      toToken,
      amount,
      userAddress,
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    console.error('Quote error:', error);
    res.status(500).json({ error: 'Failed to get quote' });
  }
});

/**
 * GET /api/swap/assets
 * Get supported chains and tokens
 */
router.get('/assets', async (req, res) => {
  try {
    const assets = await getSupportedAssets();
    res.json(assets);
  } catch (error) {
    console.error('Assets error:', error);
    res.status(500).json({ error: 'Failed to get supported assets' });
  }
});

export default router;
