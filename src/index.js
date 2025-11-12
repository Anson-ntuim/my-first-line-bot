const { router, text, route, payload } = require('bottender/router');

let money = [0, 0, 0, 0];
let currentIndex = 0;
const categories = ['餐飲', '交通', '娛樂', '其他'];


async function handleText(context) {
  const userText = context.event.text;
  await context.sendText(`你說了:${userText}`);
}

async function handleMoney(context) {
  money[currentIndex] = Number(context.event.text) + money[currentIndex];
  await context.sendText(`${context.event.text} 已記錄，目前${categories[currentIndex]}總為: ${money[currentIndex]}`);
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

async function handleCategory(context) {
  if (context.event.text === '餐飲') {
    currentIndex = 0;
  } else if (context.event.text === '交通') {
    currentIndex = 1;
  } else if (context.event.text === '娛樂') {
    currentIndex = 2;
  } else if (context.event.text === '其他') {
    currentIndex = 3;
  }
  await context.sendText(`你選擇了:${context.event.text}`);
  await context.sendText(`請輸入金額:`);
}

async function showMenu(context) {
  await context.sendButtonTemplate('選單', {
    text: '請選擇花費:',
    actions: [
      { type: 'message', label: '餐飲', text: '餐飲' },
      { type: 'message', label: '交通', text: '交通' },
      { type: 'message', label: '娛樂', text: '娛樂' },
      { type: 'message', label: '其他', text: '其他' },
    ]
  });
}

module.exports = function App() {
  return router([
    text(/^記帳$/i, showMenu),
    text(/^hello|hi|你好$/i, async (context) => {
      await context.sendText('你好!');
    }),
    text(/^\d+$/i, handleMoney),
    text(/^餐飲|交通|娛樂|其他$/i, handleCategory),
    text('*', handleText),
    route(context => context.event.isSticker, handleSticker),
    route(context => context.event.isImage, handleImage),
    route(context => context.event.isPostback, handlePostback),
    route(context => context.event.isFollow, handleFollow),
  ]);
};