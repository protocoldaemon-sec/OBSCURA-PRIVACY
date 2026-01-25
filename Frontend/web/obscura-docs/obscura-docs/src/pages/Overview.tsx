import { ArrowRight, Shield, Zap, Lock } from 'lucide-react'
import Card from '../components/ui/Card'
import Table from '../components/ui/Table'
import ChainLogo from '../components/ui/ChainLogo'
import CodeBlock from '../components/ui/CodeBlock'

export default function Overview() {
  const apiEndpoints = [
    { 
      product: 'Privacy Vault', 
      baseUrl: 'https://api.obscura-app.com',
      description: 'Deposits, withdrawals, and relayer network'
    },
    { 
      product: 'Dark OTC RFQ', 
      baseUrl: 'https://otc-api.obscura-app.com',
      description: 'Privacy-preserving bilateral trading'
    },
  ]

  const features = [
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Post-Quantum Security',
      description: 'WOTS+ one-time signatures provide quantum-resistant authorization and unlinkable transactions.',
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: 'True Privacy via Relayer',
      description: 'Relayer pattern hides your identity - original depositor never appears in withdrawals.',
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Off-Chain Balance & ZK Compression',
      description: 'Arcium cSPL for encrypted balances + Light Protocol for ~1000x cheaper Solana storage.',
    },
  ]

  const chainsData = [
    { chain: <div className="flex items-center gap-2"><ChainLogo chain="solana" size="sm" /><span>Solana Devnet</span></div>, chainId: 'solana-devnet', type: 'SVM', status: 'Active' },
    { chain: <div className="flex items-center gap-2"><ChainLogo chain="ethereum" size="sm" /><span>Sepolia</span></div>, chainId: 'sepolia', type: 'EVM', status: 'Active' },
    { chain: <div className="flex items-center gap-2"><ChainLogo chain="ethereum" size="sm" /><span>Ethereum</span></div>, chainId: 'ethereum', type: 'EVM', status: 'Coming Soon' },
    { chain: <div className="flex items-center gap-2"><ChainLogo chain="polygon" size="sm" /><span>Polygon</span></div>, chainId: 'polygon', type: 'EVM', status: 'Coming Soon' },
  ]

  const privacyLevels = [
    { level: 'transparent', description: 'All data visible', useCase: 'Debugging, auditing' },
    { level: 'shielded', description: 'Maximum privacy', useCase: 'Default, recommended' },
    { level: 'compliant', description: 'Viewing keys enabled', useCase: 'Regulatory compliance' },
  ]

  const contracts = `// Solana Devnet
Program ID: GG9U34H1xXkuzvv8Heoy4UWav5vUgrQFEVwrYMi84QuE
Vault PDA: 6owJu2yXoPvTbM67XwmRguVRQhCADaswHkAVhVHSvoH7

// Sepolia Testnet (ETH)
SIPVault: 0xc4937Ba6418eE72EDABF72694198024b5a3599CC
SIPSettlement: 0x88dA9c5D9801cb33615f0A516eb1098dF1889DA9`

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">
          Obscura API Documentation
        </h1>
        <p className="text-xl text-[var(--text-secondary)] leading-relaxed">
          Post-quantum secure privacy infrastructure with two products: Privacy Vault for deposits/withdrawals and Dark OTC RFQ for bilateral trading.
        </p>
      </div>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">API Endpoints</h2>
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 mb-6">
          <p className="text-yellow-400 font-semibold mb-2">Two Separate Backends</p>
          <p className="text-[var(--text-secondary)] text-sm">
            Obscura has two independent backend services with different base URLs. Make sure to use the correct endpoint for each product.
          </p>
        </div>
        <div className="space-y-4">
          {apiEndpoints.map((api) => (
            <div
              key={api.product}
              className="p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1">{api.product}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-3">{api.description}</p>
                  <code className="text-[var(--accent-secondary)] font-mono text-sm">
                    {api.baseUrl}
                  </code>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-secondary)]">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">{feature.title}</h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">Privacy Architecture</h2>
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 mb-4">
          <p className="text-green-400 font-semibold mb-2">True Privacy via Relayer Pattern</p>
          <div className="text-[var(--text-secondary)] text-sm space-y-1">
            <p>1. <span className="text-[var(--accent-secondary)]">DEPOSIT</span>: User → Vault (User visible, but unlinkable later)</p>
            <p>2. <span className="text-[var(--accent-secondary)]">WITHDRAW REQUEST</span>: User sends nullifierHash to Relayer (off-chain)</p>
            <p>3. <span className="text-[var(--accent-secondary)]">RELAYER EXECUTION</span>: Relayer → Vault → Recipient (User's address NEVER appears)</p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">Quick Start</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Privacy Vault</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              title="Deposit"
              description="Deposit tokens to privacy vault. Get deposit note with secrets."
              href="/vault/deposit"
              icon={<ArrowRight className="w-5 h-5" />}
            />
            <Card
              title="Withdraw"
              description="Private withdrawal via relayer. Your identity stays hidden."
              href="/vault/withdraw"
              icon={<ArrowRight className="w-5 h-5" />}
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Dark OTC RFQ</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              title="Quote Request"
              description="Create quote request for bilateral trading with privacy."
              href="/otc/quote-request"
              icon={<ArrowRight className="w-5 h-5" />}
            />
            <Card
              title="Submit Quote"
              description="Market makers respond with quotes. Prices visible for comparison."
              href="/otc/quote"
              icon={<ArrowRight className="w-5 h-5" />}
            />
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">Deployed Contracts</h2>
        <CodeBlock code={contracts} language="plaintext" title="Contract Addresses" />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">Supported Chains</h2>
        <Table
          columns={[
            { key: 'chain', header: 'Chain' },
            { key: 'chainId', header: 'Chain ID' },
            { key: 'type', header: 'Type' },
            { key: 'status', header: 'Status' },
          ]}
          data={chainsData}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">Privacy Levels</h2>
        <Table
          columns={[
            { key: 'level', header: 'Level' },
            { key: 'description', header: 'Description' },
            { key: 'useCase', header: 'Use Case' },
          ]}
          data={privacyLevels}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">What's New</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Privacy Vault v0.5.1</h3>
            <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <ul className="space-y-2 text-[var(--text-secondary)]">
                <li>Minimum deposit requirement (0.0003 SOL/ETH)</li>
                <li>Frontend validation enhancements</li>
                <li>Loading modal UX improvements</li>
                <li>Console security hardening</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Dark OTC RFQ v1.0.0</h3>
            <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <ul className="space-y-2 text-[var(--text-secondary)]">
                <li>Private quote request creation</li>
                <li>Market maker quote submission</li>
                <li>Confidential quote selection</li>
                <li>Private messaging between taker and market maker</li>
                <li>Market maker whitelist management (permissioned mode)</li>
                <li>Off-chain balance integration (Arcium cSPL)</li>
                <li>WOTS+ signature verification</li>
                <li>Relayer network integration</li>
                <li>ZK Compression (Solana only)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
