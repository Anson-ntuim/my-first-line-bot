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
    if (!accessToken) {
      return reject(new Error('AccessToken is missing!'));
    }
    
    if (!replyToken) {
      return reject(new Error('ReplyToken is missing!'));
    }
    
    const data = JSON.stringify({
      replyToken,
      messages
    });

    console.log('=== SENDING LINE MESSAGE ===');
    console.log('ReplyToken:', replyToken);
    console.log('Messages:', JSON.stringify(messages, null, 2));
    console.log('AccessToken length:', accessToken.length);

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
        console.log('LINE API response status:', res.statusCode);
        console.log('LINE API response body:', body);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('Message sent successfully!');
          resolve(body);
        } else {
          const error = new Error(`LINE API error: ${res.statusCode} - ${body}`);
          console.error('LINE API error:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });
    
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
      console.log('Sending text:', text);
      try {
        await sendLineMessage(accessToken, event.replyToken, [{ type: 'text', text }]);
        console.log('Text sent successfully');
      } catch (error) {
        console.error('Error sending text:', error);
        throw error;
      }
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
  console.log('=== Webhook Request Received ===');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  const events = req.body.events || [];
  console.log('Events array length:', events.length);
  console.log('Events:', JSON.stringify(events, null, 2));
  
  if (events.length === 0) {
    console.log('WARNING: No events received!');
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    return res.status(200).send('OK');
  }
  
  const router = App();
  
  try {
    for (const event of events) {
      console.log('Processing event:', event.type, event.message?.type || 'N/A');
      console.log('Event details:', JSON.stringify(event, null, 2));
      
      const context = createLineContext(event);
      console.log('=== CONTEXT DEBUG ===');
      console.log('isText:', context.event.isText);
      console.log('text:', context.event.text);
      console.log('type:', event.type);
      console.log('hasReplyToken:', !!event.replyToken);
      console.log('event keys:', Object.keys(context.event));
      
      // 檢查 router 是否為函數
      if (typeof router !== 'function') {
        console.error('Router is not a function!', typeof router);
        return res.status(500).send('Router error');
      }
      
      // 檢查 accessToken 是否存在
      const accessToken = process.env.LINE_ACCESS_TOKEN || process.env.LINE_CHANNEL_ACCESS_TOKEN;
      console.log('AccessToken exists:', !!accessToken);
      if (!accessToken) {
        console.error('ERROR: AccessToken is missing!');
      }
      
      console.log('=== CALLING ROUTER ===');
      try {
        const handler = await router(context);
        console.log('Router returned handler:', typeof handler);
        
        // Bottender router 返回的是一個處理函數，需要執行它
        if (typeof handler === 'function') {
          console.log('Executing handler...');
          await handler(context);
          console.log('Handler executed successfully');
        } else {
          console.log('Handler is not a function, result:', handler);
        }
      } catch (routerError) {
        console.error('Router error:', routerError);
        console.error('Router error message:', routerError.message);
        console.error('Router error stack:', routerError.stack);
      }
      console.log('=== ROUTER COMPLETED ===');
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing webhook:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).send('Internal Server Error');
  }
});

// 處理所有其他請求（用於測試）
server.all('*', (req, res) => {
  res.status(200).json({ message: 'LINE Bot is running', method: req.method, path: req.path });
});

// Vercel serverless function
module.exports = server;