// 启动模块定义(路由模块)
define(function(require, exports){
	var util = require('../core/util');
	var app, config, CURRENCY;

	var NOWCURRENCYDATA = {};
	var USERCURRENCYID;
	var USERID;
	// 设置货币信息
	function setCurrency(currency){
		// 记录货币配置信息
		CURRENCY = currency || {};
		USERID = app.getUserId();
		// 当前账号默认货币
		USERCURRENCYID = app.getUserCurrent('Currency') || 1;

		// 切换的货币
		var nowCurrencyId = util.cookie('currency_' + USERID) || USERCURRENCYID;
		var allCurrencyData = CURRENCY[USERCURRENCYID];

		NOWCURRENCYDATA = util.find(allCurrencyData, nowCurrencyId, 'id') || {};
	}

	// 设置cookie货币id
	function setCurrencyId(id){
		if(USERID){
			util.cookie('currency_' + USERID, id);
		}
	}

	// 获取cookie货币id
	function getCurrencyId(){
		if(USERID){
			return util.cookie('currency_' + USERID) || USERCURRENCYID;
		}
		return null;
	}

	// 格式化货币单位
	function currUnit(){
		var name = NOWCURRENCYDATA['name'];
		if(name == '人民币'){
			name = '';
		}
		return name || LANG('元');
	}

	// 格式化货币符号
	function currSign(){
		return NOWCURRENCYDATA['sign'] || LANG('¥');
	}

	// 格式化汇率换算
	function currRate(val, size, type){
		var newVal = util.toFixed(((+val * +NOWCURRENCYDATA['rate']) || val), size || 2);

		switch (type){
			case 'all':
				return currSign() + newVal + currUnit();
				break;
			case 'unit':
				return newVal + currUnit();
				break;
			case 'front':
				return currSign() + newVal;
			default:
				return newVal;

		}

		return newVal;
	}

	//根据货币id获取货币信息
	function getCurrencyInfo(id){
		var CurrencyInfo = util.find(CURRENCY.all, id, 'id') || null;
		return CurrencyInfo;
	}

	exports.plugin_init = function(pubjs, callback){
		app = pubjs;
		config = pubjs.config;

		pubjs.setCurrency = setCurrency;
		pubjs.setCurrencyId = setCurrencyId;
		pubjs.getCurrencyId = getCurrencyId;
		pubjs.getCurrencyInfo = getCurrencyInfo;
		pubjs.currUnit = currUnit;
		pubjs.currSign = currSign;
		pubjs.currRate = currRate;

		callback();
	}
});