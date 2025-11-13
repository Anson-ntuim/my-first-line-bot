const { router, text, route, payload } = require('bottender/router');

// 以 userId 為 key 儲存每個使用者的資料
const userData = {};
const categories = ['餐飲', '交通', '娛樂', '其他'];

// 初始化使用者資料
function initUserData(userId) {
  if (!userData[userId]) {
    userData[userId] = {
      money: [0, 0, 0, 0],
      currentIndex: 0
    };
  }
  return userData[userId];
}

// 取得使用者資料
function getUserData(userId) {
  return initUserData(userId);
}

async function handleText(context) {
  const userText = context.event.text;
  await context.sendText(`你說了:${userText}`);
}

async function handleMoney(context) {
  const userId = context.event.source.userId;
  const data = getUserData(userId);
  data.money[data.currentIndex] = Number(context.event.text) + data.money[data.currentIndex];
  await context.sendText(`${context.event.text} 已記錄，目前${categories[data.currentIndex]}總為: ${data.money[data.currentIndex]}`);
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
  const userId = context.event.source.userId;
  const data = getUserData(userId);
  if (context.event.text === '餐飲') {
    data.currentIndex = 0;
  } else if (context.event.text === '交通') {
    data.currentIndex = 1;
  } else if (context.event.text === '娛樂') {
    data.currentIndex = 2;
  } else if (context.event.text === '其他') {
    data.currentIndex = 3;
  }
  await context.sendText(`你選擇了:${context.event.text}`);
  await context.sendText(`請輸入金額:`);
}

async function showSummary(context) {
  const userId = context.event.source.userId;
  const data = getUserData(userId);
  let summary = '📊 記帳總覽\n\n';
  let total = 0;
  categories.forEach((category, index) => {
    summary += `${category}: ${data.money[index]}\n`;
    total += data.money[index];
  });
  summary += `\n總計: ${total}`;
  await context.sendText(summary);
}

async function clearRecords(context) {
  const userId = context.event.source.userId;
  const data = getUserData(userId);
  data.money = [0, 0, 0, 0];
  data.currentIndex = 0;
  await context.sendText('已清除所有記帳記錄');
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
    // 特殊事件
    route(context => context.event.isFollow, handleFollow),
    route(context => context.event.isSticker, handleSticker),
    route(context => context.event.isImage, handleImage),
    route(context => context.event.isPostback, handlePostback),
    
    // 記帳功能
    text(/^記帳$/i, showMenu),
    text(/^總覽|查看|summary$/i, showSummary),
    text(/^清除|清空|clear$/i, clearRecords),
    text(/^餐飲|交通|娛樂|其他$/i, handleCategory),
    text(/^\d+$/i, handleMoney), // 純數字（金額）
    
    // 問候語
    text(/^hello|hi|你好$/i, async (context) => {
      await context.sendText('你好! 輸入「記帳」開始記帳');
    }),
    
    // 預設處理（放在最後）
    text('*', handleText),
  ]);
};