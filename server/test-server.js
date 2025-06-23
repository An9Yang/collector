console.log('Starting test server...');

import('./server.js')
  .then(() => {
    console.log('Server module loaded successfully');
  })
  .catch(err => {
    console.error('Error loading server:', err);
    process.exit(1);
  });