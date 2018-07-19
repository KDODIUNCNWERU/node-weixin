let app = require('../app');
let http = require('http');

let port = normalizePort(process.env.PORT || '3000');   // process.env.PORT 生产环境  production 
app.set('port', port);  //  把port 端口 当前全局变量   当着 app 的中间件   app.use("port")   

let server = http.createServer(app);  //创建HTTP服务

server.listen(port);    // 监听服务

function normalizePort(val) {
  let port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}