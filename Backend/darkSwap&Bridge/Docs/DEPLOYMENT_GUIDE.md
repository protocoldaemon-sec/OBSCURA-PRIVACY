# Obscura Swap - Complete Deployment Guide

## Overview

This guide covers deploying the complete Obscura Swap stack:
- Backend API (Railway)
- MCP Server (Local or Remote)
- Frontend (Optional)

## Backend Deployment (Railway)

### Quick Deploy

1. **Push to GitHub** ✅ (Already done)

2. **Deploy to Railway**
   - Visit: https://railway.app
   - Sign in with GitHub
   - New Project → Deploy from GitHub
   - Select: `protocoldaemon-sec/obscura-swap`
   - Root Directory: `backend`

3. **Environment Variables**
   ```
   PORT=3000
   SILENTSWAP_ENVIRONMENT=PRODUCTION
   NEXT_PUBLIC_INTEGRATOR_ID=obscura-swap
   NODE_ENV=production
   ```

4. **Deploy & Get URL**
   - Click Deploy
   - Copy Railway URL: `https://your-app.railway.app`

**Detailed Guide**: [backend/RAILWAY_DEPLOYMENT.md](./backend/RAILWAY_DEPLOYMENT.md)

## MCP Server Deployment

### Option 1: Local MCP + Production API (Recommended)

**Best for**: Individual developers, small teams

```bash
# 1. Update MCP server .env
cd mcp/server
echo "OBSCURA_API_URL=https://your-app.railway.app" > .env

# 2. Build
pnpm build

# 3. Configure AI assistant with local path
# See: Docs/MCP_GUIDE.md
```

### Option 2: Remote MCP Server

**Best for**: Teams, shared infrastructure

See: [mcp/DEPLOYMENT.md](./mcp/DEPLOYMENT.md)

## Frontend Deployment (Optional)

### Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel

# Add environment variables
vercel env add NEXT_PUBLIC_API_URL
# Enter: https://your-app.railway.app
```

### Netlify Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd frontend
netlify deploy

# Add environment variables in Netlify dashboard
```

## Complete Deployment Checklist

### Backend (Railway)
- [ ] Code pushed to GitHub
- [ ] Railway project created
- [ ] Environment variables configured
- [ ] Deployed successfully
- [ ] Health check works: `curl https://your-app.railway.app/health`
- [ ] API endpoints tested

### MCP Server
- [ ] `.env` updated with production API URL
- [ ] MCP server built: `cd mcp/server && pnpm build`
- [ ] AI assistant configured
- [ ] MCP tools tested

### Frontend (Optional)
- [ ] Environment variables configured
- [ ] Deployed to Vercel/Netlify
- [ ] Connected to production API
- [ ] Tested in browser

## Post-Deployment Testing

### Test Backend API

```bash
# Health check
curl https://your-app.railway.app/health

# Get assets
curl https://your-app.railway.app/api/swap/assets

# Get quote
curl "https://your-app.railway.app/api/swap/quote?fromChainId=1&toChainId=43114&fromToken=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&toToken=0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E&amount=1000000&userAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

### Test MCP Server

```bash
cd mcp/client
pnpm test
```

### Test with AI Assistant

Ask your AI:
```
Check if Obscura Swap is running
```

## Environment Variables Summary

### Backend (Railway)
```env
PORT=3000
NODE_ENV=production
SILENTSWAP_ENVIRONMENT=PRODUCTION
NEXT_PUBLIC_INTEGRATOR_ID=obscura-swap
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

### MCP Server (Local)
```env
OBSCURA_API_URL=https://your-app.railway.app
NODE_ENV=production
```

### Frontend (Vercel/Netlify)
```env
NEXT_PUBLIC_API_URL=https://your-app.railway.app
NEXT_PUBLIC_INTEGRATOR_ID=obscura-swap
```

## Custom Domains

### Backend API
1. Railway Dashboard → Settings → Domains
2. Add: `api.obscuraswap.com`
3. Configure DNS records
4. Wait for SSL

### Frontend
1. Vercel/Netlify Dashboard → Domains
2. Add: `obscuraswap.com`
3. Configure DNS records
4. Wait for SSL

## Monitoring

### Railway Dashboard
- Logs: Real-time application logs
- Metrics: CPU, Memory, Network
- Deployments: History and rollback

### Health Checks
```bash
# Backend
curl https://your-app.railway.app/health

# Expected: {"status":"ok","timestamp":"...","environment":"production"}
```

### Uptime Monitoring
- UptimeRobot: https://uptimerobot.com
- Pingdom: https://www.pingdom.com
- StatusCake: https://www.statuscake.com

## Troubleshooting

### Backend Issues

**Build Fails**
- Check Railway logs
- Verify `package.json`
- Ensure Node 18+

**App Crashes**
- Check environment variables
- Review application logs
- Verify SilentSwap configuration

**API Errors**
- Check `SILENTSWAP_ENVIRONMENT=PRODUCTION`
- Verify integrator ID
- Test external API access

### MCP Issues

**Can't Connect**
- Update `.env` with production URL
- Rebuild: `pnpm build`
- Restart AI assistant

**Tools Fail**
- Test backend API directly
- Check MCP server logs
- Verify environment variables

## Scaling

### Backend (Railway)
- Vertical: Increase resources in Railway Dashboard
- Horizontal: Add replicas in Railway Dashboard

### MCP Server
- Local: No scaling needed
- Remote: Use load balancer + multiple instances

## Cost Estimation

### Railway (Backend)
- Hobby: ~$5-10/month
- Pro: ~$20-40/month
- Enterprise: Custom pricing

### Vercel (Frontend)
- Hobby: Free
- Pro: $20/month
- Enterprise: Custom pricing

### Total Estimated Cost
- Small project: ~$5-10/month
- Medium project: ~$30-50/month
- Large project: ~$100+/month

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use platform secret management
   - Rotate secrets regularly

2. **CORS Configuration**
   - Update for production domains
   - Restrict origins
   - Enable credentials if needed

3. **Rate Limiting**
   - Implement in backend
   - Use Railway's built-in protection
   - Monitor for abuse

4. **SSL/TLS**
   - Railway provides automatic SSL
   - Enforce HTTPS only
   - Use HSTS headers

## Backup & Recovery

### Code Backup
- GitHub repository (already done)
- Regular commits
- Tagged releases

### Configuration Backup
```bash
# Export Railway variables
railway variables > railway-backup.txt

# Backup MCP config
cp mcp/server/.env mcp/server/.env.backup
```

### Database Backup
- If using database, setup automatic backups
- Railway provides backup options
- Export data regularly

## CI/CD

### Automatic Deployment
Railway auto-deploys on push to main branch.

### Manual Deployment
```bash
# Using Railway CLI
railway up

# Or redeploy from dashboard
```

### Rollback
1. Railway Dashboard → Deployments
2. Select previous deployment
3. Click "Redeploy"

## Support Resources

- **Railway**: https://docs.railway.app
- **SilentSwap**: https://docs.silentswap.com
- **MCP Protocol**: https://modelcontextprotocol.io
- **Project Docs**: [Docs/DOCUMENTATION_INDEX.md](./Docs/DOCUMENTATION_INDEX.md)

## Quick Links

- **Backend Deployment**: [backend/RAILWAY_DEPLOYMENT.md](./backend/RAILWAY_DEPLOYMENT.md)
- **MCP Deployment**: [mcp/DEPLOYMENT.md](./mcp/DEPLOYMENT.md)
- **MCP Guide**: [Docs/MCP_GUIDE.md](./Docs/MCP_GUIDE.md)
- **Setup Guide**: [SETUP.md](./SETUP.md)

## Next Steps

1. ✅ Deploy backend to Railway
2. ✅ Test API endpoints
3. ✅ Update MCP configuration
4. ✅ Test MCP with AI assistant
5. ⏳ Deploy frontend (optional)
6. ⏳ Setup custom domains
7. ⏳ Configure monitoring
8. ⏳ Share with team

---

**Deployment Status**: Ready to Deploy
**Platform**: Railway (Backend), Local (MCP)
**Last Updated**: January 2025
