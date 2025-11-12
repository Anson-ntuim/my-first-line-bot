const { bottender } = require('bottender');

// 使用 bottender() 建立 bot，它會自動載入 src/index.js
const bot = bottender({
  dev: false,
});

// 包裝成 Vercel serverless function
module.exports = async (req, res) => {
  // bottender 會處理所有的請求
  if (bot && typeof bot === 'function') {
    return bot(req, res);
  } else if (bot && bot.requestHandler) {
    return bot.requestHandler(req, res);
  } else {
    // 如果 bot 有 listen 方法，表示它是 Express app
    // 需要手動處理請求
    const handler = bot._router || bot;
    if (typeof handler === 'function') {
      return handler(req, res);
    }
    res.status(500).json({ error: 'Invalid bot configuration' });
  }
};

