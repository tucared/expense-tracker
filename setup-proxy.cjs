// Preload script to load .env and configure undici proxy
require('dotenv').config();

const { setGlobalDispatcher, ProxyAgent, Agent } = require('undici');

const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;

if (proxyUrl) {
  console.log('[Proxy Setup] Configuring undici proxy...');
  try {
    const proxyAgent = new ProxyAgent({
      uri: proxyUrl,
      // Allow proxy to handle DNS resolution
      requestTls: {
        rejectUnauthorized: false
      },
      connect: {
        rejectUnauthorized: false
      },
      // Increase timeout for slow proxy
      timeout: 60000
    });
    setGlobalDispatcher(proxyAgent);
    console.log('[Proxy Setup] Proxy configured successfully');
  } catch (error) {
    console.error('[Proxy Setup] Failed to configure proxy:', error.message);
  }
} else {
  // No proxy, use default agent with increased timeout
  const agent = new Agent({
    connect: {
      timeout: 60000
    }
  });
  setGlobalDispatcher(agent);
}
