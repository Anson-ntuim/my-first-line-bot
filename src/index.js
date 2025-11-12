const { router, text, route, payload } = require('bottender/router');

async function handleText(context) {
  const userText = context.event.text;
  await context.sendText(`你說了:${userText}`);
}

async function handleSticker(context) {
  await context.sendText('好可愛的貼圖~');
}

async function handleImage(context) {
  await context.sendText('收到圖片了!');
}

async function handlePostback(context) {
  const data = context.event.postback.data;
  await context.sendText(`Postback: ${data}`);
}

async function handleFollow(context) {
  await context.sendText('感謝你加我為好友!');
}

async function showMenu(context) {
  await context.sendButtonTemplate('選單', {
    text: '請選擇功能:',
    actions: [
      { type: 'message', label: '功能1', text: '功能1' },
      { type: 'message', label: '功能2', text: '功能2' },
      { type: 'postback', label: '功能3', data: 'action=功能3' }
    ]
  });
}

module.exports = function App() {
  return router([
    text('選單|menu', showMenu),
    text(/^hello|hi|你好$/i, async (context) => {
      await context.sendText('你好!');
    }),
    text('*', handleText),
    route(context => context.event.isSticker, handleSticker),
    route(context => context.event.isImage, handleImage),
    route(context => context.event.isPostback, handlePostback),
    route(context => context.event.isFollow, handleFollow),
  ]);
};