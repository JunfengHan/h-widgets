define(function( require, exports ){
	var $ = require('jquery');
	var pubjs = require('pubjs');
	var util  = require('util');
	var view  = require('@base/view');

	var Button = view.container.extend({
		init: function(config){
			config = pubjs.conf(config, {
				'klazz': 'W-button',
				'class': '',       		// 可以加样式
				'tag': 'button',
				'width': null,
				'size': 'm',       		// 按钮的大小号 s, m, l,默认m
				'type': 'default', 		// 类型, 可选 primary, info,success,warnin,error
				'btnText': LANG('新建'),// 默认显示的文字
				'icon': '',		   		// icon样式
				'radius':''        		//圆角大小
			});

			this.Super('init', arguments);
		},
		afterBuild: function(){
			var self = this;
			var c = self.getConfig();
			var el = self.getDOM();

			// 构建模式
			$([
				'<i class="W-button-icon"></i>',
				'<span class="W-button-text"></span>',
			].join('')).appendTo(el);

			var doms = self.$doms = {
				icon: el.find('.W-button-icon'),
				span: el.find('.W-button-text'),
			};
			el.addClass(c.klazz);
			doms.span.attr({}).text(LANG(c.btnText));
			this.uiBind(el,'click','eventBtnClick');

			if(!c.icon){
				doms.icon.hide();
			}else{
				doms.icon.css({'content':c.icon});
			}

			if(c.size){
				el.addClass(c.klazz+'-'+c.size);
			}

			if(c.radius){
				el.css({'borderRadius':c.radius});
			}

			if(c.class){
				el.addClass(c.class);
			}
			if(c.width){
				el.css({'width':c.width});
			}

			var type = c.type;
			switch(type){
				case 'primary':
					el.addClass('W-button-primary');
					break;
				case 'success':
					el.addClass('W-button-success');
					break;
				case 'warnin':
					el.addClass('W-button-warnin');
					break;
				case 'error':
					el.addClass('W-button-error');
					break;
				default:
				 	el.addClass('W-button-default');
			}

		},

		setValue: function(value){
			this.$doms.setValue(value);
			return this;
		},
		getValue: function(type){
			return null;
		},
		// 按钮禁用
		disable: function(){
			this.getDOM().addClass('disable');
			return this;
		},
		enable: function(){
			this.getDOM().removeClass('disable');
			return this;
		},
		eventBtnClick:function(evt){
			evt.stopPropagation();
			this.fire('buttonClick');
		},
		reset: function(){
			this.$doms.reset();
		}
	});
	exports.add = Button;


	exports.link = Button.extend({
		init: function(config){
			config = pubjs.conf(config, {
				'tag':'a',
				'href': '', // 跳转地址
				'href_target': '_blank', // 跳转形式
			});

			this.Super('init', arguments);
		},
		afterBuild: function(){
			var self = this;
			var c = self.getConfig();
			var el = self.getDOM();

			// 构建模式
			$([
				'<i class="W-button-icon"></i>',
				'<span class="W-button-text"></span>',
			].join('')).appendTo(el);

			var doms = self.$doms = {
				icon: el.find('.W-button-icon'),
				span: el.find('.W-button-text'),
			};
			el.addClass(c.klazz);
			doms.span.attr({}).text(LANG(c.btnText));
			this.uiBind(el,'click','eventBtnClick');

			if(!c.icon){
				doms.icon.hide();
			}else{
				doms.icon.css({'content':c.icon});
			}

			if(c.size){
				el.addClass(c.klazz+'-'+c.size);
			}

			if(c.radius){
				el.css({'borderRadius':c.radius});
			}

			if(c.class){
				el.addClass(c.class);
			}
			if(c.width){
				el.css({'width':c.width});
			}

			var type = c.type;
			switch(type){
				case 'primary':
					el.addClass('W-button-primary');
					break;
				case 'success':
					el.addClass('W-button-success');
					break;
				case 'warnin':
					el.addClass('W-button-warnin');
					break;
				case 'error':
					el.addClass('W-button-error');
					break;
				default:
				 	el.addClass('W-button-default');
			}

			if(c.href){
				self.uiBind(el, 'click', 'eventOpenWindow');
			}

		},
		// 打开新页面事件
		eventOpenWindow: function(evt, elm){
			var c = this.getConfig();

			if(c.href){
				var href = c.href;
				// 判断是否新窗口打开
				if(c.href_target == '_blank'){
					window.open(href);
				}else{
					if(href.indexOf('#') != -1){
						var arr = href.split('#');
						href = arr[arr.length - 1];
					}
					pubjs.controller.navigate(href);
				}
			}

			return false;
		},

		setValue: function(value){
			this.$doms.setValue(value);
			return this;
		},
		getValue: function(type){
			return null;
		},
		// 按钮禁用
		disable: function(){
			this.getDOM().addClass('disable');
			return this;
		},
		enable: function(){
			this.getDOM().removeClass('disable');
			return this;
		},
		eventBtnClick:function(ev){

		},

		// 更新超链接
		updateUrl: function(ev){
			// 用于hash的search改变，引起的一系列变更
			var self = this;
			if(ev){
				var c = self.getConfig();
				var doms = self.$doms;
				var search = ev.param.search;
				var a = doms.btn;
				// 循环更新
				$.each(a, function(idx, item){
					var el = $(item);
					var href = el.attr('href');
					if(href){
						href = href.split('?')[0];
						if(href){
							search = search ? '?'+search : '';
							el.attr('href', href + search);
						}
					}
				});
			}
			return self;
		},
		reset: function(){
			this.$doms.reset();
		}

	});

});