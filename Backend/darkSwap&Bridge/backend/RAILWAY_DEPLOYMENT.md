# Railway Deployment Guide - Obscura Swap Backend

## Quick Deploy to Railway

### Option 1: Deploy from GitHub (Recommended)

1. **Push to GitHub** (already done)

2. **Go to Railway**
   - Visit: https://railway.app
   - Sign in with GitHub

3. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose: `protocoldaemon-sec/obscura-swap`

4. **Configure Service**
   - Root Directory: `backend`
   - Build Command: `pnpm install`
   - Start Command: `pnpm start`

5. **Add Environment Variables**
   ```
   PORT=3000
   SILENTSWAP_ENVIRONMENT=PRODUCTION
   NEXT_PUBLIC_INTEGRATOR_ID=obscura-swap
   NODE_ENV=production
   ```

6. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Get your Railway URL: `https://your-app.railway.app`

### Option 2: Deploy with Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to project
railway link

# Add environment variables
railway variables set PORT=3000
railway variables set SILENTSWAP_ENVIRONMENT=PRODUCTION
railway variables set NEXT_PUBLIC_INTEGRATOR_ID=obscura-swap
railway variables set NODE_ENV=production

# Deploy
railway up
```

## Environment Variables

Required variables for Railway:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# SilentSwap Configuration
SILENTSWAP_ENVIRONMENT=PRODUCTION
NEXT_PUBLIC_INTEGRATOR_ID=obscura-swap

# Optional: Solana RPC (if needed)
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Optional: Webhook URL (update after deployment)
WEBHOOK_URL=https://your-app.railway.app/api/webhooks/swap-status
```

## Railway Configuration Files

### railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install"
  },
  "deploy": {
    "startCommand": "pnpm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Procfile
```
web: pnpm start
```

## Post-Deployment

### 1. Test Your Deployment

```bash
# Health check
curl https://your-app.railway.app/health

# Get supported assets
curl https://your-app.railway.app/api/swap/assets

# Get quote
curl "https://your-app.railway.app/api/swap/quote?fromChainId=1&toChainId=43114&fromToken=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&toToken=0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E&amount=1000000&userAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

### 2. Update MCP Configuration

Update your MCP server `.env`:

```env
# mcp/server/.env
OBSCURA_API_URL=https://your-app.railway.app
```

### 3. Update Frontend Configuration

If using frontend:

```env
# frontend/.env
NEXT_PUBLIC_API_URL=https://your-app.railway.app
```

## Monitoring

### Railway Dashboard

- View logs: Railway Dashboard → Logs
- Monitor metrics: Railway Dashboard → Metrics
- Check deployments: Railway Dashboard → Deployments

### Health Check Endpoint

```bash
# Check if API is running
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-22T10:00:00.000Z",
  "environment": "production"
}
```

## Troubleshooting

### Build Fails

**Check logs in Railway Dashboard**

Common issues:
- Missing dependencies: Ensure `package.json` is correct
- Node version: Railway uses Node 18+ by default
- Build command: Should be `pnpm install`

### App Crashes on Start

**Check environment variables**

Required:
- `PORT` (Railway provides this automatically)
- `SILENTSWAP_ENVIRONMENT`
- `NEXT_PUBLIC_INTEGRATOR_ID`

### API Returns Errors

**Check SilentSwap configuration**

- Ensure `SILENTSWAP_ENVIRONMENT=PRODUCTION`
- Check integrator ID is correct
- Verify external API access

## Scaling

### Vertical Scaling

Railway Dashboard → Settings → Resources:
- Increase memory
- Increase CPU

### Horizontal Scaling

Railway supports multiple instances:
- Railway Dashboard → Settings → Replicas
- Set number of instances

## Custom Domain

1. Go to Railway Dashboard → Settings → Domains
2. Click "Add Domain"
3. Enter your domain: `api.obscuraswap.com`
4. Add DNS records as shown
5. Wait for SSL certificate

## CI/CD

Railway automatically deploys on push to main branch.

To disable auto-deploy:
1. Railway Dashboard → Settings
2. Uncheck "Auto Deploy"

## Cost Estimation

Railway Pricing (as of 2025):
- **Hobby Plan**: $5/month + usage
- **Pro Plan**: $20/month + usage

Estimated costs:
- Small traffic: ~$5-10/month
- Medium traffic: ~$20-40/month
- High traffic: ~$50+/month

## Backup & Rollback

### Rollback to Previous Deployment

1. Railway Dashboard → Deployments
2. Find previous successful deployment
3. Click "Redeploy"

### Backup Environment Variables

```bash
# Export variables
railway variables > railway-vars-backup.txt
```

## Security

### Environment Variables

- Never commit `.env` files
- Use Railway's environment variables
- Rotate secrets regularly

### CORS Configuration

Backend already configured with CORS:
```javascript
app.use(cors({
  origin: '*', // Update for production
  methods: ['GET', 'POST'],
}));
```

For production, update to specific domains:
```javascript
app.use(cors({
  origin: ['https://obscuraswap.com', 'https://www.obscuraswap.com'],
  methods: ['GET', 'POST'],
}));
```

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Backend README: [README.md](./README.md)

## Checklist

- [ ] Push code to GitHub
- [ ] Create Railway project
- [ ] Configure root directory: `backend`
- [ ] Add environment variables
- [ ] Deploy
- [ ] Test health endpoint
- [ ] Test API endpoints
- [ ] Update MCP configuration
- [ ] Setup custom domain (optional)
- [ ] Configure monitoring

## Next Steps

1. Deploy to Railway
2. Test all endpoints
3. Update MCP server URL
4. Configure custom domain
5. Setup monitoring
6. Share API URL with team

---

**Deployment Status**: Ready to Deploy
**Platform**: Railway
**Region**: Auto (closest to users)
