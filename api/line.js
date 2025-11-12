const { createServer } = require('@bottender/express');
const App = require('../src');

// createServer 需要 App 函數，直接導出 Express app
module.exports = createServer(App, {
  dev: false,
});