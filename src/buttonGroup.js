define(function( require, exports ){
	var $ = require('jquery');
	var pubjs = require('pubjs');
	var util  = require('util');
	var view  = require('@base/view');

	var ButtonGroup = view.container.extend({
		init: function(config){
			config = pubjs.conf(config, {
				'klazz': 'W-buttonGroup',
				'class': '',       		// 可以加样式
				'tag': 'div',
				'width': null,
				'size': 'm',       		// 按钮组的大小号 s, m, l,默认m
				'type': 'default', 		// 类型, 可选 primary, info,success,warnin,error 
				'btnText': LANG('新建'),// 默认显示的文字
				'icon': '',		   		// icon样式
				'radius':'',    		// 圆角大小
				'btnNum': 2    			// 按钮个数
			});

			this.Super('init', arguments);
		},
		afterBuild: function(){
			var self = this;
			var c = self.getConfig();
			var el = self.getDOM();

			var btnHtml = '';
			for(var i = 1;i<= c.btnNum;i++){
				 btnHtml += '<button class = "W-button-group"><i class="W-button-icon"></i><span class="W-button-text"></span></button>'
			}			
			// 构建模式
			$([btnHtml].join('')).appendTo(el);

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
					el.addClass('W-buttonGroup-primary');
					break;
				case 'success':
					el.addClass('W-buttonGroup-success');
					break;
				case 'warnin':
					el.addClass('W-buttonGroup-warnin');
					break;
				case 'error':
					el.addClass('W-buttonGroup-error');
					break;
				default:
				 	el.addClass('W-buttonGroup-default');
			}
						
			/*if(c.href || c.useCallback){
				var a = doms.button;
				self.uiBind(a, 'click', 'eventOpenWindow');
			}*/

		},
		// 打开新页面事件
		/*eventOpenWindow: function(evt, elm){
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
		},*/
		
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
	exports.add = ButtonGroup;


});