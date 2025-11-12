const { bottender } = require('bottender');

const handler = bottender({
  dev: false,
});

module.exports = async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};