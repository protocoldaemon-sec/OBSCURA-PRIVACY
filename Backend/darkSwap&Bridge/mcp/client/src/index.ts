import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import { config } from 'dotenv';

// Load environment variables
config();

export class ObscuraSwapMCPClient {
  private client: Client;
  private transport: StdioClientTransport | null = null;

  constructor() {
    this.client = new Client(
      {
        name: 'obscuraswap-mcp-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );
  }

  async connect(serverPath: string) {
    // Spawn the MCP server process
    const serverProcess = spawn('node', [serverPath], {
      env: {
        ...process.env,
        OBSCURA_API_URL: process.env.OBSCURA_API_URL || 'http://localhost:3000',
      },
    });

    this.transport = new StdioClientTransport({
      command: 'node',
      args: [serverPath],
      env: {
        OBSCURA_API_URL: process.env.OBSCURA_API_URL || 'http://localhost:3000',
      },
    });

    await this.client.connect(this.transport);
    console.log('Connected to Obscura Swap MCP Server');
  }

  async listTools(): Promise<any[]> {
    const response = await this.client.listTools();
    return response.tools;
  }

  async getHealth(): Promise<any> {
    const response = await this.client.callTool({
      name: 'get_health',
      arguments: {},
    });
    const content: any = response.content;
    return JSON.parse(content[0].text);
  }

  async getSupportedAssets(): Promise<any> {
    const response = await this.client.callTool({
      name: 'get_supported_assets',
      arguments: {},
    });
    const content: any = response.content;
    return JSON.parse(content[0].text);
  }

  async getSwapQuote(params: {
    fromChainId: number;
    toChainId: number;
    fromToken: string;
    toToken: string;
    amount: string;
    userAddress: string;
  }): Promise<any> {
    const response = await this.client.callTool({
      name: 'get_swap_quote',
      arguments: params,
    });
    const content: any = response.content;
    return JSON.parse(content[0].text);
  }

  async getChainInfo(chainId: number): Promise<any> {
    const response = await this.client.callTool({
      name: 'get_chain_info',
      arguments: { chainId },
    });
    const content: any = response.content;
    return JSON.parse(content[0].text);
  }

  async disconnect() {
    if (this.transport) {
      await this.client.close();
      console.log('Disconnected from MCP Server');
    }
  }
}

// Example usage
async function main() {
  const client = new ObscuraSwapMCPClient();

  try {
    // Connect to server
    await client.connect('../server/dist/index.js');

    // List available tools
    console.log('\n=== Available Tools ===');
    const tools = await client.listTools();
    tools.forEach((tool) => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });

    // Get health status
    console.log('\n=== Health Check ===');
    const health = await client.getHealth();
    console.log(health);

    // Get supported assets
    console.log('\n=== Supported Assets ===');
    const assets = await client.getSupportedAssets();
    console.log(`Total chains: ${assets.chains.length}`);
    assets.chains.forEach((chain: any) => {
      console.log(`- ${chain.chainName} (${chain.chainId}): ${chain.tokens.length} tokens`);
    });

    // Get chain info
    console.log('\n=== Ethereum Chain Info ===');
    const ethInfo = await client.getChainInfo(1);
    console.log(ethInfo);

    // Get swap quote
    console.log('\n=== Swap Quote (ETH → AVAX USDC) ===');
    const quote = await client.getSwapQuote({
      fromChainId: 1,
      toChainId: 43114,
      fromToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      toToken: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
      amount: '1000000',
      userAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    });
    console.log(quote);

    // Disconnect
    await client.disconnect();
  } catch (error) {
    console.error('Error:', error);
    await client.disconnect();
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
