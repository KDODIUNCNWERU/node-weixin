一、准备工作

1.在微信公众平台申请测试账号，并设置好好 JS 接口安全域名

2.验证服务器信息

![1531734590_1_](/uploads/d5160a21522d6697f649c6e0f3ea15b0/1531734590_1_.png)
![微信截图_20180716122946](/uploads/d6810402e311f1b6d4a97e6b6956ac5d/微信截图_20180716122946.png)

```javascript
router.use("/wx", (req, res) => {
  let { signature, timestamp, nonce, echostr } = url.parse(req.url, true).query;
  //将Token，timestamp，nonce按字典排序,排序后链接成一个字符串
  let str = [TOKEN, timestamp, nonce].sort().join("");
  //使用sha1模块进行sha1加密
  let jsSHA = require('jssha');
  let shaObj = new jsSHA(str, 'TEXT');
  let sha1Str = shaObj.getHash('SHA-1', 'HEX');
  if (sha1Str === signature) {
    //将echostr返回给微信服务器
    res.send(echostr)
  }
  else {
    res.send("wrong")
  }
})
```

二、微信的签名算法

使用微信 sdk 必须自己实现微信的签名算法,大概需要4个步骤：

1.获取 access_token；
```javascript
function getAccessToken() {
  return request(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${APPSECRET}`)
    .then(function (body) {
      accessToken = JSON.parse(body).access_token;
    })
```
2.根据 access_token 获取 jsapi_ticket
```javascript
function getAccessToken() {
  return request(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${APPSECRET}`)
    .then(function (body) {
      accessToken = JSON.parse(body).access_token;
      return request(`https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`);
    })
    .then(function (body) {
      jsapiTicket = JSON.parse(body).ticket;
    });
}
```

3.根据 appId(公众号唯一id)、noncestr(随机字符串)、timestamp(时间戳)、url(当前页面完整url,不包括#aaa=bbb) 通过sha1算法签名

```javascript

let createNonceStr = function () {
    return Math.random().toString(36).substr(2, 15);
};
let createTimestamp = function () {
    return parseInt(new Date().getTime() / 1000) + '';
};
//对所有待签名参数按照字段名的ASCII 码从小到大排序（字典序）后，使用URL键值对的格式（即key1 = value1 & key2=value2…）拼接成字符串string
let raw = function (args) {
    let keys = Object.keys(args);
    keys = keys.sort()
    let string = '';
    keys.forEach(k => {
        string += '&' + k + '=' + args[k];
    })
    string = string.substr(1);
    return string;
};
//生成签名
const sign = function (jsapi_ticket, url) {
    let ret = {
        jsapi_ticket: jsapi_ticket,
        noncestr: createNonceStr(),
        timestamp: createTimestamp(),
        url: url
    };
    const string = raw(ret);
    const jsSHA = require('jssha');
    const shaObj = new jsSHA(string, 'TEXT');
    ret.signature = shaObj.getHash('SHA-1', 'HEX');
    return ret;
};
```
4.将信息返回给前端 ， 设置wx.config。

由于获取access_token 和 jsapi_ticket的接口都有访问限制，所以明确指出需要第三方做缓存处理。
```javascript

//增加定时任务，刷新accessToken和jsapiTicket
setInterval(function () {
  getAccessToken();
}, 7200000);
```

三、消息管理
    当用户发送消息给公众号时（或某些特定的用户操作引发的事件推送时），会产生一个POST请求，开发者可以在响应包（Get）中返回特定XML结构，来对该消息进行响应。
    消息推送也是微信公众号开发更为有趣的功能，涉及到文本消息、图片消息、语音消息、视频消息、音乐消息以及图文消息。
    
1.捕获消息信息
    微信消息产生的请求方式为 POST，然后监听这个接口，得到的数据是xml的数据，解析XML，这里使用了 第三方的包 xml2js(npm install xml2js )：
```javascript
let xml = '' //存储将要回复给公众号的文字
    //接收post内容
    req.on('data', chunk => {
      xml += chunk
    })
    //接收结束
    req.on('end', () => {
      //将接受到的xml数据转化为json
      if (xml) {
        xml2js.parseString(xml, { explicitArray: false }, function (err, json) {
          let backTime = parseInt(new Date().valueOf() / 1000) //创建发送时间，整数
          console.log(json)
        })
      }
    })
```
2.根据得到的消息类型（MsgType），可以进行不同的回复
```javascript
//event表示事件,
  if (json.xml.MsgType == 'event') {
    // EventKey是在自定义菜单的时候定义的事件名称
    if (json.xml.EventKey == 'clickEvent') {
      res.send(msg.getTextXml(json, backTime, '你戳我干啥...'))
    }
    //text表示文字信息
  } else if (json.xml.MsgType == 'text') {
    //回复公众号的文字信息
    if (json.xml.Content == 1) {
      var contentArr = [{
        Title: "Node.js 微信自定义菜单",
        Description: "使用Node.js实现自定义微信菜单",
        PicUrl: "http://www.fpfh5.site/images/recording/record.png",
        Url: "http://www.baidu.com"
      }]
      res.send(msg.graphicMsg(json, backTime, contentArr))
    } else {
      res.send(msg.getTextXml(json, backTime, `你发"${json.xml.Content}"过来干啥？`))
    }
  } else if (json.xml.MsgType == 'image') {
    //回复公众号的图片信息
    res.send(msg.getImageXml(json, backTime))
  } else if (json.xml.MsgType == 'voice') {
    //回复公众号的语音信息
    res.send(msg.getVoiceXml(json, backTime))
  }
```
其中ToUserName是接受者的openid，FromUserName是发送者的openid，CreateTime就是一个整型的时间戳。MsgType就是消息类型，一般有文本（text），图片（image），语音（voice），视频（video），小视频（shortvideo），地理位置（location）以及链接消息（link）。

3.消息模板，消息接口收到消息时，与回复消息时，ToUserName和FromUserName的位置互换。
    
```javascript
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
exports.getTextXml = function(json, backTime, word) {
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
exports.getImageXml = function(json, backTime) {
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
exports.getVoiceXml = function(json, backTime) {
    let backXML = `<xml>
    <ToUserName><![CDATA[${json.xml.FromUserName}]]></ToUserName>
    <FromUserName><![CDATA[${json.xml.ToUserName}]]></FromUserName>
    <CreateTime>${backTime}</CreateTime>
    <MsgType><![CDATA[voice]]></MsgType>
    <Voice><MediaId><![CDATA[${json.xml.MediaId}]]></MediaId></Voice>
  </xml>`
    return backXML;
};
```

4.客服回复消息
```javascript
request({
    method: 'POST',
    uri: `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${accessToken}`,
    json: true,
    body:{
      "touser": json.xml.FromUserName,
      "msgtype": "text",
      "text": {
        "content": "Hello World"
      }
    }
})
```
github地址奉上：https://github.com/KDODIUNCNWERU/node-weixin
请帮我start一下