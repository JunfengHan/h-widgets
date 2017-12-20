define(function (require, exports, module) {
	var MVVM = require('../libs/mvvm/mvvm');
	// MVVM 构造函数方法见 /libs/mvvm/mvvm.js Line 3586

	/*
	 * 封装 MVVM 可以根据 Pubjs 需求定制
	 * <必选> view     接收一个 DOM 元素，作为编译的目标元素
	 * <必选> model    接收一个对象作为数据模型，字段不能包含任何运算符
	 * <可选> computed 接收一个对象作为计算属性的声明，属性对应的必须是一个有返回值的取值函数
	 * <可选> methods  接收一个对象作为 v-on 事件函数的声明
	 * <可选> watches  接收一个对象作为批量 watch 的 callback 函数声明
	 * <可选> customs  接收一个对象作为自定义指令刷新函数的声明
	 * <可选> context  接收一个 v-on 事件和 watches 回调函数 this 指向的执行上下文，如不指定则为 model
	 * <可选> lazy     接收一个布尔值告诉 MVVM 是否进行手动编译目标元素
	 */
	function PubjsVenus (option) {
		this.venus = new MVVM(option);
		this.$els = this.venus.$els;
		this.$ = this.$data = this.venus.$data;
	}

	/**
	 * 手动挂载/编译根元素
	 */
	PubjsVenus.prototype.mount = function () {
		this.venus.mount();
	}

	/**
	 * 获取指定数据模型值
	 * 如果获取的模型为对象或数组
	 * 返回数据与原数据保持引用关系
	 * @param   {String}  key  [<可选>数据模型字段]
	 * @return  {Mix}
	 */
	PubjsVenus.prototype.get = function (key) {
		return this.venus.get(key);
	}

	/**
	 * 获取指定数据模型值
	 * 如果获取的模型为对象或数组
	 * 返回数据与原数据将不会保持引用关系
	 * @param   {String}  key  [<可选>数据模型字段]
	 * @return  {Mix}
	 */
	PubjsVenus.prototype.getCopy = function (key) {
		return this.venus.getCopy(key);
	}

	/**
	 * 设置数据模型的值，key 为 json 时则批量设置
	 * @param  {String}  key    [数据模型字段]
	 * @param  {Mix}     value  [值]
	 */
	PubjsVenus.prototype.set = function (key, value) {
		this.venus.set(key, value);
	}

	/**
	 * 重置数据和视图为初始状态
	 * @param  {Array|String}  key  [<可选>数据模型字段，或字段数组，空则重置所有]
	 */
	PubjsVenus.prototype.reset = function (key) {
		this.venus.reset(key);
	}

	/**
	 * 监测表达式值的变化
	 * @param  {String}    expression  [监测的表达式]
	 * @param  {Function}  callback    [监测变化回调]
	 * @param  {Boolean}   deep        [<可选>深层依赖监测]
	 */
	PubjsVenus.prototype.watch = function (expression, callback, deep) {
		this.venus.watch.apply(this.venus, arguments);
	}

	/**
	 * 销毁函数
	 */
	PubjsVenus.prototype.destroy = function () {
		this.venus.destroy();
		this.$els = this.$ = this.$data = null;
	}

	module.exports = PubjsVenus;
});