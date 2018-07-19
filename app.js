const express = require('express');
const path = require('path');   // nodeJS  的 模块
const logger = require('morgan');    // 日志处理 
const cookieParser = require('cookie-parser');   //  处理cookies 
const bodyParser = require('body-parser');   //  处理 post 请求 body 的参数  method="post"

const index = require('./routes/index');   // 路由模块的文件 

const app = express();
app.use(logger('dev'));   // logger  打印日志 dev 开发环境 
app.use(bodyParser.json());  // ajax  post  请求  $.ajax(url,postData,{params} )
app.use(bodyParser.urlencoded({ extended: false })); // urlencoded  表单提交的数据 给后台 
app.use(cookieParser());  //  设置 cookies 中间件 
app.use(express.static(path.join(__dirname, 'public')));   // 设置 express 的静态文件 路由  

app.use('/', index);  // 设置 路由的中间件  

// 捕获404错误
app.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

module.exports = app;
