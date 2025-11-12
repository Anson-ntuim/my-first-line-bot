const express = require('express');
const { createServer } = require('@bottender/express');
const App = require('../src');

// 建立 Express app
const app = express();

// 重要：在 body parser 之前，保留原始 body 供簽名驗證使用
app.use(express.json({
  verify: (req, res, buf) => {
    // 將原始 body 存到 req.rawBody，供 Bottender 驗證簽名使用
    req.rawBody = buf.toString('utf8');
  }
}));

// 使用 @bottender/express 建立 Bottender server
const bottenderServer = createServer(App, {
  dev: false,
});

// 將 Bottender server 掛載到 Express app
app.use(bottenderServer);

// 導出 Express app（Vercel 可以直接使用）
module.exports = app;

