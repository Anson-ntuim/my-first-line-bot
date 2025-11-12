const { router, text, route, matchKeywords, sticker } = require('bottender');

async function handleText(context){
  const userText = context.event.text;
  return context.sendText(`你剛剛說${userText}`)
}

async function handleSticker(context){
  return context.sendText("好可愛的貼圖")
}

module.exports = async function App(){
  return router([
    text("*", handleText),
    sticker("*", handleSticker),
  ])
}