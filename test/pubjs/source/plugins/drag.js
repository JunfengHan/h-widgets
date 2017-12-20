define(function(require, exports){
	var $ = require('jquery');

	/**
	 * 拖动控制模块
	 * @description 只传入dom参数, 可以取消绑定
	 * @param {jQuery}   dom      绑定触发拖拽的jQuery对象
	 * @param {Object}   data     <可选> 回调事件参数
	 * @param {Function} callback 回调函数
	 * @param {Object}   context  <可选> 回调函数调用域
	 */
	function Drag(dom, data, callback, context){
		if (!dom){
			return false;
		}
		if (!dom.jquery){
			dom = $(dom);
		}
		if (arguments.length == 1){
			dom.unbind('mousedown.drag', DragEvent);
		}else {
			if (data instanceof Function){
				context = callback;
				callback = data;
				data = null;
			}
			dom.bind('mousedown.drag', {
				cb: callback,
				ct: context || window,
				data: data
			}, DragEvent);
		}
		return false;
	}
	/**
	 * 拖拽DOM事件处理封装函数
	 * @param {Event} evt jQuery事件对象
	 */
	function DragEvent(evt){
		var ev = evt.data;
		var X = evt.pageX, Y = evt.pageY;
		ev.type = 'moveDrag';
		switch (evt.type){
			case 'mouseup':
				$(document).unbind('mouseup.drag', DragEvent);
				$(document).unbind('mousemove.drag', DragEvent);
				$(document).find('.G-frameScenes').removeClass('draghand');
				ev.type = 'endDrag';
			/* falls through */
			case 'mousemove':
				ev.dx = X - ev.x;
				ev.dy = Y - ev.y;
				ev.cdx = X - ev.cx;
				ev.cdy = Y - ev.cy;
				ev.cx = X;
				ev.cy = Y;
				ev.cb.call(ev.ct, ev, evt);
			break;
			case 'mousedown':
				$(document).find('.G-frameScenes').addClass('draghand');
				if (evt.button == 2){
					return;
				}
				ev.cx = ev.x = X;
				ev.cy = ev.y = Y;
				ev.dx = ev.cdx = 0;
				ev.dy = ev.cdy = 0;
				ev.type = 'startDrag';
				if (ev.cb.call(ev.ct, ev, evt)){
					$(this.ownerDocument)
						.bind('mouseup.drag', ev, DragEvent)
						.bind('mousemove.drag', ev, DragEvent);
				}else {
					return;
				}
			break;
		}
		return false;
	}
	exports.drag = Drag;

	// pc简单纯拖动
	function DragSimple(elm, callback, context) {
		var dom = $(elm).get(0);
		var data = {};
		dom.onmousedown = function(evt) {
			var ev = evt || window.event;
			var disX = ev.clientX - dom.offsetLeft;
			var disY = ev.clientY - dom.offsetTop;
			// 记录原始位置
			data.sourceX = ev.clientX;
			data.sourceY = ev.clientY;

			function fnMove(evt) {
				var ev = evt || window.event;
				var l = ev.clientX - disX ;
				var t = ev.clientY - disY;
				var scrollHeight = document.body.scrollHeight;
				var scrollWidth = document.body.scrollWidth;
				if(l<0){
					l=0;
				}else if(l>scrollWidth-dom.offsetWidth){
					l=scrollWidth-dom.offsetWidth;
				}
				if(t<0){
					t=0;
				}else if(t>scrollHeight-dom.offsetHeight-document.body.scrollTop){
					t=scrollHeight-dom.offsetHeight-document.body.scrollTop;
				}
				dom.style.left = l + "px";
				dom.style.top = t + "px";
			}

			function fnUp(evt) {
				if(callback){
					evt.data = data;
					callback.call(context || window, evt);
				}
				this.onmousemove = null;
				this.onmouseup = null;
				if (this.releaseCapture) {
					this.releaseCapture();
				}
			}

			if (dom.setCapture) {
				dom.onmousemove = fnMove;
				dom.onmouseup = fnUp;
				dom.setCapture();
			} else {
				document.onmousemove = fnMove;
				document.onmouseup = fnUp;
			}

			return false;
	    }
	}


	// 移动简单拖动功能
	function DragMobile(dom, callback, context){
		// 不要用a标签, 否则拖动不顺畅
		if(dom){
			var oW = 0, oH = 0;
			var el = $(dom).get(0);
			// 绑定touchstart事件
			el.addEventListener("touchstart", function(e) {
				var touches = e.touches[0];
				oW = touches.clientX - el.offsetLeft;
				oH = touches.clientY - el.offsetTop;

				//阻止页面的滑动默认事件
				document.addEventListener("touchmove", defaultEvent, false);
			}, false);


			el.addEventListener("touchmove", function(e) {
				var touches = e.touches[0];
				var oLeft = touches.clientX - oW;
				var oTop = touches.clientY - oH;
				if(oLeft < 0) {
					oLeft = 0;
				}else if(oLeft > document.body.scrollWidth - el.offsetWidth) {
					oLeft = (document.body.scrollWidth - el.offsetWidth);
				}

				if(oTop<0){
					oTop=0;
				}else if(oTop>document.body.scrollHeight-el.offsetHeight-document.body.scrollTop){
					oTop=document.body.scrollHeight-el.offsetHeight-document.body.scrollTop;
				}

				el.style.left = oLeft + "px";
				el.style.top = oTop + "px";

			},false);

			el.addEventListener("touchend",function() {
				document.removeEventListener("touchmove", defaultEvent, false);
				if(callback){
					callback.call(context || window);
				}
			},false);

		}else{
			return;
		}
	}
	// 阻止默认
	function defaultEvent(e) {
		e.preventDefault();
	}

	exports.plugin_init = function(pubjs, callback){
		pubjs.drag = Drag;
		pubjs.dragMobile = DragMobile;
		pubjs.dragSimple  = DragSimple;
		callback();
	}
})