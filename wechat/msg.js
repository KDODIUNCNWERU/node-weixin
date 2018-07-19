'use strict'
//回复图文消息
exports.graphicMsg = function (json, backTime, contentArr) {
    let content = contentArr.map(item => `<item>
        <Title><![CDATA[${item.Title}]]></Title>
        <Description><![CDATA[${item.Description}]]></Description>
        <PicUrl><![CDATA[${item.PicUrl}]]></PicUrl>
        <Url><![CDATA[${item.Url}]]></Url>
    </item>`)
    content = content.join('')
    let backXML = `<xml>
    <ToUserName><![CDATA[${json.xml.FromUserName}]]></ToUserName>
    <FromUserName><![CDATA[${json.xml.ToUserName}]]></FromUserName>
    <CreateTime>${backTime}</CreateTime>
    <MsgType><![CDATA[news]]></MsgType>
    <ArticleCount>${contentArr.length}</ArticleCount>
    <Articles>${content}</Articles>
  </xml>`
    return backXML;
}

//回复文本消息
exports.getTextXml = function (json, backTime, word) {
    let backXML = `<xml>
    <ToUserName><![CDATA[${json.xml.FromUserName}]]></ToUserName>
    <FromUserName><![CDATA[${json.xml.ToUserName}]]></FromUserName>
    <CreateTime>${backTime}</CreateTime>
    <MsgType><![CDATA[text]]></MsgType>
    <Content><![CDATA[${word}]]></Content>
  </xml>`
    return backXML;
};
//回复图片消息
exports.getImageXml = function (json, backTime) {
    let backXML = `<xml>
    <ToUserName><![CDATA[${json.xml.FromUserName}]]></ToUserName>
    <FromUserName><![CDATA[${json.xml.ToUserName}]]></FromUserName>
    <CreateTime>${backTime}</CreateTime>
    <MsgType><![CDATA[image]]></MsgType>
    <Image><MediaId><![CDATA[${json.xml.MediaId}]]></MediaId></Image>
  </xml>`
    return backXML;
};
// /回复语音消息
exports.getVoiceXml = function (json, backTime) {
    let backXML = `<xml>
    <ToUserName><![CDATA[${json.xml.FromUserName}]]></ToUserName>
    <FromUserName><![CDATA[${json.xml.ToUserName}]]></FromUserName>
    <CreateTime>${backTime}</CreateTime>
    <MsgType><![CDATA[voice]]></MsgType>
    <Voice><MediaId><![CDATA[${json.xml.MediaId}]]></MediaId></Voice>
  </xml>`
    return backXML;
};