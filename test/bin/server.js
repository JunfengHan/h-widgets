function getContentType( filePath ){
	var contentType = "";
	var ext = libPath.extname( filePath );
	switch( ext ){
		case ".html":
			contentType = "text/html; charset=utf-8";
		break;
		case ".js":
			contentType = "text/javascript; charset=utf-8";
		break;
		case ".css":
			contentType = "text/css; charset=utf-8";
		break;
		case ".gif":
			contentType = "image/gif";
		break;
		case ".jpg":
			contentType = "image/jpeg";
		break;
		case ".png":
			contentType = "image/png";
		break;
		case ".ico":
			contentType = "image/icon";
		break;
		default:
			contentType = "application/octet-stream";
	}
	return contentType; //返回内容类型字符串
}

function createServerCb( req, res ) {
	var reqUrl = req.url;
	console.log( 'request:  ', reqUrl );

	var pathName = libUrl.parse( reqUrl ).pathname;

	// 强行指定首页
	if (pathName === '/') {
		pathName = '/test/index.html';
	}

	var filePath = libPath.join(process.cwd(), pathName);

	console.log( 'read file:', filePath.replace(/\\/g, '/') );
	//判断文件是否存在
	libFs.exists( filePath, function(exists){
		if(exists){//文件存在
			//在返回头中写入内容类型
			res.writeHead(200, {"Content-Type": getContentType(filePath) });
			//创建只读流用于返回
			var stream = libFs.createReadStream(filePath, {flags : "r", encoding : null});
			//指定如果流读取错误,返回404错误
			stream.on("error", function() {
				res.writeHead(404);
				res.end("<h1>404 Read Error</h1>");
			});
			//连接文件流和http返回流的管道,用于返回实际Web内容
			stream.pipe(res);
		} else {
			res.writeHead(404);
			res.end("<h1>404 Read Error</h1>");
			console.log('file not found: ' + filePath);
		}
	});
}
console.time('[WebSvr][Start]');
var libUrl = require('url');
var libPath = require('path');
var libFs = require('fs');
var libHttp = require('http');
var WebSvr = libHttp.createServer(createServerCb);
// 基于项目根路径
process.chdir('../');

WebSvr.listen(777, function() {
	//向控制台输出服务启动的信息
	console.log('[WebSvr][Start] running at http://127.0.0.1:777/');
	//结束服务启动计时器并输出
	console.timeEnd('[WebSvr][Start]');
});
