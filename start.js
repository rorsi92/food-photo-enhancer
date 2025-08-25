#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Food Photo Enhancer Backend...');

// Change to backend directory and start
const backendPath = path.join(__dirname, 'backend');
console.log('📁 Backend path:', backendPath);

// First install dependencies
console.log('📦 Installing backend dependencies...');
const installProcess = spawn('npm', ['install'], {
  cwd: backendPath,
  stdio: 'inherit',
  shell: true
});

installProcess.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Failed to install dependencies');
    process.exit(1);
  }
  
  console.log('✅ Dependencies installed, starting server...');
  
  // Start the server
  const serverProcess = spawn('npm', ['start'], {
    cwd: backendPath,
    stdio: 'inherit',
    shell: true
  });
  
  serverProcess.on('close', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(code);
  });
});