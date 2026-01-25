'use client'

import { useState } from 'react'
import { useWOTSWallet } from '@/hooks/useWOTSWallet'

export default function TestWOTSPage() {
  const { signMessage, isLoading, error } = useWOTSWallet()
  const [result, setResult] = useState<any>(null)
  const [testMessage, setTestMessage] = useState('Hello, Obscura Dark OTC!')
  const [testTag, setTestTag] = useState('test-wots-signature')

  const handleTest = async () => {
    try {
      setResult(null)
      console.log('🧪 Testing WOTS+ signature generation...')
      
      const { signature, publicKey } = await signMessage(testMessage, testTag)
      
      const testResult = {
        success: true,
        message: testMessage,
        tag: testTag,
        signature: {
          value: signature,
          length: signature.length,
          valid: signature.length === 4288
        },
        publicKey: {
          value: publicKey,
          length: publicKey.length,
          valid: publicKey.length === 4416
        },
        timestamp: new Date().toISOString()
      }
      
      setResult(testResult)
      console.log('✅ WOTS+ test successful:', testResult)
      
    } catch (err: any) {
      const errorResult = {
        success: false,
        error: err.message,
        timestamp: new Date().toISOString()
      }
      
      setResult(errorResult)
      console.error('❌ WOTS+ test failed:', errorResult)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">WOTS+ Implementation Test</h1>
        
        <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Parameters</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Test Message</label>
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full px-4 py-2 bg-[#0d0d12] border border-[#2a2a3a] rounded-lg text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Test Tag</label>
              <input
                type="text"
                value={testTag}
                onChange={(e) => setTestTag(e.target.value)}
                className="w-full px-4 py-2 bg-[#0d0d12] border border-[#2a2a3a] rounded-lg text-white"
              />
            </div>
            
            <button
              onClick={handleTest}
              disabled={isLoading}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Testing WOTS+...' : 'Test WOTS+ Signature'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6">
            <h3 className="text-red-400 font-semibold mb-2">Error</h3>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {result && (
          <div className={`border rounded-xl p-6 ${
            result.success 
              ? 'bg-green-500/20 border-green-500/30' 
              : 'bg-red-500/20 border-red-500/30'
          }`}>
            <h3 className={`font-semibold mb-4 ${
              result.success ? 'text-green-400' : 'text-red-400'
            }`}>
              {result.success ? '✅ Test Result: SUCCESS' : '❌ Test Result: FAILED'}
            </h3>
            
            {result.success ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Public Key</h4>
                  <div className="bg-[#0d0d12] rounded-lg p-3">
                    <p className="text-xs font-mono break-all text-gray-300">
                      {result.publicKey.value.slice(0, 100)}...
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Length: {result.publicKey.length} chars 
                      {result.publicKey.valid ? ' ✅' : ' ❌ (expected 4416)'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Signature</h4>
                  <div className="bg-[#0d0d12] rounded-lg p-3">
                    <p className="text-xs font-mono break-all text-gray-300">
                      {result.signature.value.slice(0, 100)}...
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Length: {result.signature.length} chars 
                      {result.signature.valid ? ' ✅' : ' ❌ (expected 4288)'}
                    </p>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  Generated at: {result.timestamp}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-red-300">{result.error}</p>
                <div className="text-xs text-gray-500 mt-2">
                  Failed at: {result.timestamp}
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-8 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Expected Results</h3>
          <div className="space-y-2 text-sm text-gray-400">
            <p>✅ Public Key: 4416 characters (2208 bytes in hex)</p>
            <p>✅ Signature: 4288 characters (2144 bytes in hex)</p>
            <p>✅ No errors during generation</p>
            <p>✅ Each signature uses a unique WOTS+ wallet (one-time use)</p>
          </div>
        </div>
      </div>
    </div>
  )
}