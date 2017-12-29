define(function(require, exports) {
    var $ = require('jquery');
    var pubjs = require('pubjs');
    var util = require('util');
    var view = require('@base/view');

    var Base = view.container.extend({
        init: function(config) {
            config = pubjs.conf(config, {
                'height': 32,
                'width': 78,
                // 初始值
                'value': 1,
                // 每加一次加多少
                'itemValue': 1,
                // 最小值
                'min': 1,
                // 最大值
                'max': 10,
                // 是否只读
                'readonly': false,
                
                'class': '',
                'klazz': 'W-inputNumber',
                'tag': 'div'
            });
            this.Super('init', arguments);
        },
        afterBuild: function() {
            var that = this;
            var c = that.getConfig();
            var dom = that.getDOM();
            if (c.klazz) {
                that.addClass(c.klazz);
            }
            var doms = that.$doms = {
                input: $('<input value="'+c.value+'" readonly='+c.readonly+'></input>').appendTo(dom),
                buttonGroup: $('<div></div>').appendTo(dom)
            }
            doms.buttonAdd = $('<a class="W-inputNumber-a ion-chevron-up"></a>').appendTo(doms.buttonGroup);
            doms.buttonSubtract = $('<a class="ion-chevron-down"></a>').appendTo(doms.buttonGroup);
            dom.css({'height': c.height+'px', 'width': c.width+'px'});

            that.uiBind(doms.buttonAdd, 'click', 'buttonAdd');
            that.uiBind(doms.buttonSubtract, 'click', 'buttonSubtract');
            that.uiBind(doms.input, 'input propertychange', 'inputBind');
            that.inputChange(c.min, c.max);
            if(c.readonly){
                that.uiUnbind(doms.buttonAdd, 'click');
                that.uiUnbind(doms.buttonSubtract, 'click');
            }
        },
        buttonAdd: function(){
            var c = this.getConfig();
            var value = this.$doms.input.val() * 1;
            this.$doms.input.val(value + c.itemValue);
            this.inputChange(c.min, c.max);
        },
        buttonSubtract: function() {
            var c = this.getConfig();
            var value = this.$doms.input.val() * 1;
            this.$doms.input.val(value - c.itemValue);
            this.inputChange(c.min, c.max);
        },
        inputBind: function() {
            if (this.$doms.input.val() != '') {
                var c = this.getConfig();
                this.inputChange(c.min, c.max);
            }
        },
        inputChange: function(min, max) {
            if (this.$doms.input.val() < min+1) {
                this.$doms.input.val(min);
                this.$doms.buttonSubtract.addClass('W-inputNumber-disable');
            }else{
                this.$doms.buttonSubtract.removeClass('W-inputNumber-disable');
            }
            if (this.$doms.input.val() > max-1) {
                this.$doms.input.val(max);
                this.$doms.buttonAdd.addClass('W-inputNumber-disable');
            }else{
                this.$doms.buttonAdd.removeClass('W-inputNumber-disable');
            }
        },
        setValue: function(data) {
            this.$doms.input.val(data);
        },
        getValue: function() {
            return this.$doms.input,val()*1;
        }
    });
    exports.base = Base;
})