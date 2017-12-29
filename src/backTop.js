define(function(require, exports) {
	var $ = require('jquery');
	var pubjs = require('pubjs');
	var util  = require('util');
	var view  = require('@base/view');

	var BackTop = view.container.extend({
		init: function(config) {
			config = pubjs.conf(config, {
				'klazz': 'W-backTop',
				'class': '',
				'height': 400, // 页面滚动高度达到该值会显示 backTop 组件
				'bottom': 30, // 组件距离底部的距离
				'right': 30, // 组件距离右边的距离
				'duration': 1000, // 滚动动画持续时间，毫秒
				'size': 'm', // 尺寸大小，s \ m \ l
				'bcColor': '#e6e6ff' // 背景颜色
			});

			this.Super('init', arguments);
		},
		afterBuild: function() {
			var c = this.getConfig();
			var el = this.getDOM();

			// 创建组件结构
			var backTopDom = $([
				'<div class="backTop-container">',
					'<span class="ion-chevron-up"></span>',
				'</div>',
			].join('')).appendTo(el);
			this.addClass(c.klazz);
			this.$dom = {
				backtop: backTopDom.find('.backTop-container')
			}

			if (c.size) {
				 switch (c.size) {
				 	case 's':
				 		this.$dom.backtop.css({
				 			'width': '24',
				 			'height': '30',
				 			'font-size': '16'
				 		});
				 		break;
				 	case 'm':
				 		this.$dom.backtop.css({
				 			'width': '30',
				 			'height': '36',
				 			'font-size': '20'
				 		});
				 		break;
				 	case 'l':
				 		this.$dom.backtop.css({
				 			'width': '36',
				 			'height': '42',
				 			'font-size': '24'
				 		});
				 		break;
				 }

			}

			if (c.bcColor) {
				var backColor = c.bcColor;
				this.$dom.backtop.css({'background-color': 'backColor'})
			}

		},
		onClick: function() {

		}
	});
	exports.base = BackTop;
});