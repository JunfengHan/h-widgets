define(function(require, exports){
	var $ = require('jquery');
	var pubjs = require('../core/pub');
	var util = require('../core/util');
	var view = require('./view');
	var input = require('./common/input');
	var plugin_drag = require('@plugins/drag');
	var maxZIndex = 1000;

	var DOCUMENG = document;
	var BODY_ELEMENT = DOCUMENG.body;
	var DOC_ELEMENT  = DOCUMENG.documentElement;
	var BODY_BOUND = (DOCUMENG.compatMode === "CSS1Compat" ? DOC_ELEMENT : BODY_ELEMENT);
	var DIALOGCOUNT = 0;	// 弹层数量

	var Base = view.container.extend({
		init: function(config, parent){
			config = pubjs.conf(config, {
				'style': {
					"layoutClass":"",
					// 顶部标题与关闭按钮区域样式
					"headClass":"",
					// 内容区域样式
					"bodyClass":"",
					// 控制栏区域样式
					"footClass":"",
					// 关闭小按钮
					"closeClass":""
				}
				,'target': pubjs.DEFAULT_POPUP_CONTAINER
				// 允许显示的按钮
				// 默认只有确定与取消两个按钮。
				// 更多的按钮需要在buttonConfig中添加相应的设置
				,"buttons":["cancel", "ok"]
				,"buttonConfig":{
					// 确定按钮样式
					"ok": {
						"type":"button"
						,"layout":null
						,"value":LANG("保存")
						,"class":"btn btn-success"
						,"width": 100
						,"attr":{"data-action":"onOk"}
						,"events":"click"
					}
					// 取消按钮的样式
					,"cancel": {
						"type":"button"
						,"layout":null
						,"value":LANG("取消")
						,"class":"btn btn-link"
						,"width": 100
						,"attr":{"data-action":"onCancel"}
						,"events":"click"
					}
					// 其他按钮的样式
					,"other": {
						"type":"button"
						,"layout":null
						,"value":LANG("其他")
						,"class":"btn btn-primary"
						,"width": 100
						,"attr":{"data-action":"onOther"}
						,"events":"click"
					}
				}
				// 按钮点击通过事件发送
				,"buttonEvent":false
				// 显示标题
				,"showHead": true
				// 弹出层标题
				,"title":null
				// 显示底部
				,"showFoot": true
				// 显示关闭按钮
				,"showClose": true
				// 构建后自动显示
				,"autoShow": false
				// 容器宽度
				,"width":350
				// 容器高度
				,"height":null
				// 是否带遮罩
				,"mask":1
				// 窗口位置。auto<自动>|Object<具体设置>
				,"position":"auto"
				// 不发送事件
				,"silence":true
				// 是否可以拖拽
				,"drag": false
				// 禁止页面滚动
				,"stopPageScroll": true
				// 滚动条监听时间
				,"watch": 200
				// 是否有滚动条
				,"hasScroll": true
				// 尺寸大小对应表
				,"sizeDimension": {
					's': {'width': 550, 'minHeight': 400, 'maxHeight': 600},
					'm': {'width': 850, 'minHeight': 400, 'maxHeight': 750},
					'l': {'width': 1000, 'minHeight': 400, 'maxHeight': 750, 'height': 750},
					'xl': {'width': 1200, 'minHeight': 400, 'maxHeight': 750, 'height': 750},
					'2xl': {'width': 1350, 'minHeight': 400, 'maxHeight': 750, 'height': 750}
				}
				// 尺寸:
				// 小: 's' or 'small';
				// 中: 'm' or 'medium';
				// 大: 'l' or 'large';
				,"size": 'm'
				,"hasFocusFirstInput": true // 默认聚焦到第一个text的input
			});

			var self = this;
			self.$isShow = false;
			self.$mask = null;
			self.$isMaskShow = false;
			self.Super('init', arguments);
		},
		afterBuild: function(){
			var self = this;
			var c = self.getConfig();
			var el = self.$el = self.getDOM();
			self.addClass('M-dialog');

			if(c.style.layoutClass){
				self.addClass(c.style.layoutClass);
			}

			var styles = c.style;
			var doms = self.$doms = {
				'head': $('<div class="M-dialogHead" />').addClass(styles.headClass).appendTo(el),
				'body': $('<div class="M-dialogBody" />').addClass(styles.bodyClass).appendTo(el),
				'foot': $('<div class="M-dialogFoot" />').addClass(styles.footClass).appendTo(el)
			};

			if (c.showClose){
				doms.close = $('<i class="M-dialogClose icon-close" />')
					.attr('title', LANG('关闭'))
					.addClass(styles.closeClass)
					.appendTo(el);
				self.uiBind(doms.close, 'click', 'onCancel');
			}

			if (c.showHead){
				doms.title = $('<div class="M-dialogTitle" />').appendTo(doms.head);
				if (c.title){
					self.setTitle(c.title);
				}
				if (c.drag) {
					plugin_drag.drag(doms.head, self.eventDrag, self);
				}
			}else {
				doms.head.hide();
			}

			// 按钮组
			if (c.showFoot){
				var btnConf = c.buttonConfig;
				util.each(c.buttons, function(btn){
					var cfg = btnConf[btn];
					btn = 'button' + util.ucFirst(btn);
					if (cfg && !self.get(btn)){
						cfg.target = doms.foot;
						self.create(btn, input.base, cfg);
					}
				});
			}else {
				doms.foot.hide();
			}

			// 如果存在尺寸规格，就用规格所定的尺寸大小
			var size = '';
			var sizeDimension = c.sizeDimension || {};

			// 加入尺寸大小
			switch (c.data && c.data.size || c.size){
				case 's':
				case 'small':
					size = 's';
					break;
				case 'm':
				case 'medium':
					size = 'm';
					break;
				case 'l':
				case 'large':
					size = 'l';
					break;
				case 'xl':
					size = 'xl';
					break;
				case '2xl':
					size = '2xl';
					break;
				default:
					size = c.size;
			}
			// 初始化属性设置
			self.css({
				'width': (sizeDimension[size] && sizeDimension[size].width) || c.width || 'auto',
				'height': (sizeDimension[size] && sizeDimension[size].height) || c.height || 'auto',
				'max-height': (sizeDimension[size] && sizeDimension[size].maxHeight) || c.maxHeight || 'auto',
				'min-height': (sizeDimension[size] && sizeDimension[size].minHeight) || c.minHeight || 'auto'
			});

			if (c.autoShow){
				self.show();
			}

			// 窗口大小改变，重新设定位置；
			self.uiBind(window, 'resize.dialog', 'onSizeChange');

			return self;
		},
		setWidth: function(w){
			var self = this;
			if(w){
				self.css('width', w);
			}
			return self;
		},
		/**
		 * 显示弹出层
		 * @param {Object} config 显示设置
		 * @return {Undefined} 无返回值
		 */
		show:function(config){
			var self = this;
			var c = self.getConfig();
			var el = self.getDOM();

			if(!self.$isShow){
				self.$isShow = 1;
				if(c.mask){
					self.toggleMask(true);
				}
				self.css('z-index', maxZIndex++);
				self.Super("show");

			}
			self.update(config);

			// 显示滚动条
			if(c.hasScroll){
				self.showScroll(self.updateBodyHeight());

				// 页面是否收起滚动条
				if(c.stopPageScroll){
					DIALOGCOUNT++;
				}
			}

			// 默认设置input聚焦
			if(el.find('input[type="text"]').length > 0 && c.hasFocusFirstInput){
				el.find('input[type="text"]').eq(0).focus();
			}else{
				el.focus();
			}

			return self;
		},
		/**
		 * 关闭弹出层
		 * @return {Undefined} 无返回值
		 */
		hide: function(){
			var self = this;
			if (self.$isShow){
				self.$isShow = 0;
				maxZIndex--;
			}
			self.Super('hide');
			var c = self.getConfig();
			if(c.mask){
				self.toggleMask(false);
			}

			DIALOGCOUNT--;
			if(DIALOGCOUNT <= 0){
				DIALOGCOUNT = 0;
			}

			return self
		},
		/**
		 * 切换遮罩层
		 * @return {undefined} 无返回值
		 */
		toggleMask:function(state){
			var self = this;
			var c = self.getConfig();
			if (c.mask){
				if(!self.$mask){
					self.$mask = $('<div class="M-dialogMask"/>')
						.hide()
						.insertBefore(self.$el);
				}
				if (state === undefined){
					state = self.$isShow;
				}
				if (state){
					if (!self.$isMaskShow){
						self.$isMaskShow = true;
						self.$mask
							.css('z-index', maxZIndex++)
							.show();
					}
				}else {
					if (self.$isMaskShow){
						self.$isMaskShow = false;
						maxZIndex--;
						self.$mask.hide();
					}
				}
			}
			return self;
		},
		/**
		 * 切换显示/隐藏
		 * @return {Undefined} 无返回值
		 */
		toggle: function(state){
			var self = this;
			if (state === undefined){
				state = !self.$isShow;
			}
			if (state){
				this.show();
			}else {
				this.hide();
			}
			return self;
		},
		// 更新窗口位置
		update: function(config){
			var self = this;
			var c = self.getConfig();
			var doms = self.$doms;
			var disH = doms.head.outerHeight(true) + doms.foot.outerHeight(true);
			var isAuto = !util.isObject(c.position);
			var el = self.$el;
			var size = c.size;
			var popOffset;

			// 手动指定位置设置
			if(!isAuto){
				var mode = c.position.mode;
				var element = c.position.element;
				var offset = c.position.offset || {};
				popOffset = util.popOffset('dialog');
				if(mode && element){
					var opsition = self._getElementPosition(self.getContainer(), element, mode);
					self.css({
						left: opsition.left + (offset.left || 0) + popOffset.left,
						top: opsition.top + (offset.top || 0) + popOffset.top
					});

				}else{
					// 不是自动设定的话则更新设定值
					config = util.extend(c.position, config);
					self.css(config);
				}
			}

			// 调整高度限制
			if (c.height || size == 'l' || size == 'xl' || size == '2xl'){
				// 如果有高度配置和size等于这几个，body动态计算高度，以使底部按钮固定在底部位置
				doms.body.height(el.outerHeight(true) - disH);
			}

			// 自动调整位置
			if (isAuto){
				// 自动设定的话则只处理top
				if (config) {
					self.css(config);
				}

				if (el.css('position') == 'fixed'){
					self.css({
						'top': '50%',
						'left': '50%',
						'marginLeft': (-el.outerWidth() / 2) + 'px',
						'marginTop': (-el.outerHeight() / 2) + 'px'
					})
				}else {
					var h  = Math.max(0, (BODY_BOUND.clientHeight - (el.height() || el.outerHeight(true)))/2);
					var sh = Math.max(DOC_ELEMENT.scrollTop, BODY_ELEMENT.scrollTop);
					popOffset = util.popOffset();
					self.css({
						'top': parseInt(sh + h, 10) + popOffset.top,
						'left': '50%',
						'marginLeft': (-el.outerWidth() / 2) + 'px'
					});
				}

				if(util.isMobile()){
					self.css({
						'top': $(document).scrollTop() + ($(window).height() - el.height())/4
					});
				}
			}
			// 更新遮罩层
			self.updateMask();
			return self;
		},
		/**
		 * 获取位置
		 * @param  {Object} dom    DOM元素，定位物体
		 * @param  {Object} subject jQuery对象，定位参照主体目标
		 * @param  {String} mode    定位模式
		 * @return {Object}         left, top位置
		 */
		_getElementPosition: function(dom, subject, mode){
			subject = subject.get(0);
			var position = {};

			var left = mode.match('left') ? subject.offsetLeft : subject.offsetLeft + subject.offsetWidth;
			var top = mode.match('top') ?  subject.offsetTop : subject.offsetTop + subject.offsetHeight;
			var current = subject.offsetParent;

			while (current !== null && current !== document.body){
				left += current.offsetLeft;
				top += current.offsetTop;
				current = current.offsetParent;
			}
			var m = mode.split(',');
			position.left = (m[0].match('left') || m[1].match('right')) ? left-dom.outerWidth() : left;
			position.top = (m[0].match('top') || m[1].match('bottom')) ? top-dom.outerHeight() : top;

			return position;
		},
		/**
		 * 设定遮罩层
		 * @param  {Object}    config 遮罩层设定
		 * @return {Undefined}        无返回值
		 */
		updateMask:function(config){
			var self = this;
			if(self.$mask){
				var popOffset = util.popOffset();
				config = config || {};
				config.height = Math.max(BODY_BOUND.scrollHeight, BODY_BOUND.clientHeight)+ "px";
				config.position = popOffset.isShow ? 'fixed' : 'absolute';

				self.$mask.css(config);
			}
			return self;
		},
		/**
		 * 修改标题
		 * @param  {String}    html 标题字符串。文字或html
		 * @return {Undefined}      无返回值
		 */
		setTitle:function(title){
			var self = this;
			var dom = self.$doms.title;
			if (dom){
				if (util.isString(title)){
					dom.text(title);
				}else if (title){
					dom.empty().append(title);
				}else {
					dom.empty();
				}
			}
			return self;
		},
		eventDrag: function(data, evt) {
			var pos,
				self = this,
				el = self.$el,
				cache = self.$drag_cache;

			switch(data.type) {
				case 'startDrag':
					self.$drag_cache = $.extend({
						screenWidth: $(window).width(),
						screenHeight: $(window).height(),
						outerWidth: el.outerWidth(),
						outerHeight: el.outerHeight()
					}, el.offset());
				break;
				case 'moveDrag':
					pos = {
						marginLeft: 0,
						top: cache.top + data.dy,
						left: cache.left + data.dx
					};

					if (pos.top < 0) {pos.top = 0;}
					if (pos.left < 0) {pos.left = 0;}
					if (pos.top + cache.outerHeight > cache.screenHeight) { pos.top = cache.screenHeight - cache.outerHeight;}
					if (pos.left + cache.outerWidth > cache.screenWidth) { pos.left = cache.screenWidth - cache.outerWidth;}

					self.css(pos);
				break;
				case 'endDrag':
					self.$drag_cache = {};
				break;
			}
			return true;
		},
		/**
		 * 尺寸改变响应函数
		 * @param  {Object}    ev 事件消息对象
		 * @return {Undefined}    无返回值
		 */
		onSizeChange:function(ev){
			var c = this.getConfig();
			this.update();
			if(c.hasScroll){
				this.updateScroll(this.updateBodyHeight());
			}
			return false;
		},

		/**
		 * 确定响应事件
		 * @param  {Object}    ev 事件消息对象
		 * @return {Undefined}    无返回值
		 */
		onOk: function(evt){
			var self = this;
			var c = self.getConfig();
			if(!c.silence){
				self.fire("dialogOk");
			}
			return false;
		},
		/**
		 * 取消响应事件
		 * @param  {Object}    ev 事件消息对象
		 * @return {Undefined}    无返回值
		 */
		onCancel: function(evt){
			var self = this;
			var c = self.getConfig();
			if(!c.silence){
				self.fire("dialogCancel");
			}
			self.hide();
			return false;
		},
		/**
		 * 消息响应处理函数
		 * @param  {Object}    ev 消息信息对象
		 * @return {Undefined}    无返回值
		 */
		onInputClick:function(ev){
			var self = this;
			var el = self.getDOM();
			var c = self.getConfig();
			var btns = c.buttons;
			var btnCfg = c.buttonConfig;

			if (!c.buttonEvent){
				switch (ev.name){
					case 'buttonOk':
						self.onOk(ev);
						el.focus();
						return false;
					case 'buttonCancel':
						self.onCancel(ev);
						el.focus();
						return false;
					default:
						for(var i in btns){
							var btnName = 'button' + util.ucFirst(btns[i]);
							try{
								if(ev.name == btnName && self[btnCfg[btns[i]]['attr']['data-action']]){
									return self[btnCfg[btns[i]]['attr']['data-action']](ev);
								}
							} catch(e){
								console.log(e);
							}
						}
				}
			}
			// return false;
		},
		// 切换要显示的按钮
		toggleButton: function(buttons){
			var self = this;
			var c = self.getConfig();
			var list = ',' + buttons.toString() + ',';

			util.each(c.buttons, function(id){
				var name = 'button' + util.ucFirst(id);
				if (list.indexOf(',' + id + ',') !== -1){
					self.$[name].show();
				}else {
					self.$[name].hide();
				}
			});
			return self;
		},
		getDOM: function(name){
			var doms = this.$doms;
			return doms && ((name && doms[name]) || doms.body) || this.$el;
		},
		/**
		 * 获取模块某个区域对象
		 * @param  {String} type 类型
		 * @return {Object}      区域对象
		 */
		getContainer:function(name){
			var doms = this.$doms;
			return name && doms[name] || doms.body;
		},
		// 更新body主体高度，是为了滚动条顺利更新
		updateBodyHeight: function(){
			var self = this;
			var doms = self.$doms;
			var c = self.getConfig();
			var disH = doms.head.outerHeight(true) + doms.foot.outerHeight(true);
			if(c.sizeDimension && c.size && c.sizeDimension[c.size]){
				doms.body.css({
					'max-height': c.sizeDimension[c.size].maxHeight - disH,
					'min-height': c.sizeDimension[c.size].minHeight - disH
				});
			}

			return doms.body;
		}
	});
	exports.base = Base;

	// 请使用pubjs.alert(html, callback, size, alertType);
	var Alert = Base.extend({
		init: function(config, parent){
			config = pubjs.conf(config, {
				'width': 350,
				'data': null,
				'target': $(BODY_ELEMENT),
				'buttons': ['cancel', 'ok'],
				'buttonConfig':{
					'ok': {'value': LANG('确定'), 'class': 'btn btn-success'},
					'cancel': {'class': 'btn btn-link'}
				},
				'class': 'M-dialogAlert',
				'showClose': false,
				'drag': false,
				'stopPageScroll': false,
				// 尺寸大小对应表
				'sizeDimension': {
					's': {'width':350, 'maxHeight': 160, 'minHeight': 150, 'height': 'auto'},
					'm': {'width':400, 'maxHeight': 200, 'minHeight': 150, 'height': 'auto'}
					//l: {'width':350, 'height': 160}
				},
				'size': 's'
			});

			// 事件时间戳
			this.$timeStamp = 0;

			this.Super('init', arguments);
		},
		afterBuild: function(){
			var self = this;
			self.Super('afterBuild', arguments);

			var data = self.getConfig('data');
			if (data){
				self.setData(data).show();
			}
			return self;
		},
		setData: function(data){
			var self = this;
			var c = self.getConfig();
			var con = self.$doms.body;
			c.data = data;

			con.empty();
			if (data.html) {
				if (util.isString(data.html)){
					con.html(data.html);
				}else {
					con.append(data.html);
				}
			} else if (util.isString(data.text)){
				con.append($('<p class="con"/>').text(data.text));
			}

			if (data.type == 'confirm'){
				self.toggleButton('ok,cancel')
					.setTitle(LANG('确认')).bindEvent(true);
			}else {
				self.toggleButton('ok')
					.setTitle(LANG('提示')).bindEvent(data.onTop);
			}
			self.update();
			return self;
		},
		onOk: function(){
			var self = this;
			var data = self.getConfig('data');

			if(data.callback && util.isFunc(data.callback)){
				data.callback.call(self, true);
			}
			if (!data.next.call(self)){
				self.hide();
			}
			return false;
		},
		onCancel: function(){
			var self = this;
			var data = self.getConfig('data');

			if(data.callback && util.isFunc(data.callback)){
				data.callback.call(self, false);
			}
			if (!data.next.call(self)){
				self.hide();
			}
			return false;
		},
		hide: function(){
			var self = this;
			self.Super('hide');

			self.bindEvent(true);
			return self;
		},
		bindEvent: function(unbind){
			var self = this;
			if(unbind){
				$(document).unbind('keypress.alert');


				if(self.$mask){
					self.uiUnbind(self.$mask, 'mouseup tap');
				}
			}else{
				var data = self.getConfig().data;
				if(data.type == 'alert'){
					// 点击回车键隐藏弹框
					$(document).bind('keypress.alert',function(e){
						if(e.keyCode == 13){
							if (!data.next.call(self)){
								self.onCancel();
							}
						}
						return false;
					});

					// 点击空白处隐藏弹框
					if(self.$mask){
						// 鼠标点击弹框内
						self.uiBind(self.el, 'mouseup tap', function(e){
							self.$timeStamp = e.timeStamp;
						});
						// 鼠标点击蒙板上
						self.uiBind(self.$mask, 'mouseup tap', function(e){
							if(self.$timeStamp != e.timeStamp){
								// 隐藏
								if (!data.next.call(self)){
									self.onCancel();
								}
							}
						});
					}
				}
			}
		}
	});
	exports.alert = Alert;

	// 请使用pubjs.notify(message, title, type);
	var Notify = view.container.extend({
		init: function(config, parent){
			config = pubjs.conf(config, {
				'class': 'M-dialogNotify',
				'type': 'info',
				'target': pubjs.DEFAULT_POPUP_CONTAINER,
				'time': 5000,
				'offset': 0,
				'data': null,
				'isFixed': false,	// 是否固定定位
				'vertical': 'top' // 垂直位置 top middle
			});

			this.Super('init', arguments);
		},
		afterBuild: function(){
			var self = this;
			var el = self.getDOM();
			var doms = self.$doms = {};
			doms.title = $('<div class="M-dialogNotifyTitle"/>').appendTo(el);
			doms.icon = $('<div class="M-dialogNotifyIcon"/>').appendTo(el);
			doms.message = $('<div class="M-dialogNotifyMessage"/>').appendTo(el);

			this.uiBind(el, 'click', 'onNext');

			return self;
		},
		show: function(){
			var self = this;
			var el = self.getDOM();
			var c = self.getConfig();

			// if (self.$tid){
			// 	clearTimeout(self.$tid);
			// }
			el.show();

			var w = el.outerWidth(),
				h = el.outerHeight(),
				d = document,
				b = (d.compatMode === "CSS1Compat"?d.documentElement:d.body),
				ch = b.clientHeight,
				cw = b.clientWidth,
				st = Math.max(d.documentElement.scrollTop,d.body.scrollTop),
				sl = Math.max(d.documentElement.scrollLeft,d.body.scrollLeft);

			var topMap = {
				'top': 60,
				'middle': parseInt(st + (ch - h) / 2, 10)
			};

			el.css({
				'top': topMap[c.vertical],
				'left': parseInt(sl + (cw - w) / 2, 10),
				'z-index': maxZIndex+100
			});

			if(c.isFixed){
				el.css({'position': 'fixed', 'top': 10});
			}else{
				el.css({'position': 'absolute', 'top': topMap[c.vertical]});
			}

			//self.$tid = self.setTimeout('onNext', self.getConfig().time);
		},
		hide: function(){
			this.getDOM().fadeOut(500);
			return this;
		},
		onNext: function(){
			var self = this;
			var data = this.getConfig('data');
			if (data && !data.next.call(self)){
				self.hide();
			}
			return false;
		},
		setData: function(data){
			var self = this;

			if (self.$tid){
				clearTimeout(self.$tid);
			}

			var doms = self.$doms;
			var el = self.getDOM();
			var c = self.getConfig();
			c.data = data;
			if (util.isString(data.message)){
				doms.message.text(data.message);
			}else {
				doms.message.empty().append(data.message);
			}
			if (data.title){
				if (util.isString(data.title)){
					doms.title.text(data.title);
				}else {
					doms.title.empty().append(data.title);
				}
			}
			doms.title.toggle(!!data.title);
			var type = self.$type = data.type || self.$type;
			switch (type){
				case 'info':
				case 'notify':
					el.removeClass('a-is-success a-is-danger a-is-warning a-is-primary').addClass('a-is-info');
					break;
				case 'success':
					el.removeClass('a-is-info a-is-danger a-is-warning a-is-primary').addClass('a-is-success');
					break;
				case 'danger':
				case 'error':
					el.removeClass('a-is-info a-is-success a-is-warning a-is-primary').addClass('a-is-danger');
					break;
				case 'warning':
				case 'warn':
					el.removeClass('a-is-info a-is-success a-is-danger a-is-primary').addClass('a-is-warning');
					break;
				case 'primary':
					el.removeClass('a-is-info a-is-success a-is-danger a-is-warning').addClass('a-is-primary');
					break;
			}

			self.$tid = self.setTimeout('onNext', self.getConfig().time);

			return self;
		}
	});
	exports.notify = Notify;
});