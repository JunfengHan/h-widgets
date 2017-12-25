define(function(require, exports){
	var $ = require('jquery');
	var pubjs = require('pubjs');
	var util  = require('util');
	var view  = require('@base/view');
	/**
	 * Input类
	 */
	var Base = view.widget.extend({
		init: function(config){
			config = pubjs.conf(config, {
				'class': '',
				'klazz': 'W-input',
				'placeholder': '请输入内容',
			});
			this.Super('init', arguments);
		},
		afterBuild: function() {
			var c = this.getConfig();
			$([
				'<div class='+ c.klazz +'>',
				'<div>'
			].join(''))
		},
		getValue: function() {

		},
		setValue: function() {

		}
	});
	exports.base = Base;
})