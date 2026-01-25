#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosError } from 'axios';
import { config } from 'dotenv';

// Load environment variables
config();

const API_BASE_URL = process.env.OBSCURA_API_URL || 'http://localhost:3000';

interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
  environment: string;
}

interface Chain {
  id: number | string;
  name: string;
  symbol: string;
  caipChainId: string;
  rpcUrl: string;
}

interface Token {
  caip19: string;
  symbol: string;
  name: string;
  decimals: number;
  address: string;
}

interface AssetsResponse {
  chains: Chain[];
  tokens: Record<string, Token[]>;
}

interface QuoteResponse {
  provider: string;
  outputAmount: string;
  inputAmount: string;
  feeUsd: number;
  slippage: number;
  estimatedTime: number;
  retentionRate: number;
  txCount: number;
}

// Define MCP tools
const tools: Tool[] = [
  {
    name: 'get_health',
    description: 'Check the health status of the Obscura Swap API',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_supported_assets',
    description: 'Get list of all supported chains and tokens for swapping',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_swap_quote',
    description: 'Get a quote for cross-chain token swap with best rate from multiple providers',
    inputSchema: {
      type: 'object',
      properties: {
        fromChainId: {
          type: 'number',
          description: 'Source chain ID (e.g., 1 for Ethereum, 137 for Polygon, 43114 for Avalanche)',
        },
        toChainId: {
          type: 'number',
          description: 'Destination chain ID',
        },
        fromToken: {
          type: 'string',
          description: 'Source token address (use 0x0 for native token)',
        },
        toToken: {
          type: 'string',
          description: 'Destination token address',
        },
        amount: {
          type: 'string',
          description: 'Amount in token units (e.g., 1000000 for 1 USDC with 6 decimals)',
        },
        userAddress: {
          type: 'string',
          description: 'User wallet address (0x...)',
        },
      },
      required: ['fromChainId', 'toChainId', 'fromToken', 'toToken', 'amount', 'userAddress'],
    },
  },
  {
    name: 'get_chain_info',
    description: 'Get detailed information about a specific blockchain',
    inputSchema: {
      type: 'object',
      properties: {
        chainId: {
          type: 'number',
          description: 'Chain ID (e.g., 1 for Ethereum, 137 for Polygon)',
        },
      },
      required: ['chainId'],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'obscuraswap-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool list requests
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool execution requests
server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_health': {
        const response = await axios.get<HealthResponse>(`${API_BASE_URL}/health`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'get_supported_assets': {
        const response = await axios.get<AssetsResponse>(`${API_BASE_URL}/api/swap/assets`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'get_swap_quote': {
        const { fromChainId, toChainId, fromToken, toToken, amount, userAddress } = args as {
          fromChainId: number;
          toChainId: number;
          fromToken: string;
          toToken: string;
          amount: string;
          userAddress: string;
        };

        const response = await axios.get<QuoteResponse>(`${API_BASE_URL}/api/swap/quote`, {
          params: {
            fromChainId,
            toChainId,
            fromToken,
            toToken,
            amount,
            userAddress,
          },
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'get_chain_info': {
        const { chainId } = args as { chainId: number };
        const response = await axios.get<AssetsResponse>(`${API_BASE_URL}/api/swap/assets`);
        const chain = response.data.chains.find((c: Chain) => c.id === chainId);

        if (!chain) {
          throw new Error(`Chain ${chainId} not found`);
        }

        // Get tokens for this chain
        const tokens = response.data.tokens[chain.caipChainId] || [];

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ ...chain, tokens }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      const errorMessage = axiosError.response?.data?.error || axiosError.message;
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: errorMessage,
                status: axiosError.response?.status,
                details: axiosError.response?.data,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
    throw error;
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Obscura Swap MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
