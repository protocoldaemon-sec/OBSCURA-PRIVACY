import express from 'express';

const router = express.Router();

/**
 * POST /api/webhooks/swap-status
 * Receive swap status updates from SilentSwap
 */
router.post('/swap-status', express.json(), async (req, res) => {
  try {
    const { swapId, status, txHash, error } = req.body;

    console.log('Swap status update:', {
      swapId,
      status,
      txHash,
      error,
      timestamp: new Date().toISOString(),
    });

    // Here you would typically:
    // - Update database with swap status
    // - Notify user via websocket/push notification
    // - Trigger any post-swap actions

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
