'use strict';
const express = require('express');
const router = express.Router();
const sign = require('../wechat/sign.js');
const request = require('request-promise'); //发送网络请求模块
const url = require('url');
let xml2js = require('xml2js')  //xml2js解析xml
const msg = require('../wechat/msg.js')
// 在“微信公众平台-开发-基本配置”页中获得AppID和AppSecret
const APPID = 'wx29ac82f9baf90e6f'
const APPSECRET = '39095ad49e6239815f6fd1e602ea954c'
const TOKEN = 'fupengfei'

// accessToken和jsapiTicket有效期为7200s
const TASKTIMER = 7200000;
let accessToken;
let jsapiTicket;

/**
 * 获取access_token和jsapiTicket
 */
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

//增加定时任务，刷新accessToken和jsapiTicket
setInterval(function () {
  getAccessToken();
}, TASKTIMER);

/**
 * 返回签名
 *
 * @param {Object} response 返回对象
 * @param {string} url 前端传递的域名用于生成签名
 */
function responseSignature(response, url) {
  /*
   * 签名算法生成格式如下
   * {
   *     jsapi_ticket: 'jsapi_ticket',
   *     nonceStr: '82zklqj7ycoywrk',
   *     timestamp: '1415171822',
   *     url: 'http://example.com',
   *     signature: '1316ed92e0827786cfda3ae355f33760c4f70c1f'
   * }
   */
  let signature = sign(jsapiTicket, url);
  Object.assign(signature, { appId: APPID });
  response.writeHead('200', { 'Content-Type': 'text/plain' });
  response.write(JSON.stringify(signature));
  response.end();
}

// 注册路由选项  
router.get("/jsapiTicket", (req, res) => {
  // 解析url参数
  let params = url.parse(req.url, true).query;
  if (typeof jsapiTicket === 'undefined') {
    // 初始化时没有jsapiTicket，主动获取
    getAccessToken().then(function () {
      responseSignature(res, decodeURIComponent(params.url));
    });
  }
  else {
    responseSignature(res, decodeURIComponent(params.url));
  }

})

// 检验消息来自微信 
router.use("/wx", (req, res) => {
  // 验证服务器信息
  // 解析url参数
  let { signature, timestamp, nonce, echostr } = url.parse(req.url, true).query;
  //将Token，timestamp，nonce按字典排序,排序后链接成一个字符串
  let str = [TOKEN, timestamp, nonce].sort().join("");
  //使用sha1模块进行sha1加密
  let jsSHA = require('jssha');
  let shaObj = new jsSHA(str, 'TEXT');
  let sha1Str = shaObj.getHash('SHA-1', 'HEX');
  //判断加密后的字符串与请求中signature是否相等
  //如果相等返回echostr
  if (sha1Str === signature) {
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
          //event表示事件,
          if (json.xml.MsgType == 'event') {
            var contentArr = [{
              Title: "Node.js 微信自定义菜单",
              Description: "使用Node.js实现自定义微信菜单",
              PicUrl: "http://www.fpfh5.site/images/recording/record.png",
              Url: "http://www.baidu.com"
            }]
            res.send(msg.graphicMsg(json, backTime, contentArr))
            //text表示文字信息
          } else if (json.xml.MsgType == 'text') {
            if (json.xml.Content == 1) {
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
              res.send('success')
            } else {
              //回复公众号的文字信息
              res.send(msg.getTextXml(json, backTime, `你发"${json.xml.Content}"过来干啥？`))
            }
          } else if (json.xml.MsgType == 'image') {
            //回复公众号的图片信息
            res.send(msg.getImageXml(json, backTime))
          } else if (json.xml.MsgType == 'voice') {
            //回复公众号的语音信息
            res.send(msg.getVoiceXml(json, backTime))
          }
        })
      }
    })
    // //将echostr返回给微信服务器
    // res.send(echostr)
  }
  else {
    res.send("wrong")
  }
})

module.exports = router;

