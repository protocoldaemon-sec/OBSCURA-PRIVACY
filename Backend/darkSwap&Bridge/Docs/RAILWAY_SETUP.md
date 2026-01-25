# 🚀 Railway Deployment - Quick Setup Guide

## ✅ Code Pushed to GitHub

Repository: https://github.com/protocoldaemon-sec/obscura-swap

## 🚂 Deploy to Railway (5 Minutes)

### Step 1: Sign Up / Login

1. Go to: https://railway.app
2. Click "Login with GitHub"
3. Authorize Railway

### Step 2: Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose: `protocoldaemon-sec/obscura-swap`
4. Railway will detect the project

### Step 3: Configure Service

**Important Settings:**

- **Root Directory**: `backend`
- **Build Command**: `pnpm install` (auto-detected)
- **Start Command**: `pnpm start` (auto-detected)

Railway will use the `railway.json` configuration automatically.

### Step 4: Add Environment Variables

Click "Variables" and add:

```
PORT=3000
NODE_ENV=production
SILENTSWAP_ENVIRONMENT=PRODUCTION
NEXT_PUBLIC_INTEGRATOR_ID=obscura-swap
```

Optional (recommended):
```
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

### Step 5: Deploy

1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Check logs for "🚀 Obscura Swap backend running on port 3000"

### Step 6: Get Your URL

1. Go to "Settings" → "Domains"
2. Railway provides: `https://your-app.railway.app`
3. Copy this URL

## 🧪 Test Your Deployment

### Test 1: Health Check

```bash
curl https://your-app.railway.app/health
```

Expected:
```json
{
  "status": "ok",
  "timestamp": "2025-01-22T...",
  "environment": "production"
}
```

### Test 2: Get Assets

```bash
curl https://your-app.railway.app/api/swap/assets
```

Should return list of supported chains and tokens.

### Test 3: Get Quote

```bash
curl "https://your-app.railway.app/api/swap/quote?fromChainId=1&toChainId=43114&fromToken=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&toToken=0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E&amount=1000000&userAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

Should return swap quote.

## 🤖 Update MCP Configuration

### Update MCP Server

```bash
# Edit mcp/server/.env
cd mcp/server
echo "OBSCURA_API_URL=https://your-app.railway.app" > .env

# Rebuild
pnpm build
```

### Update AI Assistant Config

**Claude Desktop** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "obscuraswap": {
      "command": "node",
      "args": ["C:\\Users\\raden\\Documents\\ObscuraSwap\\mcp\\server\\dist\\index.js"],
      "env": {
        "OBSCURA_API_URL": "https://your-app.railway.app"
      }
    }
  }
}
```

**Kiro IDE** (`.kiro/settings/mcp.json`):
```json
{
  "mcpServers": {
    "obscuraswap": {
      "command": "node",
      "args": ["./mcp/server/dist/index.js"],
      "env": {
        "OBSCURA_API_URL": "https://your-app.railway.app"
      },
      "disabled": false,
      "autoApprove": ["get_health", "get_supported_assets"]
    }
  }
}
```

### Test MCP

```bash
cd mcp/client
pnpm test
```

All tests should pass!

## 📊 Railway Dashboard

### View Logs
- Railway Dashboard → Your Project → Logs
- Real-time application logs
- Filter by level (info, error, etc.)

### Monitor Metrics
- Railway Dashboard → Your Project → Metrics
- CPU usage
- Memory usage
- Network traffic

### Manage Deployments
- Railway Dashboard → Your Project → Deployments
- View deployment history
- Rollback to previous version
- Redeploy

## 🔧 Troubleshooting

### Build Fails

**Check:**
1. Railway logs for error details
2. Ensure `backend/package.json` exists
3. Verify Node.js version (18+)

**Fix:**
- Redeploy from Railway Dashboard
- Check environment variables

### App Crashes

**Check:**
1. Environment variables are set
2. `SILENTSWAP_ENVIRONMENT=PRODUCTION`
3. Application logs for errors

**Fix:**
- Add missing environment variables
- Check SilentSwap configuration
- Restart service

### API Returns Errors

**Check:**
1. Health endpoint: `/health`
2. Environment variables
3. External API access

**Fix:**
- Verify integrator ID
- Check SilentSwap environment
- Review application logs

## 💰 Cost Estimation

Railway Pricing:
- **Hobby Plan**: $5/month + usage
- **Pro Plan**: $20/month + usage

Estimated monthly cost:
- **Small traffic**: ~$5-10
- **Medium traffic**: ~$20-40
- **High traffic**: ~$50+

## 🎯 Next Steps

### Immediate
- [x] Push code to GitHub ✅
- [x] Deploy to Railway ✅
- [ ] Test all endpoints
- [ ] Update MCP configuration
- [ ] Test with AI assistant

### Optional
- [ ] Setup custom domain
- [ ] Configure monitoring
- [ ] Setup CI/CD
- [ ] Add database (if needed)

## 📚 Additional Resources

- **Railway Docs**: https://docs.railway.app
- **Backend Guide**: [backend/RAILWAY_DEPLOYMENT.md](./backend/RAILWAY_DEPLOYMENT.md)
- **MCP Guide**: [Docs/MCP_GUIDE.md](./Docs/MCP_GUIDE.md)
- **Complete Deployment**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 🆘 Need Help?

1. Check Railway logs
2. Review [backend/RAILWAY_DEPLOYMENT.md](./backend/RAILWAY_DEPLOYMENT.md)
3. Test locally first: `cd backend && pnpm dev`
4. Check [Docs/DOCUMENTATION_INDEX.md](./Docs/DOCUMENTATION_INDEX.md)

## ✅ Deployment Checklist

- [x] Code pushed to GitHub
- [ ] Railway project created
- [ ] Environment variables added
- [ ] Deployed successfully
- [ ] Health check works
- [ ] API endpoints tested
- [ ] MCP configuration updated
- [ ] AI assistant tested

## 🎉 Success!

Once deployed, your Obscura Swap backend will be live at:
```
https://your-app.railway.app
```

You can now:
- ✅ Access API from anywhere
- ✅ Use with MCP server
- ✅ Integrate with frontend
- ✅ Share with team

---

**Repository**: https://github.com/protocoldaemon-sec/obscura-swap
**Platform**: Railway
**Status**: Ready to Deploy 🚀
