import EndpointHeader from '../../components/docs/EndpointHeader'
import RequestBody from '../../components/docs/RequestBody'
import ResponseExample from '../../components/docs/ResponseExample'

export default function Admin() {
  const addResponse = {
    success: true,
    data: {
      address: "market-maker-address",
      addedAt: 1737640000000,
      addedBy: "0x..."
    }
  }

  const removeResponse = {
    success: true,
    data: {
      address: "market-maker-address",
      removedAt: 1737640000000
    }
  }

  const listResponse = {
    success: true,
    data: {
      whitelist: [
        {
          address: "market-maker-1",
          addedAt: 1737640000000,
          addedBy: "0x..."
        }
      ]
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">Admin Whitelist</h1>
        <p className="text-lg text-[var(--text-secondary)]">
          Manage market maker whitelist for permissioned mode. Admin authentication required.
        </p>
      </div>

      <div className="mb-8 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <p className="text-blue-400 font-semibold mb-2">Whitelist Modes</p>
        <div className="text-[var(--text-secondary)] text-sm space-y-2">
          <p><strong>Permissionless (Default):</strong> Anyone can be a market maker. No whitelist needed.</p>
          <p><strong>Permissioned:</strong> Only whitelisted market makers can submit quotes. Admin approval required.</p>
        </div>
      </div>

      <div>
        <EndpointHeader
          method="POST"
          path="/api/v1/admin/whitelist/add"
          description="Add market maker to whitelist"
        />

        <div className="space-y-6">
          <RequestBody
            fields={[
              { name: 'address', type: 'string', required: true, description: 'Market maker address to whitelist' },
              { name: 'signature', type: 'string', required: true, description: 'Admin WOTS+ signature' },
              { name: 'publicKey', type: 'string', required: true, description: 'Admin WOTS+ public key (must be authorized)' },
            ]}
          />

          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Responses</h3>
            <ResponseExample status={201} statusText="Created" body={addResponse} />
          </div>
        </div>
      </div>

      <div>
        <EndpointHeader
          method="POST"
          path="/api/v1/admin/whitelist/remove"
          description="Remove market maker from whitelist"
        />

        <div className="space-y-6">
          <RequestBody
            fields={[
              { name: 'address', type: 'string', required: true, description: 'Market maker address to remove' },
              { name: 'signature', type: 'string', required: true, description: 'Admin WOTS+ signature' },
              { name: 'publicKey', type: 'string', required: true, description: 'Admin WOTS+ public key' },
            ]}
          />

          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Responses</h3>
            <ResponseExample status={200} statusText="OK" body={removeResponse} />
          </div>
        </div>
      </div>

      <div>
        <EndpointHeader
          method="GET"
          path="/api/v1/admin/whitelist"
          description="Get all whitelisted market makers"
        />

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Responses</h3>
            <ResponseExample status={200} statusText="OK" body={listResponse} />
          </div>
        </div>
      </div>
    </div>
  )
}
