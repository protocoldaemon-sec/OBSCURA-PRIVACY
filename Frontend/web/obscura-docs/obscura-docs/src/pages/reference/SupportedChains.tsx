import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import ChainLogo from '../../components/ui/ChainLogo'
import CodeBlock from '../../components/ui/CodeBlock'

export default function SupportedChains() {
  const chains = [
    { chain: <div className="flex items-center gap-2"><ChainLogo chain="solana" size="sm" /><span>Solana Devnet</span></div>, chainId: 'solana-devnet', type: 'SVM', status: <Badge variant="get">Active</Badge> },
    { chain: <div className="flex items-center gap-2"><ChainLogo chain="ethereum" size="sm" /><span>Sepolia</span></div>, chainId: 'sepolia', type: 'EVM', status: <Badge variant="get">Active</Badge> },
    { chain: <div className="flex items-center gap-2"><ChainLogo chain="ethereum" size="sm" /><span>Ethereum</span></div>, chainId: 'ethereum', type: 'EVM', status: <Badge variant="warning">Soon</Badge> },
    { chain: <div className="flex items-center gap-2"><ChainLogo chain="polygon" size="sm" /><span>Polygon</span></div>, chainId: 'polygon', type: 'EVM', status: <Badge variant="warning">Soon</Badge> },
  ]

  const solanaContracts = `Program ID: GG9U34H1xXkuzvv8Heoy4UWav5vUgrQFEVwrYMi84QuE
Vault PDA: 6owJu2yXoPvTbM67XwmRguVRQhCADaswHkAVhVHSvoH7
Vault State PDA: 5L1Vh6ftZWncYc1SEdZsoEX4DKaqCY6ZoQ3CdcEqursB`

  const sepoliaContracts = `SIPVault: 0xc4937Ba6418eE72EDABF72694198024b5a3599CC
SIPSettlement: 0x88dA9c5D9801cb33615f0A516eb1098dF1889DA9`

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Supported Chains</h1>
      <p className="text-[var(--text-secondary)] mb-8">
        Obscura supports multiple blockchain networks for private transactions.
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Available Chains</h2>
        <Table
          columns={[
            { key: 'chain', header: 'Chain' },
            { key: 'chainId', header: 'Chain ID' },
            { key: 'type', header: 'Type' },
            { key: 'status', header: 'Status' },
          ]}
          data={chains}
        />
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Deployed Contracts</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Solana Devnet</h3>
            <CodeBlock code={solanaContracts} language="plaintext" title="Solana Addresses" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Sepolia Testnet (ETH)</h3>
            <CodeBlock code={sepoliaContracts} language="plaintext" title="Sepolia Addresses" />
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Chain Types</h2>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">EVM (Ethereum Virtual Machine)</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Ethereum-compatible chains including Ethereum mainnet, Sepolia testnet, and Polygon. 
              These chains use the same address format (0x...) and support ERC-20 tokens.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">SVM (Solana Virtual Machine)</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Solana network with its own address format and SPL token standard. 
              Addresses are base58-encoded public keys. Supports ZK Compression via Light Protocol.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">ZK Compression Support</h2>
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <p className="text-[var(--text-secondary)]">
            <span className="text-blue-400 font-semibold">Solana only:</span> Withdrawals use Light Protocol ZK Compression for ~1000x cheaper state storage.
            ETH withdrawals do NOT use ZK Compression to prevent cross-chain data correlation.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Chain ID Usage</h2>
        <p className="text-[var(--text-secondary)] mb-4">
          Use the <code className="text-[var(--accent-secondary)]">chainId</code> value in API requests:
        </p>
        <ul className="space-y-2 text-[var(--text-secondary)]">
          <li>• <code className="text-[var(--accent-secondary)]">solana-devnet</code> - Solana Devnet</li>
          <li>• <code className="text-[var(--accent-secondary)]">sepolia</code> - Ethereum Sepolia testnet</li>
        </ul>
      </section>
    </div>
  )
}
