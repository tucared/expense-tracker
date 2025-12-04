#!/usr/bin/env node
import { setGlobalDispatcher, ProxyAgent } from 'undici';
import { spawn } from 'child_process';

// Get proxy from environment
const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;

if (proxyUrl) {
  console.log('Configuring undici to use proxy:', proxyUrl.split('@')[1] || proxyUrl);
  const proxyAgent = new ProxyAgent(proxyUrl);
  setGlobalDispatcher(proxyAgent);
}

// Get the command and args from process.argv
const [,, command, ...args] = process.argv;

if (!command) {
  console.error('Usage: node build-wrapper.js <command> [args...]');
  process.exit(1);
}

// Run the command
const child = spawn(command, args, {
  stdio: 'inherit',
  shell: true
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
