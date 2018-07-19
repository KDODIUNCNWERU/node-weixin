//生成签名的随机串
let createNonceStr = function () {
    return Math.random().toString(36).substr(2, 15);
};
//生成签名的时间戳
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

module.exports = sign;
