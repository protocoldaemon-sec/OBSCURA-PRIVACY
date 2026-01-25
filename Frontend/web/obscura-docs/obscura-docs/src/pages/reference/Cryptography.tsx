import Accordion from '../../components/ui/Accordion'
import Table from '../../components/ui/Table'

export default function Cryptography() {
  const wotsParams = [
    { param: 'w', value: '16', description: 'Winternitz parameter' },
    { param: 'n', value: '32', description: 'Hash output length (bytes)' },
    { param: 'len', value: '67', description: 'Total signature length' },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Cryptographic Primitives</h1>
      <p className="text-[var(--text-secondary)] mb-8">
        Obscura uses advanced cryptographic primitives to provide post-quantum security and privacy.
      </p>

      <div className="space-y-4">
        <Accordion title="WOTS+ (Winternitz One-Time Signatures)" defaultOpen>
          <div className="space-y-4">
            <p className="text-[var(--text-secondary)]">
              WOTS+ provides post-quantum secure digital signatures. Unlike traditional signatures (ECDSA, EdDSA), 
              WOTS+ is resistant to attacks from quantum computers.
            </p>
            <h4 className="font-semibold text-[var(--text-primary)]">Parameters</h4>
            <Table
              columns={[
                { key: 'param', header: 'Parameter' },
                { key: 'value', header: 'Value' },
                { key: 'description', header: 'Description' },
              ]}
              data={wotsParams}
            />
            <div className="p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
              <p className="text-sm text-[var(--warning)]">
                Important: Each WOTS+ key can only be used once. Using a key twice compromises security.
              </p>
            </div>
          </div>
        </Accordion>

        <Accordion title="Merkle Trees">
          <div className="space-y-4">
            <p className="text-[var(--text-secondary)]">
              XMSS-style Merkle trees are used for efficient key management. A single merkle root 
              can represent thousands of one-time keys.
            </p>
            <h4 className="font-semibold text-[var(--text-primary)]">Benefits</h4>
            <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-1">
              <li>Efficient proof verification</li>
              <li>Supports large key pools (10,000+ keys)</li>
              <li>Compact on-chain storage (single root hash)</li>
              <li>Logarithmic proof size</li>
            </ul>
          </div>
        </Accordion>

        <Accordion title="Stealth Addressing">
          <div className="space-y-4">
            <p className="text-[var(--text-secondary)]">
              Stealth addresses provide unlinkable payments. Each transaction uses a unique 
              one-time address derived using ECDH key exchange.
            </p>
            <h4 className="font-semibold text-[var(--text-primary)]">How It Works</h4>
            <ol className="list-decimal list-inside text-[var(--text-secondary)] space-y-2">
              <li>Sender generates ephemeral keypair</li>
              <li>Shared secret computed via ECDH with recipient's public key</li>
              <li>One-time address derived from shared secret</li>
              <li>Only recipient can compute the private key for this address</li>
            </ol>
            <h4 className="font-semibold text-[var(--text-primary)] mt-4">Privacy Guarantees</h4>
            <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-1">
              <li>Addresses cannot be linked to recipient's main address</li>
              <li>Multiple payments to same recipient use different addresses</li>
              <li>On-chain observers cannot determine the recipient</li>
            </ul>
          </div>
        </Accordion>

        <Accordion title="Pedersen Commitments">
          <div className="space-y-4">
            <p className="text-[var(--text-secondary)]">
              Pedersen commitments hide transaction amounts while allowing verification 
              of correctness without revealing the actual values.
            </p>
            <h4 className="font-semibold text-[var(--text-primary)]">Properties</h4>
            <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-1">
              <li><strong>Hiding:</strong> Commitment reveals nothing about the value</li>
              <li><strong>Binding:</strong> Cannot open commitment to different value</li>
              <li><strong>Homomorphic:</strong> Can add commitments without revealing values</li>
            </ul>
            <h4 className="font-semibold text-[var(--text-primary)] mt-4">Use in Obscura</h4>
            <p className="text-[var(--text-secondary)]">
              Transaction amounts are committed using Pedersen commitments. Validators can verify 
              that inputs equal outputs without knowing the actual amounts.
            </p>
          </div>
        </Accordion>
      </div>
    </div>
  )
}
