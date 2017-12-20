define(function(require, exports){
	var $ = require('jquery');
	var pubjs = require('pubjs');
	var util  = require('util');
	var view  = require('@base/view');

	// 废弃，请使用@base/common/drop.add

	/**
	 * Input类
	 */
	var Base = view.widget.extend({
		init: function(config){
			config = pubjs.conf(config, {
				'layout': {
					'tag': 'span',
					'class': 'M-commonInput'
				},
				'class': '',
				'tag': 'input',
				'type': 'button',
				'attr': null,
				'css': null,
				'width': 0,
				'height': 0,
				'value': LANG('按钮'),
				'events': 'click'
			});

			$(config.get().target).append('<div>测试</div>');
		}
	});
	exports.base = Base;
})