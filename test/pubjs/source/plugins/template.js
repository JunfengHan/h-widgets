define(function(require, exports){
	var $ = require('jquery');
	var cache = {};
	var load_count = 0;
	var app = null;

	// 简单的模板引擎
	function template(){
		var tab = {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'};
		var text_reg = new Array(/[\'\\]/g, /\r/g, /\n/g);
		var code_reg = /<\%\s((.|\n)*?) ?\%>/mg;
		var esc_reg  = /[&<>"]/g;
		var var_reg  = /<%(=|#)(.*?)\%>/g;
		var exp_reg  = /(\.)?([_\$a-z][_\$\w]*)/ig;
		var reserve = '=break=case=catch=continue=debugger=default=delete=do=else=false=finally=for=function=if'+
					'=in=instanceof=new=null=return=switch=this=throw=true=try=typeof=var=void=while=with'+
					'=abstract=boolean=byte=char=class=const=double=enum=export=extends=final=float=goto'+
					'=implements=import=int=interface=long=native=package=private=protected=public=short'+
					'=static=super=synchronized=throws=transient=volatile'+
					'=arguments=let=yield=Math=Date=';
		var var_list = '';

		function esc_rp(m){ return tab[m]; }
		function esc(s, html){
			if (s===null) {return '';}
			return (!html || typeof(s) != 'string') ? s : s.replace(esc_reg, esc_rp);
		}

		function make_var_list(code){
			var n,m;
			while ((m = exp_reg.exec(code)) != null){
				if (m[1]) { continue; }
				n = '=' + m[2] + '=';
				if (reserve.indexOf(n) != -1) { continue; }
				if (var_list.indexOf(n) != -1) { continue; }
				var_list += n.substr(1);
			}
		}

		function code(buf, s){
			var pos = 0;
			var m, t;
			while ((m = code_reg.exec(s)) != null) {
				t = s.substring(pos, m.index);
				pos = m.index + m[0].length;
				if (t) { this.VAR(buf, t); }
				if (m[1]){
					buf.push(m[1]);
					make_var_list(m[1]);
				}
			}
			s = pos ? s.substr(pos) : s;
			this.VAR(buf, s);
		}

		function variable(buf, s){
			if (!s) { return; }
			var pos = 0;
			var m, t;
			var code = '_+=';
			while ((m = var_reg.exec(s)) != null) {
				t = s.substring(pos, m.index);
				pos = m.index + m[0].length;
				if (t) {code += text(t);}
				make_var_list(m[2]);
				code += 'this.e(' + m[2] + ','+(m[1] == '#'?1:0)+')+';
			}
			t = pos === 0 ? s : s.substr(pos);
			if (t) {code += text(t, 1);}
			buf.push(code.substr(0, code.length-1) + ';');
		}

		function text(s){
			return "'" + s.replace(text_reg[0], '\\$&').replace(text_reg[1], '\\r').replace(text_reg[2], '\\n\\\n') + "'+";
		}

		function set(name, val){
			this.$[name] = val;
		}
		function run(){
			return this.render(this.$);
		}

		function K(){
			this.cache = {};
		}
		K.prototype = {
			version: '0.0.1',
			config: function(){
			},
			clear: function(){
				this.cache = {};
				return this;
			},
			parse: function(id, s){
				if (Object.hasOwnProperty.call(this.cache, id)){
					return this.cache[id];
				}
				this.cache[id] = {
					$: {},
					e: this.ESC,
					set: set,
					run: run,
					render: this.convert(s)
				};
				return this.cache[id];
			},
			convert: function(s){
				var buf = [];
				var_list = 'var _=';
				buf.push("with($){");
				this.CODE(buf, s);
				buf.push("} return _;");
				buf.unshift(var_list + '"";');
				/*jshint evil:true */
				try {
					return new Function('$', buf.join(''));
				} catch (e) {
					app.log("Template Error!", buf.join(''), buf);
					throw e;
				}
				/*jshint evil:false */
			},
			$:{},
			set: set,
			render: function(id, env){
				if (!Object.hasOwnProperty.call(this.cache, id)) {return false;}
				var data = $.extend(true,{},this.$,env);
				return this.cache[id].render(data);
			},
			CODE: code,
			VAR: variable,
			ESC: esc
		}

		return new K();
	}

	// 模版引擎实例对象
	var engine = exports.engine = template();

	// 替换语言标记
	function lang_replace(full, text){
		return LANG(text);
	}

	var CONFIG = {};
	exports.setup = function(config){
		for (var i in config){
			CONFIG[i] = config[i];
		}
		return this;
	}

	var EVENTS = {};
	exports.on = function(event, callback, context){
		var queue = EVENTS[event] = EVENTS[event] || [];
		queue.push([callback, context]);
		return this;
	}
	/**
	 * 加载指定位置的模版文件
	 * @param  {String}   id <可选> 模版文件名称, 默认为当前模块名, 并从模块文件所在目录加载,
	 *                       给一个斜杆开头的字符串, 可以加载任何路径的模版, 模版文件必须为html扩展名
	 * @param  {Function} callback <可选> 加载回调函数
	 * @param  {Object}   context  <可选> 回调函数作用域对象
	 * @return {Bool}      返回一个加载状态, true表示已加载, false表示正在加载
	 */
	exports.load = function(id, callback, context){
		if (!id){
			id = app && app.config('router/current_module') || '';
		}
		var item = cache[id];
		if (item === true){
			if (callback){
				callback.call(context || window, id, 0, load_count);
			}
			return true;
		}

		if (item){
			item.queue.push({'cb':callback, 'ct':context});
		}else {
			var file;
			if (/\.html$/.test(id)){
				file = id;
			}else {
				file = id + '.html';
			}
			if (file.charAt(0) != '/'){
				file = (app && app.config('template_base') || '') + file;
			}
			item = cache[id] = {
				'id':id,
				'url':file,
				'queue':[{'cb':callback, 'ct':context}]
			};

			load_count++;
			$.ajax(file, {
				success: onLoadSuccess,
				error: onLoadError,
				context: item
			});
		}
		return false;
	};
	// 模版文件加载完成解析模版文件模块
	function onLoadSuccess(tpl){
		var item = this;
		var tag  = /<!--\[\[ ([a-z0-9_]+) \]\]-->(?:\r\n|\n)?/ig;
		var lang = /\{\% (.+?) \%\}/g;
		var base = item.id + '/';
		var m;

		while ((m = tag.exec(tpl)) != null){
			var pos = tpl.lastIndexOf('<!--[[ /' + m[1] + ' ]]-->');
			if (pos > tag.lastIndex){
				if (tpl.charAt(pos-1)== '\n'){
					if (tpl.charAt(--pos-1)== '\r') {pos--;}
				}
				engine.parse(
					base + m[1],
					tpl.substring(tag.lastIndex, pos).replace(lang, lang_replace)
				);
				tpl.lastIndex = pos + 13;
			}
		}

		runCallback(this, 1);
	}
	// 加载模版文件错误处理
	function onLoadError(){
		runCallback(this, -1);
	}
	function runCallback(item, statue){
		load_count--;
		cache[item.id] = true;
		var m;
		while (m = item.queue.shift()){
			if (typeof(m.cb) == 'function'){
				m.cb.call(m.ct || window, item.id, statue, load_count);
			}
		}
		// 回调绑定事件
		if (m = EVENTS.template_loaded){
			for (var i=0; i<m.length; i++){
				m[i][0].call(m[i][1] || window, item.id, statue, load_count);
			}
		}
	}

	// 检查当前是否正在加载文件
	exports.isLoading = function(){
		return (load_count > 0);
	}

	/**
	 * 格式化模版资料
	 * @param  {String} id   <可选> 模版分块ID, 默认为当前动作名, 可以指定模块的斜杆(/)开头绝对地址
	 * @param  {Object} data <可选> 模版参数
	 * @return {String}      返回渲染后的HTML字符串代码 / false 表示没有找到指定的模版
	 */
	exports.parse = function(id, data){
		if (!id){
			id = app && app.config('router/current_action') || '';
		}
		if (id && id.indexOf('/') === -1){
			id = (app && app.config('router/current_module') || '') + '/' + id;
		}
		if (id){
			return engine.render(id, data);
		}else {
			return '';
		}
	}


	// 渲染
	exports.appendTo = function(dom, id, data){
		var html = this.parse(id, data);
		if (html){
			dom.append(html);
		}
	}

	// 渲染
	exports.setTo = function(dom, id, data){
		var html = this.parse(id, data);
		if (html){
			dom.html(html);
		}
	}

	exports.set = function(name, value){
		this.engine.set(name, value);
	}

	exports.plugin_init = function(pubjs, callback){
		app = pubjs;
		app.template = exports;
		callback();
	}
});