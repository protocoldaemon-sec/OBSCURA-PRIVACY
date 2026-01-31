import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  },
  
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    network: process.env.SOLANA_NETWORK || 'devnet',
  },
  
  sepolia: {
    rpcUrl: process.env.SEPOLIA_RPC_URL || '',
    chainId: parseInt(process.env.SEPOLIA_CHAIN_ID || '11155111', 10),
  },
  
  obscuraLLMS: {
    baseUrl: process.env.OBSCURA_LLMS_BASE_URL || 'https://obscura-api.daemonprotocol.com',
  },
  
  arcium: {
    clusterOffset: process.env.ARCIUM_CLUSTER_OFFSET || '',
    programId: process.env.ARCIUM_PROGRAM_ID || '',
  },
  
  lightProtocol: {
    enabled: process.env.LIGHT_PROTOCOL_ENABLED === 'true',
    rpcUrl: process.env.LIGHT_PROTOCOL_RPC_URL || '',
  },
  
  admin: {
    publicKey: process.env.ADMIN_PUBLIC_KEY || '',
    apiKey: process.env.ADMIN_API_KEY || '',
  },
  
  whitelist: {
    mode: process.env.WHITELIST_MODE || 'permissionless', // 'permissionless' or 'permissioned'
  },
  
  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};

// Validate required configuration
export function validateConfig(): void {
  const required = [
    { key: 'SUPABASE_URL', value: config.supabase.url },
    { key: 'SUPABASE_ANON_KEY', value: config.supabase.anonKey },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', value: config.supabase.serviceRoleKey },
    { key: 'OBSCURA_LLMS_BASE_URL', value: config.obscuraLLMS.baseUrl },
  ];
  
  const missing = required.filter(({ value }) => !value);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.map(({ key }) => key).join(', ')}`
    );
  }
}
