define(function(require, exports){
	var $ = require('jquery');
	var pubjs = require('pubjs');
	var util  = require('util');
	var view  = require('@base/view');

	/**
	 * timePicker类
	 */
	var Base = view.container.extend({
		init: function(config){
			config = pubjs.conf(config, {
				// 单个时间还是时间段
				// 单个时间：'single'
				// 时间段：'double'
				'type': 'double',
				// 时间是否带秒：
				// 单个时间（带秒的）：'h-m-s'
				// 单个时间（不带秒的）：'h-m'
				'timeType': 'h-m-s',
				// 是否带脚下的取消确认按钮
				'isButton': true,
				// 空位符
				'placeholder': '选择时间',
				// 可选时间段(可等于)
				'timeGroup': [00, 23],


				'class': '',
				'klazz': 'W-timePicker',
				'tag': 'div',
				'starTitle': '开始时间',
				'endTitle': '结束时间'
			});
			this.$date = {
				starTime:{
					hour: '00',
					minute: '00',
					second: '00'
				},
				endTime:{
					hour: '00',
					minute: '00',
					second: '00'
				}
			};
			this.Super('init', arguments);
		},
		afterBuild: function(){
			var self = this;
			var c = self.getConfig();
			var dom = self.getDOM();
			if(c.klazz){
				self.addClass(c.klazz);
			}

			var container = $('<div class="W-timePicker-rel"></div>').appendTo(dom);
			var popup = $('<div class="W-timePicker-dropdown"></div>').appendTo(dom);

			var doms = self.$doms = {
				container: container,
				popup: popup,
				wrapper: $([
					'<div class="W-timePicker-rel-wrapper">',
						'<i class="W-timePicker-rel-icon ion-ios-clock-outline"></i>',
						'<input readonly="true" autocomplete="off" spellcheck="false" type="text" placeholder="' + c.placeholder + '" class="W-timePicker-rel-input" value="">',
					'</div>'
				].join('')).appendTo(container)
			};

			doms.icon = doms.wrapper.find('.W-timePicker-rel-icon');
			doms.input = doms.wrapper.find('.W-timePicker-rel-input');
			// 绑定事件
			self.uiBind(self.$doms.container, 'mouseup', 'containerClick')
			self.uiBind($(document), 'mouseup tap', 'mouseupHidden');
			self.uiBind(self.$doms.popup, 'mouseup', function(e){
				e.stopPropagation();
			});
			self.uiBind(doms.icon, 'mouseup', 'iconClick');
			self.uiBind(self.$doms.container, 'mouseover', 'containerOver');
			self.uiBind(self.$doms.container, 'mouseout', 'containerOut');
			// 构建dropdown
			self.buildDropdown(c.type);
			// 单个时间把头标隐藏
			if(c.type == 'single'){
				$(".W-timePicker-dropdown-title", self.$doms.dropdown).css('display','none');
			}
			// 不要按钮把footer隐藏
			if(!c.isButton){
				$(".W-timePicker-dropdown-footer", self.$doms.dropdown).css('display','none');
			}
			// 不要秒把秒的那一栏隐藏
			if(c.timeType == 'h-m'){
				$(".W-timePicker-dropdown-uls", self.$doms.dropdown).css('display','none');
			}
		},
		reset: function(){
			this.$date = {
				starTime:{
					hour: '00',
					minute: '00',
					second: '00'
				},
				endTime:{
					hour: '00',
					minute: '00',
					second: '00'
				}
			};
			this.showColor();
			this.scrollTop();
			this.$doms.input.val('');
			this.$doms.popup.hide(300);
			$('.W-timePicker-dropdown-ul>li', this.$doms.dropdown).removeClass('W-timePicker-dropdown-li-select');
			this.$doms.input.removeClass('W-timePicker-rel-input-focus');
			return this;
		},
		setValue: function(data){
			if(Array.isArray(data)){
				this.$date.starTime.hour = this.validata(Math.floor(data[0]/3600));
				this.$date.starTime.minute = this.validata(Math.floor(data[0]%3600/60));
				this.$date.starTime.second = this.validata(Math.floor(data[0]%3600%60));
				this.$date.endTime.hour = this.validata(Math.floor(data[1]/3600));
				this.$date.endTime.minute = this.validata(Math.floor(data[1]%3600/60));
				this.$date.endTime.second = this.validata(Math.floor(data[1]%3600%60));
			}else{
				this.$date.starTime.hour = this.validata(Math.floor(data/3600));
				this.$date.starTime.minute = this.validata(Math.floor(data%3600/60));
				this.$date.starTime.second = this.validata(Math.floor(data%3600%60));
			}
			this.showTime();
		},
		validata: function(data){
			if(data<10){
				return '0'+data+'';
			}else{
				return data+'';
			}
		},
		getValue: function(){
			var c = this.getConfig();
			var starHour = this.$date.starTime.hour;
			var starMinute = this.$date.starTime.minute;
			var starSecond = this.$date.starTime.second;
			var endHour = this.$date.endTime.hour;
			var endMinute = this.$date.endTime.minute;
			var endSecond = this.$date.endTime.second;
			if(c.type == 'single'){
				return starHour*60*60+starMinute*60+starSecond*1;
			}
			if(c.type == 'double'){
				return [starHour*60*60+starMinute*60+starSecond*1, endHour*60*60+endMinute*60+endSecond*1];
			}
		},
		// 构建dropdown的大框
		buildDropdown: function(type){
			var self = this;
			var c = self.getConfig();
			self.$doms.dropdown = $([
				'<div class="W-timePicker-dropdown-rel"></div>',
				'<div class="W-timePicker-dropdown-footer">',
					'<button type="button" class="W-timePicker-dropdown-btnl">',
						'<span>清空</span>',
					'</button>',
					'<button type="button" class="W-timePicker-dropdown-btnr">',
						'<span>确定</span>',
					'</button>',
				'</div>'
			].join('')).appendTo(self.$doms.popup);
			// 给清空和确定按钮绑定事件
			self.uiBind($('.W-timePicker-dropdown-btnl', self.$doms.dropdown), 'click', function(){
				self.reset();
			});
			self.uiBind($('.W-timePicker-dropdown-btnr', self.$doms.dropdown), 'click', function(){
				self.$doms.popup.hide(300);
				self.$doms.input.removeClass('W-timePicker-rel-input-focus');
			});

			var rel = $(".W-timePicker-dropdown-rel", self.$doms.popup);
			self.$doms.mainStar = $([
				'<div class="W-timePicker-dropdown-main">',
					'<div class="W-timePicker-dropdown-title">'+c.starTitle+'</div>',
					'<div class="W-timePicker-dropdown-content-star">',
					'</div>',
				'</div>'
			].join('')).appendTo(rel);

			var star = $(".W-timePicker-dropdown-content-star", self.$doms.mainStar);
			self.buildTime('getStarH', 'getStarM', 'getStarS', star);
			// 如果是时间段再构建一个
			if(type && type == 'double'){
				self.$doms.mainEnd = $([
					'<div class="W-timePicker-dropdown-main">',
						'<div class="W-timePicker-dropdown-title">'+c.endTitle+'</div>',
						'<div class="W-timePicker-dropdown-content-end">',
						'</div>',
					'</div>'
				].join('')).appendTo(rel);
				var end = $(".W-timePicker-dropdown-content-end", self.$doms.mainEnd);
				end.css('border-left', '2px solid #dddee1');
				self.buildTime('getEndH', 'getEndM', 'getEndS', end);
			}
		},
		// 构建时间选择
		buildTime: function(hFuc, mFuc, sFuc, dom){
			var c = this.getConfig();
			$([
				'<div>',
					'<ul class="W-timePicker-dropdown-ulh W-timePicker-dropdown-ul">',
					'</ul>',
				'</div>',
				'<div>',
					'<ul class="W-timePicker-dropdown-ulm W-timePicker-dropdown-ul">',
					'</ul>',
				'</div>',
				'<div class="W-timePicker-dropdown-divs">',
					'<ul class="W-timePicker-dropdown-uls W-timePicker-dropdown-ul">',
					'</ul>',
				'</div>'
			].join('')).appendTo(dom);
			var ulh = $(".W-timePicker-dropdown-ulh", dom);
			var ulm = $(".W-timePicker-dropdown-ulm", dom);
			var uls = $(".W-timePicker-dropdown-uls", dom);
			this.forTime(29, ulh, hFuc);
			this.forTime(65, ulm, mFuc);
			this.forTime(65, uls, sFuc);
		},
		// 构建时分秒滑动栏
		forTime: function (max, ul, Fuc) {
			for (var i = 0; i < max; i++) {
				var item = '';
				var li;
				if (i < 10) {
					item = "0" + i;
					li = $('<li value="' + item + '">' + item + '</li>').appendTo(ul);
				}
				if (9 < i && i < (max - 5)) {
					item = i;
					li = $('<li value="' + item + '">' + item + '</li>').appendTo(ul);
				}
				if (max - 6 < i && i < max) {
					li = $('<p></p>').appendTo(ul);
					continue;
				}
				this.uiBind(li, 'click', item, Fuc)
				if (max == 29) {
					var c = this.getConfig();
					if (i < c.timeGroup[0] || i > c.timeGroup[1]) {
						li.addClass('W-timePicker-dropdown-disabled');
						this.uiUnbind(li, 'click');
					}
				}
			}
		},
		getStarH: function(event){
			this.$date.starTime.hour = event.data;
			this.showTime(event);
		},
		getStarM: function(event){
			this.$date.starTime.minute = event.data;
			this.showTime(event);
		},
		getStarS: function(event){
			this.$date.starTime.second = event.data;
			this.showTime(event);
		},
		getEndH: function(event){
			this.$date.endTime.hour = event.data;
			this.showTime(event);
		},
		getEndM: function(event){
			this.$date.endTime.minute = event.data;
			this.showTime(event);
		},
		getEndS: function(event){
			this.$date.endTime.second = event.data;
			this.showTime(event);
		},
		showTime: function(event){
			var  c = this.getConfig();
			var starHour = this.$date.starTime.hour;
			var starMinute = this.$date.starTime.minute;
			var starSecond = this.$date.starTime.second;
			var endHour = this.$date.endTime.hour;
			var endMinute = this.$date.endTime.minute;
			var endSecond = this.$date.endTime.second;
			var starTimeChangeS = starHour*60*60+starMinute*60+starSecond*1;
			var endTimeChangeS = endHour*60*60+endMinute*60+endSecond*1;
			if(starTimeChangeS > endTimeChangeS){
				this.$date.endTime = util.extend({}, this.$date.starTime);
			}
			this.showColor(event);
			this.scrollTop();
			if(c.type == 'single'){
				if(c.timeType == 'h-m'){
					this.$doms.input.val(this.$date.starTime.hour+':'+this.$date.starTime.minute);
				}else{
					this.$doms.input.val(this.$date.starTime.hour+':'+this.$date.starTime.minute+':'+this.$date.starTime.second);
				}
			}
			if(c.type == 'double'){
				if(c.timeType == 'h-m'){
					this.$doms.input.val(this.$date.starTime.hour+':'+this.$date.starTime.minute+'-'+this.$date.endTime.hour+':'+this.$date.endTime.minute);
				}else{
					this.$doms.input.val(this.$date.starTime.hour+':'+this.$date.starTime.minute+':'+this.$date.starTime.second+'-'+this.$date.endTime.hour+':'+this.$date.endTime.minute+':'+this.$date.endTime.second);
				}
			}
		},
		showColor: function(event){
			$('.W-timePicker-dropdown-ul>li', this.$doms.dropdown).removeClass('W-timePicker-dropdown-li-select');
			$('.W-timePicker-dropdown-content-star .W-timePicker-dropdown-ulh>li[value="'+this.$date.starTime.hour+'"]', this.$doms.mainStar).addClass('W-timePicker-dropdown-li-select');
			$('.W-timePicker-dropdown-content-star .W-timePicker-dropdown-ulm>li[value="'+this.$date.starTime.minute+'"]', this.$doms.mainStar).addClass('W-timePicker-dropdown-li-select');
			$('.W-timePicker-dropdown-content-star .W-timePicker-dropdown-uls>li[value="'+this.$date.starTime.second+'"]', this.$doms.mainStar).addClass('W-timePicker-dropdown-li-select');
			$('.W-timePicker-dropdown-content-end .W-timePicker-dropdown-ulh>li[value="'+this.$date.endTime.hour+'"]', this.$doms.mainEnd).addClass('W-timePicker-dropdown-li-select');
			$('.W-timePicker-dropdown-content-end .W-timePicker-dropdown-ulm>li[value="'+this.$date.endTime.minute+'"]', this.$doms.mainEnd).addClass('W-timePicker-dropdown-li-select');
			$('.W-timePicker-dropdown-content-end .W-timePicker-dropdown-uls>li[value="'+this.$date.endTime.second+'"]', this.$doms.mainEnd).addClass('W-timePicker-dropdown-li-select');
		},
		scrollTop: function(){ 
			$('.W-timePicker-dropdown-content-star .W-timePicker-dropdown-ulh', this.$doms.mainStar).animate({scrollTop: this.$date.starTime.hour*24}, 300);
			$('.W-timePicker-dropdown-content-star .W-timePicker-dropdown-ulm', this.$doms.mainStar).animate({scrollTop: this.$date.starTime.minute*24}, 300);
			$('.W-timePicker-dropdown-content-star .W-timePicker-dropdown-uls', this.$doms.mainStar).animate({scrollTop: this.$date.starTime.second*24}, 300);
			$('.W-timePicker-dropdown-content-end .W-timePicker-dropdown-ulh', this.$doms.mainEnd).animate({scrollTop: this.$date.endTime.hour*24}, 300);
			$('.W-timePicker-dropdown-content-end .W-timePicker-dropdown-ulm', this.$doms.mainEnd).animate({scrollTop: this.$date.endTime.minute*24}, 300);
			$('.W-timePicker-dropdown-content-end .W-timePicker-dropdown-uls', this.$doms.mainEnd).animate({scrollTop: this.$date.endTime.second*24}, 300);
		},
		containerClick: function (e) {
			e.stopPropagation();
			this.$doms.popup.show(300);
			if (!this.$doms.input.val()) {
				$('.W-timePicker-dropdown-ul', this.$doms.dropdown).scrollTop(0);
			}
			this.$doms.input.addClass('W-timePicker-rel-input-focus');
		},
		mouseupHidden: function () {
			this.$doms.popup.hide(300);
			this.$doms.input.removeClass('W-timePicker-rel-input-focus');
		},
		iconClick: function (e) {
			var value = this.$doms.input.val();
			if (value) {
				e.stopPropagation();
				this.reset();
			}
		},
		containerOver: function () {
			var value = this.$doms.input.val();
			if (value) {
				this.$doms.icon.removeClass('ion-ios-clock-outline');
				this.$doms.icon.addClass('ion-android-close');
			}
		},
		containerOut: function () {
			this.$doms.icon.removeClass('ion-android-close');
			this.$doms.icon.addClass('ion-ios-clock-outline');
		}
	});
	exports.base = Base;
});
