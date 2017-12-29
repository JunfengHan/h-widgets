define(function(require, exports) {
    var $ = require('jquery');
	var pubjs = require('pubjs');
	var util  = require('util');
    var view  = require('@base/view');
    
    var Base = view.container.extend({
        init: function(config) {
            config = pubjs.conf(config, {
                'class': '',
                'klazz': '',
                'checkedIcon':'ion-android-radio-button-on',//选中时图标
                'unCheckedIcon': 'ion-android-radio-button-off',//未选中时图标
                'preicon': true,
                'suficon': false,
                'label': '单选按钮',
                'value': 0,
                'checked': false,
                'autoFire': false //父组件广播事件
            });
            this.checked = false;
            this.Super('init', arguments);
        },
        afterBuild: function() {
            var c = this.getConfig();
            var radioDom = $([
                    c.suficon ? '<span>' + c.label + '</span>' : '',
                    '<i class="'+ c.klazz +'-icon '+ c.unCheckedIcon +'"></i>',
                    c.preicon ? '<span>' + c.label + '</span>' : ''
            ].join(''));
            this.append(radioDom);
            this.addClass(c.klazz);
            if(c.class) {
                this.addClass(c.class);
            }
            this.$dom = {
                'icon': this.find('.'+ c.klazz +'-icon')
            }
            if(c.checked) {
                this.checked = c.checked;
                this.syncStatus();
            }
            this.uiBind('click', 'evClick');
        },
        //同步icon和checked的状态
        syncStatus: function() {
            var c = this.getConfig();
            if(this.checked) {
                this.$dom.icon.removeClass(c.unCheckedIcon).addClass(c.checkedIcon);
            }else {
                this.$dom.icon.removeClass(c.checkedIcon).addClass(c.unCheckedIcon);
            }
        },
        evClick: function(evt) {
            evt.stopPropagation();
            var c = this.getConfig();
            this.checked = !this.checked;
            this.syncStatus();
            if(c.autoFire) {
                this.fire('witemClick');
            }
        },
        reset:function() {
            var c = this.getConfig();
            this.checked = c.checked;
            this.syncStatus();
            return this;
        },
        getVlaue: function() {
            var c = this.getConfig();
            var value = {
                label: c.label,
                value: c.value
            }
            return value;
        },
        setValue: function(item) {

        }
    });
    exports.base = Base;
    //单选按钮redio
    var RadioGroup = view.container.extend({
        init: function(config){
            config = pubjs.conf(config, {
                'klazz': 'W-radio-group',
                'class': '',
                'items':[],
                'url': '',
                'param': null
            });
            this.index = 0;
            this.checkedItem = null;
            var c = config.get();
            if(c.items && c.items.length && !c.url){
				this.Super('init', arguments);
			}else{
				if(c.url){
					this.load(arguments);
				}
            }
        },
        afterBuild: function() {
            var c = this.getConfig();
            util.each(c.items, function(item, i) {
                var child = this.create('W_Radio_'+ (this.index++), 
                                        Base,
                                        util.extend(item, {
                                            'klazz': 'W-radio',
                                            'autoFire': true
                                        })
                                    );
                if(item.checked) {
                    if(this.checkedItem) {
                        throw new Error('单选按钮, 默认只能有一个被选中');
                    }
                    this.checkedItem = child;
                }
            }, this)
            this.addClass(c.klazz);
            if(c.class) {
                this.addClass(c.class);
            }
        },
        reset: function() {
            var c = this.getConfig();
            this.index = 0;
            this.checkedItem = null;
            this.param = c.param
            util.each(this.$, function(item) {
                item.reset();
                if(item.checked) {
                    this.checkedItem = item;
                }
            });
            return this;
        },
        onWitemClick: function(ev) {
            this.checkedItem.checked = !this.checkedItem.checked;
            this.checkedItem.syncStatus();
            this.checkedItem = ev.source;
        },
        getVlaue: function() {
            return this.checkedItem.getVlaue();
        },
        load: function(arg) {
            var c = arg[0].get();
            this.param = this.param || c.param;
            pubjs.mc.send(c.url,
                        $.extend({},this.param),
                        this.afterLoad.bind(this, arg));
        },
        afterLoad: function(arg, err, data) {
            if(err) {
                if(err.message) {
                    pubjs.alert(err.message);
                }
                pubjs.error(err);
            }else {
                this.Super('init', arg);
            }
        },
        setParam: function(param) {
            this.param = param;
            return this;
        }
    })
    exports.radioGroup = RadioGroup;
    //多选按钮checkbox
    var CheckboxGroup = view.container.extend({
        init: function(config){
            config = pubjs.conf(config, {
                'klazz': 'W-checkbox-group',
                'class': '',
                'items':[],
                'url': '',
                'param': null
            });
            this.index = 0;
            this.checkedItem = [];
            var c = config.get();
            if(c.items && c.items.length && !c.url){
				this.Super('init', arguments);
			}else{
				if(c.url){
					this.load(arguments);
				}
            }
        },
        afterBuild: function() {
            var c = this.getConfig();
            if(util.isArray(c.items)) {
                util.each(c.items, function(item, i) {
                    var child = this.create('W_Checkbox_'+ (this.index++), 
                                            Base,
                                            util.extend(item, {
                                                'klazz': 'W-checkbox',
                                                'checkedIcon':'W-checkbox-checked',//选中时图标
                                                'unCheckedIcon': 'W-checkbox-unchecked',//未选中时图标
                                            })
                                            );
                    if(item.checked) {
                        this.checkedItem.push(child);
                    }
                }, this);
            }else {
                throw new Error('"items"必须为数组');
            }
            this.addClass(c.klazz);
            if(c.class) {
                this.addClass(c.class);
            }
        },
        reset: function() {
            var c = this.getConfig();
            this.index = 0;
            this.checkedItem = [];
            this.param = c.param;
            util.each(this.$, function(item) {
                item.reset();
                if(item.checked) {
                    this.checkedItem.push(item);
                }
            });
        },
        getVlaue: function() {
            var value = [];
            util.each(this.$, function(item) {
                if(item.checked) {
                    value.push({
                        value: item.value,
                        label: item.label
                    });
                }
            }, this)
            return value;
        },
        load: function(arg) {
            var c = arg[0].get();
            this.param = this.param || c.param;
            pubjs.mc.send(c.url,
                        $.extend({},this.param),
                        this.afterLoad.bind(this, arg));
        },
        afterLoad: function(arg, err, data) {
            if(err) {
                if(err.message) {
                    pubjs.alert(err.message);
                }
                pubjs.error(err);
            }else {
                this.Super('init', arg);
            }
        },
        setParam: function(param) {
            this.param = param;
            return this;
        }
    })
    exports.checkboxGroup = CheckboxGroup;
});