const express = require('express');
const crypto = require('crypto');
const https = require('https');
const App = require('../src');

const server = express();

// 解析 JSON (需要 raw body 來驗證簽名)
server.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));

// LINE webhook 驗證 middleware
function verifyLineSignature(req, res, next) {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const signature = req.get('X-Line-Signature');
  
  if (!signature || !channelSecret) {
    return res.status(401).send('Unauthorized');
  }
  
  const hash = crypto
    .createHmac('sha256', channelSecret)
    .update(req.rawBody || JSON.stringify(req.body))
    .digest('base64');
  
  if (hash !== signature) {
    return res.status(401).send('Unauthorized');
  }
  
  next();
}

// 發送 LINE 訊息的輔助函數
function sendLineMessage(accessToken, replyToken, messages) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      replyToken,
      messages
    });

    const options = {
      hostname: 'api.line.me',
      path: '/v2/bot/message/reply',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`LINE API error: ${res.statusCode} - ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// 建立 LINE context 的輔助函數
function createLineContext(event) {
  const accessToken = process.env.LINE_ACCESS_TOKEN || process.env.LINE_CHANNEL_ACCESS_TOKEN;
  
  return {
    platform: 'line',
    event: {
      ...event,
      isText: event.type === 'message' && event.message.type === 'text',
      isSticker: event.type === 'message' && event.message.type === 'sticker',
      isImage: event.type === 'message' && event.message.type === 'image',
      isVideo: event.type === 'message' && event.message.type === 'video',
      isAudio: event.type === 'message' && event.message.type === 'audio',
      isLocation: event.type === 'message' && event.message.type === 'location',
      isFollow: event.type === 'follow',
      isUnfollow: event.type === 'unfollow',
      isJoin: event.type === 'join',
      isPostback: event.type === 'postback',
      text: event.type === 'message' && event.message.type === 'text' ? event.message.text : null,
      sticker: event.type === 'message' && event.message.type === 'sticker' ? event.message : null,
      location: event.type === 'message' && event.message.type === 'location' ? event.message : null,
      postback: event.type === 'postback' ? event.postback : null,
    },
    session: {
      id: event.source.userId || event.source.groupId || event.source.roomId || 'unknown'
    },
    sendText: async (text) => {
      await sendLineMessage(accessToken, event.replyToken, [{ type: 'text', text }]);
    },
    sendSticker: async (sticker) => {
      await sendLineMessage(accessToken, event.replyToken, [{ type: 'sticker', ...sticker }]);
    },
    sendButtonTemplate: async (title, options) => {
      await sendLineMessage(accessToken, event.replyToken, [{
        type: 'template',
        altText: title,
        template: {
          type: 'buttons',
          title: title,
          text: options.text,
          actions: options.actions
        }
      }]);
    },
    reply: async (messages) => {
      await sendLineMessage(accessToken, event.replyToken, messages);
    }
  };
}

// LINE webhook 處理 - 處理所有 POST 請求
server.post('*', verifyLineSignature, async (req, res) => {
  const events = req.body.events;
  const router = App();
  
  try {
    for (const event of events) {
      const context = createLineContext(event);
      await router(context);
    }
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

// 處理所有其他請求（用於測試）
server.all('*', (req, res) => {
  res.status(200).json({ message: 'LINE Bot is running', method: req.method, path: req.path });
});

// Vercel serverless function
module.exports = server;