const { bottender } = require('bottender');

// 使用 bottender() 建立 bot，它會自動載入 src/index.js
const bot = bottender({
  dev: false,
});

// bottender() 返回的是一個 Express app，可以直接導出
module.exports = bot;

