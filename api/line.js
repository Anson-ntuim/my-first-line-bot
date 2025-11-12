const { bottender } = require('bottender');

// bottender() 返回 Express app
const app = bottender({
  dev: false,
});

// 檢查 app 的類型並正確導出
if (typeof app === 'function') {
  // 如果 app 是函數，直接導出
  module.exports = app;
} else {
  // 如果 app 是物件，嘗試取得 Express app
  // Bottender 可能返回 { app: expressApp } 或類似的結構
  const expressApp = app.app || app.default || app;
  
  if (typeof expressApp === 'function') {
    module.exports = expressApp;
  } else {
    // 最後的備選方案：包裝成函數
    module.exports = (req, res) => {
      if (typeof app === 'function') {
        return app(req, res);
      } else if (app && app.handle) {
        return app.handle(req, res);
      } else {
        console.error('Bottender app structure:', Object.keys(app || {}));
        res.status(500).json({ 
          error: 'Invalid handler',
          type: typeof app,
          keys: app ? Object.keys(app) : 'null'
        });
      }
    };
  }
}