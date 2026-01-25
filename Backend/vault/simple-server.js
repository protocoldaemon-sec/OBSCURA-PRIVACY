const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  
  if (req.url === '/health') {
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Simple server is running'
    }));
  } else {
    res.end(JSON.stringify({
      name: 'Obscura Vault API',
      version: '0.1.0',
      status: 'running',
      endpoints: {
        health: '/health'
      }
    }));
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Simple server running on port ${PORT}`);
});