define(function(require, exports){
	var $ = require('jquery');
	var pubjs = require('pubjs');
	var util  = require('util');
	var view  = require('@base/view');

	/**
	 * switch类
	 */
	var Base = view.container.extend({
		init: function(config){
			config = pubjs.conf(config, {
				// 值：bool类型
				'value': false,
				// 开启时文字(最多两个)
				'openText': '',
				// 关闭时文字(最多两个)
				'closeText': '',
				// 尺寸，可选值: s, m, l
				'size': 'm',
				// 是否禁用
				'disable': false,

				'class': '',
				'klazz': 'W-switch',
				'tag': 'span'
			});

			this.Super('init', arguments);
		},
		afterBuild: function(){
			var c = this.getConfig();
			var dom = this.getDOM();
			if (c.klazz) {
				this.addClass(c.klazz);
			}
			this.resetSize();
			if(c.size && !c.openText && !c.closeText){
				switch(c.size){
					case 's':
						this.addClass('W-switch-s');
						break;
					case 'l':
						this.addClass('W-switch-l');
						break;
				}
			}else{
				var lengthMax = c.openText.length>c.closeText.length? c.openText.length : c.closeText.length;
				if(lengthMax == 2){
					this.addClass('W-switch-l');
				}
			}
			
			this.$doms = {
				input: $('<input type="hidden" />').appendTo(dom),
				inner: $('<span class="W-switch-inner"></span>').appendTo(dom)
			};
			if(c.disable){
				this.disable();
			}else{
				this.enable();
			}
			this.setValue(c.value);
		},
		eventClick: function() {
			var c = this.getConfig();
			var value = this.$doms.input.val();
			value = value=="false"? false : true;
			if(!value){
				this.addClass('W-switch-checked');
				this.$doms.input.val(!value);
				this.toggleValue(c.openText);
			}else{
				this.removeClass('W-switch-checked');
				this.$doms.input.val(!value);
				this.toggleValue(c.closeText);
			}
		},
		reset: function(){

		},
		setValue: function(value){
			var c = this.getConfig();
			this.$doms.input.val(value);
			if(!value){
				this.removeClass('W-switch-checked');
				this.toggleValue(c.closeText);
			}else{
				this.addClass('W-switch-checked');
				this.toggleValue(c.openText);
			}
			return this;
		},
		getValue: function(){
			var data = this.$doms.input.val();
			data = data=="false"? false : true;
			return data;
		},
		toggleValue: function(text) {
			this.$doms.inner.text(text);
		},
		enable: function() {
			this.removeClass('W-switch-disabled');
			this.uiBind('click', 'eventClick');
		},
		disable: function() {
			this.addClass('W-switch-disabled');
			this.uiUnbind('click', 'eventClick');
		},
		resetSize: function(){
			this.removeClass('W-switch-s');
			this.removeClass('W-switch-l');
		}
	});
	exports.base = Base;
});