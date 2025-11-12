const express = require('express');
const { Line } = require('bottender');
const App = require('../src');

const server = express();

// 解析 JSON
server.use(express.json());

// 建立 LINE connector
const line = new Line({
  accessToken: process.env.LINE_ACCESS_TOKEN || process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
});

// LINE webhook middleware
server.post('/', line.verify(), async (req, res) => {
  const events = req.body.events;
  const router = App(); // App() 返回 router
  
  for (const event of events) {
    const context = line.createContext(event);
    await router(context); // router 可以直接處理 context
  }
  
  res.status(200).send('OK');
});

// Vercel serverless function
module.exports = server;