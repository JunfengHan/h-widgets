define(function(require, exports){
	var $ = require('jquery');
	var pubjs = require('pubjs');
	var util  = require('util');
	var view  = require('@base/view');
	/**
	 * type:text input框 
	 */
	var TextInput = view.widget.extend({
		init: function(config){
			config = pubjs.conf(config, {
				'class': '',
				'klazz': 'W-input',
				'placeholder': '请输入内容',
				'size': 'm', 					//size: s m l;高度
				'width': '',					//宽度
				'eventTextInput': false,		//input事件消息向上层广播
				'textInputClick': false,
				'textInputPrefixClick': false,	//输入框前图标点击事件消息广播
				'textInputSuffixClick': false,	//输入框后图标点击事件消息广播
				'max': 100,				 		//内容最大长度
				'min': 0,						//内容最下长度
				'suffixIcon': '',				//后缀图标
				'prefixIcon': ''				//前缀图标
			});
			this.Super('init', arguments);
		},
		afterBuild: function() {
			var c = this.getConfig();
			var textInputDom = $([	
					'<input placeholder="' + c.placeholder +'"',
					'type="text"/>'
			].join(''));
			this.addClass(c.klazz +'-'+ c.size.toLocaleLowerCase())
			this.$dom = {
				input: textInputDom.find('input')
			}
			if(c.readonly) {
				this.$dom.input.prop('readonly', c.readonly);
			}
			if(c.suffixIcon) {
				this.$dom.suffixIconDom = $('<i class="W-input-suffix-icon '+ c.suffixIcon +'" />')
				textInputDom.after(this.$dom.suffixIconDom);
				this.addClass(c.klazz + '-suffix');
			}
			if(c.prefixIcon) {
				this.$dom.prefixIconDom = $('<i class="W-input-prefix-icon '+ c.prefixIcon +'" />')
				textInputDom.after(this.$dom.prefixIconDom);
				this.addClass(c.klazz + '-prefix');
				
			}
			if(c.class) {
				this.addClass(c.class);
			}
			if(c.width) {
				textInputDom.css('width', c.width);
			}
			this.append(textInputDom);
			//绑定事件
			if(c.eventTextInput) 
			{
				this.uiBind('input', 'evtextInput');
			}
			if(c.textInputClick || c.textInputPrefixClick ||c.textInputSuffixClick)
			{
				this.uiBind('click', 'evtextInputClick');
			}
		},
		evtextInput: function(evt) {
			evt.stopPropagation();
			var c = this.getConfig();
			var param = {
				data: this.getValue()
			};
			if(c.eventTextInput) {
				this.fire('textInput', param);
			}
		},
		evtextInputClick: function(evt) {
			evt.stopPropagation();
			var c = this.getConfig();
			var target = evt.target,
				nodeName = target.nodeName.toLocaleLowerCase(),
				className = target.className;
			if(c.textInputClick) {
				if(nodeName === 'input') {
					this.fire('textInputClick');
				}
			}
			if(c.textInputPrefixClick ||c.textInputSuffixClick) {
				if(nodeName === 'i') {
					if(className.indexOf('W-input-prefix-icon') !== -1) {
						this.fire('textInputPrefixClick');
					}
					if(className.indexOf('W-input-suffix-icon') !== -1) {
						this.fire('textInputSuffixClick');
					}
				}
			}
		},
		getValue: function() {
			return this.$dom.input.val();
		},
		setValue: function(value) {
			this.$dom.input.val(value);
		},
		disable: function() {
			this.$dom.input.prop('disabled', 'disabled');
		},
		enable: function() {
			this.$dom.input.removeProp('disabled');
		},
		readonly: function() {
			this.$dom.input.prop('readonly', 'readonly');
		},
		unreadonly: function() {
			this.$dom.input.removeProp('readonly');
		},
		reset: function() {
			this.$dom.input.val('');
		},
		validData: function() {
			var value = this.$dom.input.val().trim();
			var c = this.getConfig();
			if(value.length > c.min && value.length < c.max) {
				return true;
			}else {
				return false;
			}
		},
		error: function() {
		}
	});
	exports.textInput = TextInput;
});