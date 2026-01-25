import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Overview from './pages/Overview'
import Status from './pages/endpoints/Status'
import Deposit from './pages/endpoints/Deposit'
import Withdraw from './pages/endpoints/Withdraw'
import Batches from './pages/endpoints/Batches'
import Relayer from './pages/endpoints/Relayer'
import QuoteRequest from './pages/otc/QuoteRequest'
import Quote from './pages/otc/Quote'
import Accept from './pages/otc/Accept'
import Messages from './pages/otc/Messages'
import Admin from './pages/otc/Admin'
import ErrorCodes from './pages/reference/ErrorCodes'
import SupportedChains from './pages/reference/SupportedChains'
import Cryptography from './pages/reference/Cryptography'
import ZkCompression from './pages/reference/ZkCompression'
import LlmDocs from './pages/reference/LlmDocs'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/vault/status" element={<Status />} />
        <Route path="/vault/deposit" element={<Deposit />} />
        <Route path="/vault/withdraw" element={<Withdraw />} />
        <Route path="/vault/batches" element={<Batches />} />
        <Route path="/vault/relayer" element={<Relayer />} />
        <Route path="/otc/quote-request" element={<QuoteRequest />} />
        <Route path="/otc/quote" element={<Quote />} />
        <Route path="/otc/accept" element={<Accept />} />
        <Route path="/otc/messages" element={<Messages />} />
        <Route path="/otc/admin" element={<Admin />} />
        <Route path="/reference/errors" element={<ErrorCodes />} />
        <Route path="/reference/chains" element={<SupportedChains />} />
        <Route path="/reference/cryptography" element={<Cryptography />} />
        <Route path="/reference/zk-compression" element={<ZkCompression />} />
        <Route path="/reference/llm-docs" element={<LlmDocs />} />
      </Routes>
    </Layout>
  )
}

export default App
