const { bottender } = require('bottender');

const app = bottender({
  dev: false,
});

const handler = app.getRequestHandler();

module.exports = async (req, res) => {
  return handler(req, res);
};
