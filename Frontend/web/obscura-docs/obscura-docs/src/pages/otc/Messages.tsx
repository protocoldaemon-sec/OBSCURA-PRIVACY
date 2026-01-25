import EndpointHeader from '../../components/docs/EndpointHeader'
import RequestBody from '../../components/docs/RequestBody'
import ResponseExample from '../../components/docs/ResponseExample'

export default function Messages() {
  const sendMessageResponse = {
    success: true,
    data: {
      messageId: "880e8400-e29b-41d4-a716-446655440003",
      timestamp: 1737640000000
    }
  }

  const getMessagesResponse = {
    success: true,
    data: {
      messages: [
        {
          messageId: "880e8400-e29b-41d4-a716-446655440003",
          senderPublicKey: "0x...",
          recipientStealthAddress: "0x...",
          encryptedContent: "0x...",
          timestamp: 1737640000000
        }
      ]
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">Private Messages</h1>
        <p className="text-lg text-[var(--text-secondary)]">
          Send encrypted messages between takers and market makers. Messages are encrypted to recipient's stealth address.
        </p>
      </div>

      <div>
        <EndpointHeader
          method="POST"
          path="/api/v1/rfq/message"
          description="Send a private message"
        />

        <div className="space-y-6">
          <RequestBody
            fields={[
              { name: 'quoteRequestId', type: 'string', required: true, description: 'Quote request ID' },
              { name: 'recipientStealthAddress', type: 'string', required: true, description: "Recipient's stealth address" },
              { name: 'encryptedContent', type: 'string', required: true, description: 'Encrypted message content (hex string)' },
              { name: 'signature', type: 'string', required: true, description: 'WOTS+ signature' },
              { name: 'publicKey', type: 'string', required: true, description: "Sender's WOTS+ public key" },
            ]}
          />

          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Authorization</h3>
            <p className="text-[var(--text-secondary)]">
              Sender must be either the taker who created the quote request OR a market maker who submitted a quote for it.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Responses</h3>
            <ResponseExample status={201} statusText="Created" body={sendMessageResponse} />
          </div>
        </div>
      </div>

      <div>
        <EndpointHeader
          method="GET"
          path="/api/v1/rfq/quote-request/:id/messages"
          description="Get messages for a quote request"
        />

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Query Parameters</h3>
            <ul className="space-y-2 text-[var(--text-secondary)]">
              <li><code className="text-[var(--accent-secondary)]">publicKey</code> (required): User's WOTS+ public key (to filter messages)</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Responses</h3>
            <ResponseExample status={200} statusText="OK" body={getMessagesResponse} />
          </div>

          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="text-[var(--text-secondary)] text-sm">
              Only returns messages where the user is either sender or recipient.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
