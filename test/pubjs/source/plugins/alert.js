define(function(require, exports){
	var util = require('util');
	var appCore;

	// 全局提示框
	var alertQueue = [];
	function popQueue(){
		alertQueue.shift();
		if (alertQueue.length){
			this.setData(alertQueue[0]);
		}
		return alertQueue.length;
	}

	// 全局提醒框
	var notifyQueue = [];
	function popQueueNotify(){
		notifyQueue.shift();
		if (notifyQueue.length){
			this.setData(notifyQueue[0]);
		}
		return notifyQueue.length;
	}

	function Alert(html, callback, size, alertType, onTop){
		// onTop: 需要点击确定才隐藏Alert框。
		if (!alertType){
			alertType = 'alert';
		}

		// callback和size可以置换
		if(util.isString(callback)){
			var _size = callback;

			if(util.isFunc(size)){
				callback = util.clone(size);
			}
			size = _size;
		}

		alertQueue.push({
			html: html,
			type: alertType,
			callback: callback,
			next: popQueue,
			onTop: onTop,
			size: size
		});

		if(alertQueue.length == 1){
			var c = alertQueue[0];

			if (!appCore){
				return false;
			}

			var win = appCore.get('SYSTEM_ALERT');
			if (!win){
				appCore.createAsync(
					'SYSTEM_ALERT',
					'@base/dialog.alert',
					// {'data': c},
					function(win){
						win.setData(c).show();
					}
				);
			}else {
				win.setData(c).show();
			}
		}
	}
	function Confirm(html, callback, size){
		Alert(html, callback, size, 'confirm');
	}


	// 全局加载蒙板
	var MASK_INSTANCE = null;
	var MASK_SHOW_COUNT = 0;
	var SystemMask = {
		show: function(hasMask){
			MASK_SHOW_COUNT++;
			if (!MASK_INSTANCE){
				appCore.createAsync(
					'SYSTEM_MASK',
					'@base/common/base.loadingMask',
					{
						'target': 'body', 'z_index': 10000
					},
					function(mask){
						MASK_INSTANCE = mask;
						if (MASK_SHOW_COUNT <= 0){
							mask.hide();
						}
					}
				);
			}else if (MASK_SHOW_COUNT > 0){
				MASK_INSTANCE.show(hasMask);
			}
		},
		hide: function(){
			MASK_SHOW_COUNT--;
			if (MASK_SHOW_COUNT <= 0 && MASK_INSTANCE){
				MASK_INSTANCE.hide();
			}
		}
	};

	// 轻量提醒
	function Notify(message, title, type, time, isFixed){

		notifyQueue.push({
			'message': message,
			'type': type || 'info',
			'title': title || null,
			'next': popQueueNotify
		});

		if(notifyQueue.length == 1){
			var c = notifyQueue[0];

			if (!appCore){
				return false;
			}

			var win = appCore.get('SYSTEM_NOTIFY');
			if (!win){
				appCore.createAsync(
					'SYSTEM_NOTIFY',
					'@base/dialog.notify',
					{'data': c, 'time': time || 2000, 'isFixed': isFixed},
					function(win){
						win.setData(c).show();
					}
				);
			}else {
				win.setData(c).show();
			}

		}
	}

	exports.plugin_init = function(pubjs, callback){
		appCore = pubjs.core;
		pubjs.alert = Alert;
		pubjs.confirm = Confirm;
		pubjs.loading = SystemMask;
		pubjs.notify = Notify;
		callback();
	}
})