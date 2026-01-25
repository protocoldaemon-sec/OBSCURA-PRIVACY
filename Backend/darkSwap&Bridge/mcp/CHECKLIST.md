# MCP Setup Checklist

Use this checklist to ensure your MCP server is properly set up and working.

## ✅ Installation

- [ ] Node.js 18+ installed (`node --version`)
- [ ] pnpm installed (`pnpm --version`)
- [ ] Backend dependencies installed (`cd backend && pnpm install`)
- [ ] MCP server dependencies installed (`cd mcp/server && pnpm install`)
- [ ] MCP client dependencies installed (`cd mcp/client && pnpm install`)

## ✅ Configuration

- [ ] Backend `.env` file created (`backend/.env`)
- [ ] Backend `.env` has `PORT=3000`
- [ ] Backend `.env` has `SILENTSWAP_ENVIRONMENT=STAGING`
- [ ] MCP server `.env` file created (`mcp/server/.env`)
- [ ] MCP server `.env` has `OBSCURA_API_URL=http://localhost:3000`
- [ ] MCP client `.env` file created (`mcp/client/.env`)

## ✅ Build

- [ ] MCP server built successfully (`cd mcp/server && pnpm build`)
- [ ] MCP client built successfully (`cd mcp/client && pnpm build`)
- [ ] `mcp/server/dist/index.js` file exists
- [ ] `mcp/client/dist/index.js` file exists
- [ ] `mcp/client/dist/test.js` file exists

## ✅ Backend API

- [ ] Backend server starts without errors (`cd backend && pnpm dev`)
- [ ] Health endpoint works (`curl http://localhost:3000/health`)
- [ ] Assets endpoint works (`curl http://localhost:3000/api/swap/assets`)
- [ ] Server shows "🚀 Obscura Swap backend running on port 3000"

## ✅ MCP Testing

- [ ] MCP client test runs (`cd mcp/client && pnpm test`)
- [ ] Test 1: List Tools - ✅ Passed
- [ ] Test 2: Health Check - ✅ Passed
- [ ] Test 3: Get Supported Assets - ✅ Passed
- [ ] Test 4: Get Chain Info - ✅ Passed
- [ ] Test 5: Get Swap Quote - ⚠️ May fail (external API dependency)

## ✅ AI Assistant Integration

### Claude Desktop

- [ ] Config file location identified
  - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- [ ] Config file created/updated
- [ ] Absolute path to `mcp/server/dist/index.js` added
- [ ] `OBSCURA_API_URL` environment variable set
- [ ] Claude Desktop restarted
- [ ] MCP server appears in Claude's tools
- [ ] Test query works: "Check if Obscura Swap is running"

### Kiro IDE

- [ ] `.kiro/settings/mcp.json` file created
- [ ] MCP server configuration added
- [ ] Relative path `./mcp/server/dist/index.js` used
- [ ] `autoApprove` tools configured
- [ ] Kiro restarted or MCP server reconnected
- [ ] MCP server appears in Kiro's MCP view
- [ ] Test query works

## ✅ Functionality Tests

### Health Check
- [ ] AI can check API health
- [ ] Returns status "ok"
- [ ] Returns timestamp
- [ ] Returns environment

### Supported Assets
- [ ] AI can list supported chains
- [ ] Returns 5 chains (Ethereum, Polygon, Arbitrum, Avalanche, Solana)
- [ ] Each chain shows tokens
- [ ] Token addresses are correct

### Chain Info
- [ ] AI can get Ethereum info (chainId: 1)
- [ ] AI can get Polygon info (chainId: 137)
- [ ] AI can get Arbitrum info (chainId: 42161)
- [ ] AI can get Avalanche info (chainId: 43114)

### Swap Quote
- [ ] AI can request a quote
- [ ] Quote request includes all required parameters
- [ ] Returns provider name
- [ ] Returns output amount
- [ ] Returns fee in USD
- [ ] Returns retention rate
- [ ] Note: May fail if external providers unavailable (this is OK)

## ✅ Production Readiness

- [ ] MCP server builds without errors
- [ ] All tests pass (except quote if providers unavailable)
- [ ] Production API URL configured (if deploying)
- [ ] Security review completed
- [ ] Documentation reviewed
- [ ] Backup of configuration files created

## 🎯 Success Criteria

Your MCP setup is successful if:

1. ✅ Backend API is running and responding
2. ✅ MCP server builds without errors
3. ✅ MCP client tests pass (4/5 or 5/5)
4. ✅ AI assistant can connect to MCP server
5. ✅ AI assistant can execute at least 3 tools successfully

## 🐛 Common Issues

### Issue: "Module not found"
**Solution**: Run `pnpm install` in the relevant directory

### Issue: "Cannot find dist/index.js"
**Solution**: Run `pnpm build` in mcp/server or mcp/client

### Issue: "fetch failed" in tests
**Solution**: Ensure backend is running (`cd backend && pnpm dev`)

### Issue: AI can't connect
**Solution**: Use absolute path in AI assistant config

### Issue: Quote requests fail
**Solution**: This is normal if external bridge providers are unavailable

## 📝 Notes

- Keep backend running while using MCP
- Use 2 terminals: one for backend, one for testing
- Check logs for detailed error messages
- Restart AI assistant after config changes

## 🎉 Next Steps

Once all checks pass:

1. Try example queries with your AI assistant
2. Explore different tool combinations
3. Integrate into your workflow
4. Consider production deployment

## 📞 Support

If you encounter issues:

1. Review [MCP_GUIDE.md](../Docs/MCP_GUIDE.md)
2. Check [QUICKSTART.md](./QUICKSTART.md)
3. Review [Backend README](../backend/README.md)
4. Check server logs for errors

---

**Last Updated**: January 2025
