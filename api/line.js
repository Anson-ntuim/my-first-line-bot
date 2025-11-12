const { createServer } = require('@bottender/express');
const App = require('../src');

// 建立 Express server，Bottender 會自動處理 LINE webhook
const server = createServer(App);

// Vercel serverless function
module.exports = server;