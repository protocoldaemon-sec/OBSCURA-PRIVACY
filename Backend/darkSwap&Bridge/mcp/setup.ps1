Write-Host "🚀 Setting up Obscura Swap MCP Server & Client" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan

# Setup Server
Write-Host ""
Write-Host "📦 Setting up MCP Server..." -ForegroundColor Yellow
Set-Location server
pnpm install
Copy-Item .env.example .env -ErrorAction SilentlyContinue
pnpm build
Write-Host "✅ Server setup complete" -ForegroundColor Green

# Setup Client
Write-Host ""
Write-Host "📦 Setting up MCP Client..." -ForegroundColor Yellow
Set-Location ../client
pnpm install
Copy-Item .env.example .env -ErrorAction SilentlyContinue
pnpm build
Write-Host "✅ Client setup complete" -ForegroundColor Green

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ MCP Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start backend: cd ../../backend; pnpm dev"
Write-Host "2. Test MCP: cd mcp/client; pnpm test"
Write-Host ""
Write-Host "For integration with AI assistants, see mcp/README.md"
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan

Set-Location ..
