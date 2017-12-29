define(function(require, exports) {
	var $ = require('jquery');
	var pubjs = require('pubjs');
	var util  = require('util');
	var input = require('./input');
	var button = require('./button');
	var view  = require('@base/view');
	var maxZIndex = 1001;

	var DOCUMENT = document;
	var BODY_ELEMENT = DOCUMENT.body;
	var DOC_ELEMENT = DOCUMENT.documentElement;
	var BODY_BOUND = (DOCUMENT.compatMode === "CSS1Compat" ? DOC_ELEMENT : BODY_ELEMENT);
	var DIALOGCOUNT = 0; // 弹出层数量

	var Base = view.container.extend({
		init: function(config, parent) {
			config = pubjs.conf(config, {
				'style': {
					"layoutClass":"",
					"headClass":"",
					"footClass":"",
					"closeClass":""
				},
				'target': pubjs.DEFAULT_POPUP_CONTAINER,
				// 允许显示的按钮
				// 默认只有确定和取消按钮
				// 更多的按钮在buttonConfig里配置
				'buttons': ["cancel", "ok"],
				'buttonConfig': {
					"ok": {
						"type": "success",
						'btnText': LANG('确定'),
						"attr": {"data-action":"onOk"}
					},
					"cancel": {
						"type": "info",
						"btnText": LANG('取消'),
						"attr": {"data-action":"onCancel"}
					},
					"other": {
						"type": "info",
						"value": LANG("其他"),
						"attr": {"data-action":"onOther"}
					}
				},
				// 按钮点击通过事件发送
				'buttonEvent': false,
				// 显示标题
				'showHead': true,
				// 弹出层标题
				'title': '新的测试标题',
				// 显示底部
				'showFoot': true,
				// 显示关闭按钮
				"showClose": true
				// 构建后自动显示
				,"autoShow": true
				// 容器宽度
				,"width": 350
				// 容器高度
				,"height": null
				// 是否带遮罩
				,"mask": 1
				// 窗口位置。auto<自动>|Object<具体设置>
				,"position":"auto"
				// 不发送事件
				,"silence": true
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
					's': {'width': 550, 'minHeight': 300, 'maxHeight': 600},
					'm': {'width': 850, 'minHeight': 300, 'maxHeight': 750},
					'l': {'width': 1000, 'minHeight': 300, 'maxHeight': 750, 'height': 750},
					'xl': {'width': 1200, 'minHeight': 300, 'maxHeight': 750, 'height': 750},
					'2xl': {'width': 1350, 'minHeight': 300, 'maxHeight': 750, 'height': 750}
				}
				// 自定义尺寸
				,"setSize": {'width':'', 'height':''}
				// 尺寸:
				// 小: 's' or 'small';
				// 中: 'm' or 'medium';
				// 大: 'l' or 'large';
				,"size": 'm'
				,"hasFocusFirstInput": true
			});

			// 设置初始的显示、遮罩
			this.$isShow = false;
			this.$mask = null;
			this.$isMaskShow = false;
			this.Super('init', arguments);
		},
		afterBuild: function() {
			var self = this;
			var c = this.getConfig();
			var el = this.$el = this.getDOM();
			this.addClass('W-dialog');

			// 自定义class名称
			if (c.style.layoutClass) {
				this.addClass(c.style.layoutClass);
			}

			var styles = c.style;
			var doms = this.$doms = {
				'head': $('<div class="W-dialog-head"></div>').addClass(styles.headClass).appendTo(el),
				'body': $('<div class="W-dialog-body"></div>').addClass(styles.bodyClass).appendTo(el),
				'foot': $('<div class="W-dialog-foot"></div>').addClass(styles.footClass).appendTo(el),
			};

			// 右上角关闭按钮
			if (c.showClose) {
				doms.close = $('<div class="W-dialog-close ion-close"></div>')
					.attr('title', LANG('关闭'))
					.addClass(styles.closeClass)
					.appendTo(el);
				this.uiBind(doms.close, 'click', 'onCancel');
			}

			// 头部信息
			if (c.showHead) {
				doms.title = $('<div class="W-dialog-head-title"></div>').appendTo(doms.head);
				if(c.title) {
					this.setTitle(c.title);
				}
			} else {
				doms.head.hide();
			}

			// 底部按钮组
			if (c.showFoot) {
				var btnConf = c.buttonConfig;
				util.each(c.buttons, function(btn) {
					var cfg = btnConf[btn];
					btn = 'button' + util.ucFirst(btn);
					if (cfg && !self.get(btn)) {
						cfg.target = doms.foot;
						self.create(btn, button.add, cfg);
					}
				})
			} else {
				doms.foot.hide();
			}

			// 配置尺寸规格
			var size = '';
			var sizeDimension = c.sizeDimension || {};

			switch (c.data && c.data.size || c.size) {
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
			// 自定义尺寸
			var setSize = c.setSize || {};
			if (setSize.width && setSize.height) {
				sizeDimension[size].width = setSize.width;
				sizeDimension[size].height = setSize.height;
			}
			// 初始化属性
			this.css({
				'width': (sizeDimension[size] && sizeDimension[size].width) || c.width || 'auto',
				'height': (sizeDimension[size] && sizeDimension[size].height) || c.height || 'auto',
				'max-height': (sizeDimension[size] && sizeDimension[size].maxHeight) || c.maxHeight || 'auto',
				'min-height': (sizeDimension[size] && sizeDimension[size].minHeight) || c.minHeight || 'auto'
			});

			// 自动显示
			if (c.autoShow) {
				this.show();
			}

			// 窗口大小改变，重新设定位置
			this.uiBind(window, 'reisze.dialog', 'onSizeChange');

			return this;
		},
		// 设置宽度
		setWidth: function(w) {
			if (w) {
				this.css('width', w);
			}
			return this;
		},
		show: function(config) {
			var c = this.getConfig();
			var el = this.getDOM();
			if (!this.$isShow) {
				this.$isShow = 1;
				if(c.mask){
					this.toggleMask(true);
				}
				this.css('z-index', maxZIndex++);
				this.Super("show");
			}
			this.update(config);

			// 显示滚动条
			if(c.hasScroll){
				this.showScroll(this.updateBodyHeight());

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

			return this;
		},

		/**
		 * 关闭弹出层
		 * @return {Undefined} 无返回值
		 */
		hide: function(){
			if (this.$isShow){
				this.$isShow = 0;
				maxZIndex--;
			}
			this.Super('hide');
			var c = this.getConfig();
			if(c.mask){
				this.toggleMask(false);
			}

			DIALOGCOUNT--;
			if(DIALOGCOUNT <= 0){
				DIALOGCOUNT = 0;
			}

			return this;
		},

		/**
		 * 切换遮罩层
		 * @return {undefined} 无返回值
		 */
		toggleMask: function(state){
			var c = this.getConfig();
			if (c.mask){
				if(!this.$mask){
					this.$mask = $('<div class="W-dialog-mask"></div>')
						.hide()
						.insertBefore(this.$el);
				}
				if (state === undefined){
					state = this.$isShow;
				}
				if (state){
					if (!this.$isMaskShow){
						this.$isMaskShow = true;
						this.$mask
							.css('z-index', maxZIndex++)
							.show();
					}
				}else {
					if (this.$isMaskShow){
						this.$isMaskShow = false;
						maxZIndex--;
						this.$mask.hide();
					}
				}
			}
			return this;
		},
		/**
		 * 切换显示/隐藏
		 * @return {Undefined} 无返回值
		 */
		toggle: function(state){
			if (state === undefined){
				state = !this.$isShow;
			}
			if (state){
				this.show();
			}else {
				this.hide();
			}
			return this;
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
			/*self.updateMask();*/
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
		/*updateMask:function(config){
			var self = this;
			if(self.$mask){
				var popOffset = util.popOffset();
				config = config || {};
				config.height = Math.max(BODY_BOUND.scrollHeight, BODY_BOUND.clientHeight)+ "px";
				config.position = popOffset.isShow ? 'fixed' : 'absolute';

				self.$mask.css(config);
			}
			return self;
		},*/
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
		onButtonClick:function(ev){
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
		// 获取dom
		getDOM: function(name) {
			var doms = this.$doms;
			return doms && ((name && doms[name]) || doms.body) || this.$el;
		},
		/**
		 * 获取模块某个区域对象
		 * @param  {String} type 类型
		 * @return {Object}      区域对象
		 */
		getContainer: function(name) {
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

	var Alert = Base.extend({
		init: function(config, parent) {
			config = pubjs.conf(config, {
				'width': 350,
				'data': null,
				'target': $(BODY_ELEMENT),
				'buttons': ['cancel', "ok"],
				'buttonConfig': {
					'cancel': {
						"type": "info",
						"btnText": LANG('取消'),
						"attr": {"data-action":"onCancel"}
					},
					'ok': {
						"type": "success",
						"btnText": LANG('确定'),
						"attr": {"data-action":"onOk"}
					}
				},
				'class': 'W-dialogAlert',
				'showClose': false,
				'drag': false,
				'stopPageScroll': false,
				// 尺寸大小对应表
				'sizeDimension': {
					's': {'width':350, 'maxHeight': 160, 'minHeight': 150, 'height': 'auto'},
					'm': {'width':400, 'maxHeight': 200, 'minHeight': 150, 'height': 'auto'}
				}
			});

			// 事件时间戳
			this.$timeStamp = 0;

			this.Super('init', arguments);
		},
		afterBuild: function() {
			this.Super('afterBuild', arguments);

			var data = this.getConfig('data');
			if (data) {
				this.setData(data).show();
			}

			var el = this.getDOM();
			this.uiBind($(document), 'mouseup' , 'hide');

			return this;
		},
		setData: function(data) {
			var c = this.getConfig();
			var con = this.$doms.body;
			c.data = data;

			con.empty();
			if (data.html) {
				if (util.isString(data.html)){
					con.html(data.html);
				} else {
					con.append(data.html);
				}
			} else if (util.isString(data.text)) {
				con.append($('<p class="con" />').text(data.text));
			}

			if (data.type == 'confirm') {
				this.toggleButton('ok,cancel')
					.setTitle(LANG('确认')).bindEvent(true);
			} else {
				this.toggleButton('ok')
					.setTitle(LANG('提示')).bindEvent(data.onTop);
			}
			this.update();
			return this;
		},
		onOk: function() {
			var data = this.getConfig('data');

			if (data.callback && util.isFunc(data.callback)) {
				data.callback.call(this, false);
			}
			if (!data.next.call(this)) {
				this.hide();
			}
			return false;
		},
		onCancel: function() {
			var data = this.getConfig('data');

			if (data.callback && util.isFunc(data.callback)) {
				data.callback.call(this, false);
			}
			if (!data.next.call(this)) {
				this.hide();
			}
			return false;
		},
		hide: function() {
			this.Super('hide');
			this.bindEvent(true);
			return this;
		},
		bindEvent: function(unbind) {
			var self = this;
			if (unbind) {
				$(document).unbind('keypress.alert');

				if (self.$mask) {
					self.uiUnbind(self.$)
				}
			} else {
				var data = self.getConfig().data;
				if (data.type == 'alert') {
					// 点击回车隐藏弹框
					$(document).bind('keypress.alert', function(e){
						if(e.keyCode == 13) {
							if (!data.next.call(self)) {
								self.onCancel();
							}
						}
						return false;
					});

					// 点击空白处隐藏弹框
					if (self.$mask) {
						// 点击弹框内
						self.uiBind(self.el, 'mouseup tap', function(e) {
							self.$timeStamp
						});
						// 点击蒙版
						self.uiBind(self.$mask, 'mouseup tap', function(e) {
							if (self.$timeStamp != e.timeStamp) {
								// 隐藏
								if (!data.next.call(self)) {
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
		init: function(config, parent) {
			config = pubjs.conf(config, {
				'class': 'W-dialog W-dialogNotify',
				'type': 'info',
				'target': pubjs.DEFAULT_POPUP_CONTAINER,
				'time': 5000,
				'offset': 0,
				'data': null,
				'isFixed': true,   // 是否固定定位
				'vertical': 'top'   // 垂直位置
			});

			this.Super('init', arguments);
		},
		afterBuild: function() {
			var el = this.getDOM();
			var doms = this.$doms = {};
			doms.icon = $('<div class="W-dialogNotifyIcon"></div>').appendTo(el);
			doms.message = $('<p class="W-dialogNotifyMessage"/>').appendTo(el);

			this.uiBind(el, 'click', 'onNext');

			var data = this.getConfig('data');
			if (data) {
				this.setData(data).show();
			}

			return this;
		},
		show: function() {
			var el = this.getDOM();
			var c = this.getConfig();

			el.show();

			var w = el.outerWidth(),
				h = el.outerHeight(),
				d = document,
				b = (d.compatMode === "CSS!Compat"?d.documentElement:d.body),
				ch = b.clientHeight,
				cw = b.clientWidth,
				st = Math.max(d.documentElement.scrollTop, d.body.scrollTop),
				sl = Math.max(d.documentElement.scrollLeft, d.body.scrollLeft);

			var topMap = {
				'top': 60,
				'middle': parseInt(st + (ch - h) / 2, 10)
			};

			el.css({
				'top': topMap[c.vertical],
				'left': parseInt(sl + (cw - w) / 2, 10),
				'z-index': maxZIndex + 100
			});

			if (c.isFixed) {
				el.css({'position': 'fixed', 'top': topMap[c.vertical]});
			} else {
				el.css({'position': 'absolute', 'top': topMap[c.vertical]});
			}
		},
		hide: function() {
			this.getDOM().animate({top: '-60px'}, 600);
			return this;
		},
		onNext: function() {
			var self = this;
			var data = this.getConfig('data');
			if (data) {
				self.hide();
			}
			return false;
		},
		setData: function(data) {
			if (this.$tid) {
				clearTimeout(this.$tid);
			}

			var doms = this.$doms;
			var el = this.getDOM();
			var notifyIcon = $('.W-dialogNotifyIcon');
			var c = this.getConfig();
			c.data = data;
			if (util.isString(data.message)) {
				doms.message.text(data.message);
			} else {
				doms.message.empty().append(data.message);
			}
			var type = this.$type = data.type || c.type;
			switch (type) {
				case 'info':
				case 'notify':
					notifyIcon.removeClass('ion-checkmark-circled ion-close-circled ion-alert-circled ion-information-circled').addClass('ion-alert');
					break;
				case 'success':
					notifyIcon.removeClass('ion-alert ion-close-circled ion-alert-circled ion-information-circled').addClass('ion-checkmark-circled');
					break;
				case 'danger':
				case 'error':
					notifyIcon.removeClass('ion-alert ion-checkmark-circled ion-alert-circled ion-information-circled').addClass('ion-close-circled');
					break;
				case 'warning':
				case 'warn':
					notifyIcon.removeClass('ion-alert ion-checkmark-circled ion-close-circled ion-information-circled').addClass('ion-alert-circled');
					break;
				case 'primary':
					notifyIcon.removeClass('ion-alert ion-checkmark-circled ion-close-circled ion-alert-circled').addClass('ion-information-circled');
					break;
			}

			this.$tid = this.setTimeout('onNext', this.getConfig().time);

			return this;
		}
	});
	exports.notify = Notify;
})