define(function(requrie, exports) {
	var $  = require('jquery');
	var	pubjs = requrie('pubjs');
	var util = require('util');
	var view = require('view');
	var tip = require('tip');
	var input = require('input');

	var STORE = null;

	// 新弹出日期选择模块
	var DateDialogNew = tip.base.extend({
		init: function(config) {
			config = pubjs.conf(config, {
				'class': 'W-dataPickerNew',
				'autoHide': 'click_body',
				'hasArrow': false,
				'autoShow': 0,

				'numberOfMonths': 2,
				'stepMonths': 1,
				'week_name': ['日', '一', '二', '三', '四', '五', '六'],
				'week_start': 0,

				'max': 0, // 可以选择的最大日期
				'min': 0, // 可以选择的最小日期

				'single': 0, // 只选择一天
				'begin': 0,
				'end': 0,
				'dateFormat': "Y-m-d",
				'allowIncludToday': false, // 允许包含今天
				'multi': false, // 多选
				'type': 'date' // 可选择的种类：year,month
				'placeHolder': '请选择时间'
			});

			// 定义当前选择状态，0-未选, 1-选开始, 2-选范围
			this.$mode = 0;
			this.$begin = 0;
			this.$end = 0;
			this.$cur = 0;
			this.$max = 0;
			this.$min = 0;
			this.$dom_days = null;
			this.$cals = [];

			this.$show_year = 0;
			this.$show_month = 0;

			this.$chMonthTimer  = 0;
			this.$chMonthDir    = 0;
			this.eventChangeMonth = this.eventChangeMonth.bind(this);

			this.$noLimit = false;

			// 类型按钮实例合集
			this.types = {};

			// 功能类型按钮实例合集
			this.buttons = {};

			// 一天
			this.aDay = 86400;
			this.endDay = 86399;

			// 现在的时间。
			this.nowDate = {};

			// 现在时间对应的时间戳
			this.nowTimestamp = {};

			// 统计类型 0 - 历史累计, 1 - 时段统计
			this.countType = 1;

			// 弹出日历是否已经选择
			this.calendarSelected = 0;

			// 多选集合
			this.$multi_selects = {};

			if (!STORE) {
				STORE = pubjs.getDateStorage();
			}

			// 初始化模块构造
			this.Super('init', arguments);

			this.setDate(
				STORE.getBegin(),
				STORE.getEnd(),
				STORE.getMode(),
				true
			);
		},
		afterBuild: function() {
			this.Super('aferBuild', arguments);
			var c = this.getConfig();

			// 主体布局
			var doms = this.$doms;
			doms.buttons = $('<div class="M-datePickerNewButtons" />').appendTo(doms.content);
			var body = doms.body = $('<div class="W-datePickerNewBody" />').appendTo(doms.content);

			// 月份切换
			var prev = $('<div class="date-ctrl prev"><i class="uk-icon-angle-left"/></div>').appendTo(body);
			var next = $('<div class="date-ctrl next"><i class="uk-icon-angle-right"/></div>').appendTo(body);

			// 生成日历
			for (var i= 0; i<c.numberOfMonths; i++) {
				this.buildMonth();
			}

			// 监听事件
			this.uiBind(prev, 'mousedown mouseup mouseleave tap', -1, 'eventMonthButton');
			this.uiBind(next, 'mousedown mouseup mouseleave tap', 1, 'eventMonthButton');
			this.uiProxy(body, '.date-head span', 'mouseup', 'eventSelectYearMonth');
			self.uiProxy(body, 'a', 'click mouseenter mouseleave mousedown', 'eventDay');
			self.uiProxy(doms.buttons, 'a[data-action]', 'click', 'eventButtons');
		},
		/**
		 * 更新配置
		 * @param  {Object} config 新配置对象
		 * @return {Module}        返回对象实例
		 */
		update: function(config) {
			// 定位锚点对象
			var anchor = $(config.anchor);
			this.$anchor = anchor.length ? anchor : null;
			// 重设按钮
			var buttons = util.clone(config.buttons);
			this.setConfig('buttons', null);
			this.extendConfig(config);
			this.setConfig('buttons', buttons);

			this.$multi_selects = config.multi_selects || {};

			// 修改显示月份数量
			var i=this.$cals.length, num = config.numberOfMonths;
			if (num){
				var j = Math.min(i, num);
				while (j--){
					this.$cals[j].container.show();
				}
				for (; i<num; i++){
					this.buildMonth();
				}
				for (; i>num;){
					this.$cals[--i].container.hide();
				}
			}
			// 如果界面已显示, 立即更新一次界面
			this.updatePosition();
			return this;
		},
		/**
		 * 构建月份日历
		 */
		buildMonth: function() {
			var con = $('<div class="date-container"/>').appendTo(self.$doms.body),
				head = $('<div class="date-head"/>').appendTo(con),
				week = $('<div class="date-week"/>').appendTo(con),
				cal = $('<div class="date-cal"/>').appendTo(con);

			var item = {
				'container':con,// 容器对象
				'head':head,	// 头部容器
				'week':week,	// 星期显示容器
				'body':cal,		// 日历日期容器
				'year':$('<span class="date-year" />').appendTo(head),  // 头部年份
				'month':$('<span class="date-month" />').appendTo(head),// 头部月份
				'days':[],	// 1-31号容器容器
				'base':0,	// 日期ID基础
				'pad':null	// 日期开头站位容器
			};

			var i, c = this.getConfig();
			// 生成星期
			for (i=0; i<7; i++) {
				$('<b/>').text(c.week_name[(i+c.week_start)%7]).appendTo(week);
			}

			// 开始日期占位
			item.pad = $('<em/>').appendTo(cal);

			// 生成日期
			for (i=1; i<=31; i++) {
				item.days.push($('<a/>').text(i).appendTo(cal));
			}

			head.attr('data-pos', this.$cals.length);
			this.$cals.push(item);

			return this;
		},
		// 计算显示日期的位置
		showDay: function() {
			var c = this.getConfig();
			var month = this.$show_month;
			var year = this.$show_year;
			var max = this.$max;
			var min = this.$min;
			var date = new Date(year, month, 1);
			var item, week, days, k, a, cl, id;

			if (month < 0) {
				this.$show_year = year += Math.floor(month / 12);
				this.$show_month = month
			}
		}

	})
});