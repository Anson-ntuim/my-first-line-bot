const { router, text, route } = require('bottender/router');

async function handleText(context){
  const userText = context.event.text;
  await context.sendText(`你剛剛說${userText}`);
}

async function handleSticker(context){
  await context.sendText("好可愛的貼圖");
}

module.exports = function App(){
  return router([
    text("*", handleText),
    route((context) => context.event.isSticker, handleSticker),
  ]);
}