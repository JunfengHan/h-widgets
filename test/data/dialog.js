
define(function(require, exports) {
	exports.base = {
		'buttons': ["cancel", "ok"]
	};
	exports.alert = {
		'data': {
			text: "测试一下内容是不是成功，多写一点看看有没有"
		},
		'size': 'm'
	};
	exports.notify = {
		'data': {
			message: "测试一下提示信息"
		},
		'time': 3000,
		'type': 'success'
	};
});