const { bottender } = require('bottender');

const app = bottender({
  dev: false,
});

// Vercel serverless function 需要一個函數
module.exports = (req, res) => {
  return app(req, res);
};