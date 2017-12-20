/**
 * 消息中心模块插件
 *   实现与服务器的WebSocket 消息发送与接收
 */
define(function(require, exports, module){
	var $ = require('jquery');
	var serialize = require('@core/serialize');
	var app = null;
	var host_regx = /^([a-z0-9]+):\/\/(.+)$/i;
	var util = require('util');
	//var io = require('@libs/socket.io/socket.io-1.4.5.js');
	require('@libs/socket.io/socket.io-1.4.5.js');
	var io = window.io;
	var isDebug, goParamDebug;

	function define_class(func, proto){
		for (var p in proto){
			if (proto.hasOwnProperty(p)){
				func.prototype[p] = proto[p];
			}
		}
		return func;
	}

	// 支持协议定义
	var hostProtocol = {
		// WebSocket远程连接
		"websocket": define_class(
			function(cfg){
				cfg['force new connection'] = true;
				var self = this;
				self.$link_id = '';
				self.$ready = false;
				self.$queues = [];
				self._events = {};
				self.$needInit = false;

				var socket = io.connect(cfg.url, cfg);

				// 连接成功开始握手
				socket.on('connect', function(){
					socket.emit('initLink', self.$link_id);
					if(self.$needInit) {
						self.emit('mc_reconnect');
						self.$needInit = false;
					}
				});
				// 连接错误时修改就绪状态
				socket.on('connect_error', function(err){
					console.error('mc.websocket error:', err);
					self.emit('mc_connect_error', err);
					self.$ready = false;
					self.$needInit = true;
				});
				// 绑定握手成功处理消息
				socket.on('ackLink', function(){
					if(self.$timer)
					{
						clearInterval(self.$timer);
					}

					self.$timer = setInterval(function () {
						socket.emit('Ping', {
							time: Date.now()
						});
					}, 30 * 1000);

					self.onAckLink.apply(self, arguments);
				});
				socket.on('removeLink', function(){
					self.$link_id = null;
					self.onAckLink.apply(self, [0]);
					self.emit('mc_reconnect');
					self.emit('destroy');
				});
				// 绑定设置客户端Cookie信息
				socket.on('setCookie', self.onSetCookie);
				self.$io = socket;
			},
			{
				// 服务器握手确认消息
				onAckLink: function(link_id, error){
					var self = this;
					var queues = self.$queues;
					if (link_id){
						self.$ready = true;
						self.$link_id = link_id;

						// 发送缓存中的信息
						while (queues.length > 0){
							self.send(queues.shift());
						}
					}else {
						// 连接错误
						var msg;
						var result = {
							'mid': 0,
							'error': error,
							'data': null
						};
						// 触发暂存中的请求错误
						while (queues.length > 0){
							msg = queues.shift();
							if (msg.req){
								result.mid = msg.mid;
								self.emit('message', result);
							}
						}
					}
				},
				// 服务端设置Cookie请求
				onSetCookie: function(cookie, multiple){
					var setCookie = function(cookie){
						var en = encodeURIComponent;
						var text = en(cookie.name) + '=' + en(cookie.value);

						// 先暴力的加上 /
						cookie.path = '/';
						// expires
						if (cookie.expires){
							var date = new Date();
							date.setTime(cookie.expires);
							text += '; expires=' + date.toUTCString();
						}
						// domain
						if (cookie.domain) {
							text += '; domain=' + cookie.domain;
						}
						// path
						if (cookie.path) {
							text += '; path=' + cookie.path;
						}
						// secure
						if (cookie.secure) {
							text += '; secure';
						}
						// httpOnly
						if (cookie.httpOnly) {
							text += '; HttpOnly';
						}

						document.cookie = text;
					}

					if (multiple){
						for (var i=0; i<cookie.length; i++){
							setCookie(cookie[i]);
						}
					}else {
						setCookie(cookie);
					}
				},
				isDown: function(){
					return (this.$io.io.readyState == 'closed');
				},
				connect: function(){
					this.$ready = false;
					this.$io.io.reconnect();
					return this;
				},
				send: function(data){
					if (this.$ready){
						this.$io.send(serialize.encode(data));
					}else {
						this.$queues.push(data);
					}
					return this;
				},
				emit: function(type, data) {
					var cbs = this._events[type];
					if (cbs)
					{
						for (var i=0; i<cbs.length; i++)
						{
							cbs[i].call(window, data);
						}
					}
					return this;
				},
				on: function(type, callback){
					// message
					var self = this;
					if (self._events[type])
					{
						self._events[type].push(callback);
					}
					else
					{
						self._events[type] = [callback];
						self.$io.on(type, function(data){
							data = serialize.decode(data);
							self.emit(type, data);
						});
					}
					return self;
				}
			}
		),
		// Local本地消息
		"local": define_class(
			function(cfg){
				this.$message_cbs = false;
			},
			{
				isDown: function(){ return false; },
				connect: function(){ return this; },
				send: function(data){
					var cbs = this.$message_cbs;
					if (cbs){
						data.rid = data.mid;
						for (var i=0; i<cbs.length; i++){
							cbs[i](data);
						}
					}
					return this;
				},
				on: function(type, callback){
					if (type == 'message'){
						var cbs = this.$message_cbs;
						if (cbs){
							cbs.push(callback);
						}else {
							this.$message_cbs = [callback];
						}
					}
					return this;
				}
			}
		),
		// 静态测试文件消息
		"file": define_class(
			function(cfg){
				// 文件路径
				this.$base = cfg.base;
				this.$message_cbs = false;
			},
			{
				isDown: function(){ return false; },
				connect: function(){ return this; },
				send: function(data){
					// 拼凑静态文件路径
					var url = this.$base + data.uri + '.json';
					var mid = data.mid;
					var cbs = this.$message_cbs;
					$.getJSON(url, function(data){
						// 支持发送多数据 @todo 不太理解？
						data = [data];

						$.each(data, function(idx, val){
							// 拼凑dispatchMessage解析结构
							var item = {
								mid: mid,
								rid: mid,
								data: val
							}
							for (var i=0; i<cbs.length; i++){
								cbs[i](item);
							}
						})
					})
					return this;
				},
				// @todo 要修改不?
				on: function(type, callback){
					if (type == 'message'){
						var cbs = this.$message_cbs;
						if (cbs){
							cbs.push(callback);
						}else {
							this.$message_cbs = [callback];
						}
					}
					return this;
				}
			}
		)
	};

	// 解析uri数据
	function resolve_uri(uri){
		var self = this;
		var maps = self.$uri_maps;
		var list;
		if (maps.hasOwnProperty(uri)){
			uri = maps[uri];
		}else {
			var config = self.$config;
			var key = uri;
			if (uri.charAt(0) != '/'){
				uri = config.uri_prefix + uri;
			}

			// 转换uri到完整的节点
			var item;
			list = self.$prefix;
			for (var i=0; i<list.length; i++){
				item = list[i];
				if (uri.indexOf(item.from) === 0){
					uri = uri.replace(item.from, item.uri);
					break;
				}
			}
			maps[key] = uri;
		}

		// 分析uri结构, 提取remote信息
		list = host_regx.exec(uri);
		if (list){
			return {
				"host": list[1],
				"uri": list[2]
			};
		}
		return false;
	}

	// 获取远程节点对象
	function get_remote(request){
		var self = this;
		var remote;
		var pools = self.$remotes;
		var remotes = self.$config.remotes;
		var name = request.host;

		if (pools.hasOwnProperty(name)){
			// 使用已缓存的连接
			remote = pools[name];
		}else if (remotes && remotes.hasOwnProperty(name)){
			// 使用配置信息创建连接
			var cfg = remotes[name];
			remote = pools[name] = new hostProtocol[cfg.type](cfg);
			remote.on('message', function(message){
				dispatchMessage.call(self, message, name);
			});

			remote.on('destroy', function() {
				delete pools[name];
			});

			if(self.$connectCb)
			{
				remote.on('mc_reconnect', self.$connectCb)
			}
			// 触发错误，所有的callback 都调用。
			remote.on('mc_connect_error', function(err) {
				if(self.$callbacks) {
					for(var cb in self.$callbacks)
					{
						if(self.$callbacks.hasOwnProperty(cb))
						{
							triggerError(self.$callbacks[cb], 500, "系统正在更新，请稍等一分钟");
							delete self.$callbacks[cb];
						}
					}
				}
			});
		}else {
			// 没有找到指定远程节点配置
			return false;
		}

		// 检查连接状态
		if (remote.isDown()){
			remote.connect();
		}
		return remote;
	}

	// 发送消息
	function sendMessage(message){
		var self = this;
		if(goParamDebug)
		{
			if(!message.data)
			{
				message.data = {};
			}

			message.data.__debug__ = true;
		}

		var req = resolve_uri.call(self, message.uri);
		if (!req){
			triggerError(message, 601, "Parse URI Error");
		}else {
			var remote = get_remote.call(self, req);
			if (remote){
				// 判断是否有回调事件
				if (message.callback){
					self.$callbacks[message.mid] = {
						"mid": message.mid,
						"uri": message.uri,
						"time": (new Date()).getTime(),
						"callback": message.callback,
						"param": message.param,
						"request": message.data
					};
				}

				self.$tick[message.mid] = Date.now();
				var User = app.getUser();
				var uid;
				if(User && User.current) {
					uid = User.current.UserId || User.current._id || User.current.userId;
				}
				// 发送消息
				remote.send({
					"type": message.type,
					"mid": message.mid,
					"req": (message.callback ? 1 : 0),
					"uri": req.uri,
					"__uid_4_track": uid || 0,
					"data": message.data
				});
				var hasGroupCollapsed = console.debug && console.groupCollapsed;
				var style = 'color: black';
				if(message.type == 'abort') {
					style = 'background: #222; color: #bada55';
				}

				if(hasGroupCollapsed && isDebug)
				{
					console.groupCollapsed('%c The Sending message :' + req.uri, style);
					console.debug('type is : %s', message.type);
					console.debug('mid is : %d', message.mid);
					console.debug('uri is : %s', req.uri);
					if(message.data) {
						if(message.data.begindate) {
							message.data.__just_for_console_beginYMD = util.date('Y-m-d', message.data.begindate);
						}
						if(message.data.enddate) {
							message.data.__just_for_console_endYMD = util.date('Y-m-d', message.data.enddate);
						}
					}
					console.debug('param is :%o', message.data);
					console.groupEnd();
				}
			}else {
				triggerError(message, 602, "Remote Not Found");
			}
		}
	}

	// 读取消息队列中的数据, 处理每个请求数据
	function processMessage(){
		var self = this;
		var queues = self.$queues;
		while (queues.length){
			sendMessage.call(self, queues.shift());
		}
		self.$processQueueId = 0;
	}

	// 分发处理消息数据
	function dispatchMessage(message, host){
		if (message && 'string' == typeof(message)){
			try {
				message = JSON.parse(message);
			}catch (err){
				app.error({
					"code": 610,
					"message": "Parse Data Error",
					"data": message
				});
			}
		}

		var self = this;
		// 触发监听的回调
		var cb = self.$callbacks[message.rid];

		var hasGroupCollapsed = console.debug && console.groupCollapsed;
		var style = 'background: #18A488; color: white';
		if(cb && cb.aborted) {
			style = 'background: #222; color: #bada55';
		}
		if(hasGroupCollapsed && isDebug) {
			if(!message.error) {
				console.groupCollapsed('%c The received message: ' + message.uri, style);
				if(message.rid && this.$tick[message.rid]) {
					var timeStyle = 'background: #9E7DB4; color: white';
					console.debug('%cSpend time is : %s sec', timeStyle,(Date.now() - this.$tick[message.rid])/1000);
					delete this.$tick[message.rid];
				}
				console.debug('type is : %s', message.type);
				console.debug('mid is : %d', message.rid);
				console.debug('uri is : %s', message.uri);
				if(cb) {
					console.debug('%cThe request param: %o', 'backgroup: orange',cb.request);
				}
				console.debug('the return data is :%o', message.data);
				console.groupEnd();
			}
			else {
				console.debug('The received error message: ' + message.uri);
				app.error({
					"code": message.error.code,
					"message": message.error.message
				});
			}
		}

		if (cb && !cb.aborted){
			delete self.$callbacks[message.rid];
			cb.callback.call(cb, message.error, message.data, cb.param);
		}

		// 触发绑定uri的消息
		if (message.uri){
			var url = host + '://' + message.uri;
			var maps = self.$uri_maps;
			var binds = self.$binds;
			var bind, i;
			for (bind in binds){
				i = maps[bind];
				// uri地址匹配, 完全匹配或部分uri匹配
				if (i == url || (url.charAt(i.length) == '/' && url.indexOf(i) === 0)){
					triggerCallback(binds, bind, message.error, message.data);
				}
			}
		}
	}

	// 标准回调函数触发错误
	function triggerError(listener, code, message){
		if (listener && listener.callback){
			listener.callback.call(
				listener, {"code": code, "message": message}, null
			);
		}
	}

	// 触发绑定的事件函数
	function triggerCallback(binds, uri, error, data){
		var cb;
		var events = binds[uri];
		for (var i=0; i<events.length; i++){
			cb = events[i];
			if (++cb.count === 0){
				// 回调计数达到限制, 从绑定记录重删除
				events.splice(i--, 1);
			}
			// 回调
			cb.callback.call(cb, error, data);
		}
		// 检查是否回调列表为空列表
		if (events.length === 0){
			delete binds[uri];
		}
	}

	// 消息中心核心模块
	function MessageCenter(config_path){
		var self = this;
		// 模块配置
		self.$config = util.extend(1, {
			"uri_prefix": "/msg/",
			"prefix":{},
			"remotes":{}
		}, app.config(config_path));

		// 远程节点
		self.$remotes = {};

		// 事件绑定记录
		self.$binds = {};

		// uri映射表
		self.$uri_maps = {};

		// 请求等待队列
		self.$queues = [];

		// 回调请求数据
		self.$callbacks = {};

		// 唯一的消息编号
		self.$message_id = 0;

		// 消息发送计时器ID
		self.$processQueueId = 0;

		// 消息时间记录.
		self.$tick = {};

		// 读取系统配置数据节点
		var prefix = self.$prefix = [];
		var list = self.$config.prefix;
		if (list){
			var key, val, kf, vf;
			for (key in list){
				val = list[key];
				if (key.charAt(0) != '/'){
					key = '/' + key;
				}
				kf = (key.substr(-1) == '/');
				vf = (val.substr(-1) == '/');
				if (!kf && vf){
					key += '/';
				}
				if (!vf && kf){
					val += '/';
				}
				prefix.push({'from': key, 'uri': val});
			}
			// 排序节点
			prefix.sort(function(a,b){
				if (a.from.length == b.from.length){
					return (a.from > b.from);
				}else {
					return (a.from.length <= b.from.length);
				}
			});
		}
	}
	define_class(MessageCenter, {
		on: function(uri, callback, param, count){
			var self = this;
			var binds = self.$binds;
			var list = binds[uri];
			if (!list){
				if (!resolve_uri.call(self, uri)){
					// 不能解析uri记录不能绑定
					return self;
				}
				list = binds[uri] = [];
			}
			list.push({
				"uri": uri,
				"callback": callback,
				"param": param,
				"count": count || 0
			});
			return self;
		},
		once: function(uri, callback, param){
			return this.on(uri, callback, param, -1);
		},
		off: function(uri, callback){
			var binds = this.$binds;
			var list = binds[uri];
			if (list && list.length){
				var i = list.length;
				if (callback){
					for (;i>0;){
						if (list[--i].callback === callback){
							list.splice(i, 1);
						}
					}
					if (list.length === 0){
						delete binds[uri];
					}
				}else {
					delete binds[uri];
				}
			}
			return this;
		},
		send: function(uri, data, callback, param){
			if (!uri){
				return 0;
			}

			if (util.isFunc(data)){
				param = callback;
				callback = data;
				data = null;
			}

			// 消息存入待发送消息队列
			var self = this;
			param = {
				"type": 'message',
				"mid": ++self.$message_id,
				"uri": uri,
				"data": data || null,
				"callback": callback || null,
				"param": param || null
			};
			self.$queues.push(param);

			if (!self.$processQueueId){
				self.$processQueueId = setTimeout(
					function(){processMessage.call(self)}, 0
				);
			}

			return param.mid;
		},
		abort: function(message_id, silent){
			var self = this;
			// 查找消息队列中是否有未发送的消息
			var queues = self.$queues;
			for (var id=queues.length; --id>=0;){
				if (queues[id].mid < message_id){
					break;
				}else if (queues[id].mid == message_id){
					queues.splice(id, 1);
					return self;
				}
			}
			// 查找已发送的回调请求
			if (self.$callbacks && self.$callbacks[message_id]){
				var cb = self.$callbacks[message_id];
				self.$callbacks[message_id].aborted = true;
				//delete self.$callbacks[message_id];

				if (!silent){
					// 触发回调函数
					triggerError(cb, 600, "User Abort");
				}

				// 发送取消消息
				sendMessage.call(
					self, {"mid": cb.mid, "uri": cb.uri, "type":"abort"}
				);
			}
		},
		emit: function(uri, error, data){
			var self = this;
			var binds = self.$binds;
			for (var i in binds){
				// uri地址匹配, 完全匹配或部分uri匹配
				if (i == uri || (uri.charAt(i.length) == '/' && uri.indexOf(i) === 0)){
					triggerCallback(binds, i, error, data);
				}
			}
			return self;
		},
		onReconnect: function(cb) {
			this.$connectCb = cb;
		}
	});

	// 插件初始化方法
	exports.plugin_init = function(pubjs, next){
		app = pubjs;
		goParamDebug = ~location.href.indexOf('_go_query_param_debug_');
		isDebug = goParamDebug || app.config('app/isDebug');
		pubjs.mc = new MessageCenter('app/mc');
		window.pubjs = pubjs;
		next();
	}
});