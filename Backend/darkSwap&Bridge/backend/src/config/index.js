import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  silentswap: {
    environment: process.env.SILENTSWAP_ENVIRONMENT || 'STAGING',
    integratorId: process.env.NEXT_PUBLIC_INTEGRATOR_ID,
  },
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  },
  webhookUrl: process.env.WEBHOOK_URL,
};
