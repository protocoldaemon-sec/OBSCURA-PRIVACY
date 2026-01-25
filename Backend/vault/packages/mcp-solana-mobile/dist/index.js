#!/usr/bin/env node
/**
 * MCP Server for Solana Mobile Documentation
 * Provides tools to fetch and search Solana Mobile docs
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
const BASE_URL = 'https://docs.solanamobile.com';
// Documentation structure
const DOCS_STRUCTURE = {
    'getting-started': {
        title: 'Getting Started',
        pages: ['intro', 'development-setup', 'react-native-quickstart', 'kotlin-quickstart'],
    },
    'react-native': {
        title: 'React Native SDK',
        pages: ['overview', 'mobile-wallet-adapter', 'expo', 'building-for-saga'],
    },
    'android-native': {
        title: 'Android Native',
        pages: ['overview', 'making-rpc-requests', 'building-transactions'],
    },
    'mobile-wallet-adapter': {
        title: 'Mobile Wallet Adapter',
        pages: ['overview', 'using-mwa', 'integration-guide'],
    },
    'dapp-store': {
        title: 'dApp Store',
        pages: ['overview', 'publishing-guide', 'requirements'],
    },
    'sample-apps': {
        title: 'Sample Apps',
        pages: ['overview'],
    },
};
async function fetchDocPage(path) {
    const url = `${BASE_URL}/${path}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            return `Error fetching ${url}: ${response.status}`;
        }
        const html = await response.text();
        // Extract main content (simple extraction)
        const contentMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
            html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
        if (contentMatch) {
            // Strip HTML tags for cleaner output
            return contentMatch[1]
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        }
        return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    catch (error) {
        return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
}
const server = new Server({ name: 'solana-mobile-docs', version: '0.1.0' }, { capabilities: { tools: {}, resources: {} } });
// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: 'get_solana_mobile_doc',
            description: 'Fetch a specific Solana Mobile documentation page',
            inputSchema: {
                type: 'object',
                properties: {
                    section: {
                        type: 'string',
                        description: 'Documentation section (e.g., getting-started, react-native, android-native, mobile-wallet-adapter, dapp-store)',
                    },
                    page: {
                        type: 'string',
                        description: 'Page within the section (e.g., intro, overview, quickstart)',
                    },
                },
                required: ['section', 'page'],
            },
        },
        {
            name: 'list_solana_mobile_sections',
            description: 'List all available Solana Mobile documentation sections and pages',
            inputSchema: { type: 'object', properties: {} },
        },
        {
            name: 'search_solana_mobile_docs',
            description: 'Search Solana Mobile documentation for a specific topic',
            inputSchema: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'Search query (e.g., "wallet adapter", "transaction signing", "expo")',
                    },
                },
                required: ['query'],
            },
        },
    ],
}));
// List resources
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: Object.entries(DOCS_STRUCTURE).flatMap(([section, data]) => data.pages.map((page) => ({
        uri: `solana-mobile://${section}/${page}`,
        name: `${data.title} - ${page}`,
        mimeType: 'text/plain',
    }))),
}));
// Read resource
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    const match = uri.match(/solana-mobile:\/\/([^/]+)\/(.+)/);
    if (!match) {
        throw new Error(`Invalid URI: ${uri}`);
    }
    const [, section, page] = match;
    const content = await fetchDocPage(`${section}/${page}`);
    return {
        contents: [{ uri, mimeType: 'text/plain', text: content }],
    };
});
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    switch (name) {
        case 'get_solana_mobile_doc': {
            const { section, page } = args;
            const content = await fetchDocPage(`${section}/${page}`);
            return { content: [{ type: 'text', text: content }] };
        }
        case 'list_solana_mobile_sections': {
            const sections = Object.entries(DOCS_STRUCTURE)
                .map(([key, data]) => `## ${data.title}\n- ${data.pages.join('\n- ')}`)
                .join('\n\n');
            return {
                content: [{ type: 'text', text: `# Solana Mobile Documentation\n\n${sections}` }],
            };
        }
        case 'search_solana_mobile_docs': {
            const { query } = args;
            const results = [];
            const lowerQuery = query.toLowerCase();
            for (const [section, data] of Object.entries(DOCS_STRUCTURE)) {
                for (const page of data.pages) {
                    if (section.includes(lowerQuery) ||
                        page.includes(lowerQuery) ||
                        data.title.toLowerCase().includes(lowerQuery)) {
                        results.push(`- ${data.title}/${page}: ${BASE_URL}/${section}/${page}`);
                    }
                }
            }
            if (results.length === 0) {
                return {
                    content: [{ type: 'text', text: `No results found for "${query}". Try: react-native, wallet-adapter, expo, dapp-store` }],
                };
            }
            return {
                content: [{ type: 'text', text: `# Search Results for "${query}"\n\n${results.join('\n')}` }],
            };
        }
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
});
// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Solana Mobile MCP Server running on stdio');
}
main().catch(console.error);
