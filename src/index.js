const { router, text, line, route } = require('bottender/router');

// ===== 關鍵字定義 =====
const keywords = {
  course: ['課程', 'course'],
  homework: ['作業', 'homework'],
  menu: ['主選單', 'menu', '選單'],
};

function matchKeywords(keywordList) {
  return function(context) {
    if (!context.event.isText) return false;
    const text = context.event.text.toLowerCase();
    return keywordList.some(function(keyword) {
      return text.includes(keyword);
    });
  };
}

// ===== 檢查事件類型的函數 =====
function isSticker(context) {
  return context.event.isSticker;  // ✅ 檢查是否為貼圖
}

function isImage(context) {
  return context.event.isImage;  // ✅ 檢查是否為圖片
}

function isVideo(context) {
  return context.event.isVideo;  // ✅ 檢查是否為影片
}

function isAudio(context) {
  return context.event.isAudio;  // ✅ 檢查是否為音訊
}

function isLocation(context) {
  return context.event.isLocation;  // ✅ 檢查是否為位置
}

function isFollow(context) {
  return context.event.isFollow;  // ✅ 檢查是否為加好友
}

function isUnfollow(context) {
  return context.event.isUnfollow;  // ✅ 檢查是否為封鎖
}

function isJoin(context) {
  return context.event.isJoin;  // ✅ 檢查是否為加入群組
}

function isPostback(context) {
  return context.event.isPostback;  // ✅ 檢查是否為 postback
}

// ===== 歡迎訊息 =====
async function Welcome(context) {
  await context.sendText('歡迎！我是課程助教 Bot 🤖');
  await ShowMainMenu(context);
}

// ===== 主選單 =====
async function ShowMainMenu(context) {
  console.log('ShowMainMenu called!');
  await context.reply([
    {
      type: 'text',
      text: '請選擇功能：',
      quickReply: {
        items: [
          {
            type: 'action',
            action: { type: 'message', label: '📚 課程', text: '課程' },
          },
          {
            type: 'action',
            action: { type: 'message', label: '📝 作業', text: '作業' },
          },
          {
            type: 'action',
            action: { type: 'message', label: '💡 關於我', text: '關於' },
          },
        ],
      },
    },
  ]);
}

// ===== 課程資訊 =====
async function ShowCourse(context) {
  await context.sendButtonTemplate('Web Programming', {
    text: '完整的前端開發訓練',
    actions: [
      { type: 'message', label: '課程大綱', text: '課程大綱' },
      { type: 'message', label: '上課時間', text: '時間' },
      { type: 'message', label: '返回選單', text: '主選單' },
    ],
  });
}

// ===== 作業資訊 =====
async function ShowHomework(context) {
  await context.sendText(
    '📝 作業說明\n\n' +
    '共 7 次個人作業\n' +
    '每次作業佔 10%\n' +
    '遲交打 8 折'
  );
}

// ===== 關於資訊 =====
async function ShowAbout(context) {
  await context.sendText(
    `我是課程助教 Bot 🤖\n\n` +
    `可以幫你查詢課程、作業等資訊\n\n` +
    `輸入「主選單」查看所有功能`
  );
}

// ===== 處理貼圖 =====
async function HandleSticker(context) {
  // 不直接回傳貼圖，因為 Bot 可能沒有權限使用該貼圖包
  // 改為發送文字訊息
  await context.sendText('可愛的貼圖！😊');
}

// ===== 處理圖片 =====
async function HandleImage(context) {
  await context.sendText('謝謝你的圖片！📷');
}

// ===== 處理位置 =====
async function HandleLocation(context) {
  const location = context.event.location;
  await context.sendText(
    `收到位置資訊：\n` +
    `地點：${location.title}\n` +
    `地址：${location.address}`
  );
}

// ===== 處理 Postback =====
async function HandlePostback(context) {
  const data = context.event.postback.data;
  await context.sendText(`收到按鈕點擊: ${data}`);
}

// ===== 預設回應 =====
async function DefaultResponse(context) {
  console.log('DefaultResponse called!');
  console.log('Context event:', context.event);
  await context.sendText('試試看輸入：課程、作業、主選單');
  console.log('DefaultResponse completed');
}

// ===== 主路由 =====
module.exports = function App() {
  return router([
    // 特殊事件（用 route + 檢查函數）
    route(isFollow, Welcome),              // ✅ 加好友
    route(isSticker, HandleSticker),       // ✅ 貼圖
    route(isImage, HandleImage),           // ✅ 圖片
    route(isLocation, HandleLocation),     // ✅ 位置
    route(isPostback, HandlePostback),     // ✅ Postback
    
    // 文字訊息（用 text 或 route + matchKeywords）
    route(matchKeywords(keywords.course), ShowCourse),
    route(matchKeywords(keywords.homework), ShowHomework),
    route(matchKeywords(keywords.menu), ShowMainMenu),
    text(/關於|about/i, ShowAbout),
    
    // 預設回應（處理所有文字）
    route(function(context) {
      console.log('Checking DefaultResponse route, isText:', context.event.isText);
      return context.event.isText;
    }, DefaultResponse),
  ]);
};