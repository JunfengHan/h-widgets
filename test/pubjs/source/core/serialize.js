define(function(require, exports, module){
/**
 * 数据序列化操作
 */
"use strict";
var has = Object.prototype.hasOwnProperty;

// 序列化记录
function serialize(data)
{
	switch (typeof data){
		case 'string':
			return 's' + data.length + ':' + data + ';';
		case 'number':
			if (isNaN(data)){
				return 'N;';
			}else if (Number.isInteger(data)){
				return 'i' + data.toString(36) + ';';
			}else {
				return 'f' + data.toString() + ';';
			}
		case 'boolean':
			return 'b' + (data?1:0) + ';';
		case 'undefined':
			return 'u;';
		case 'object':
			var str, i;
			if (data === null){
				return 'n;';
			}else if (data instanceof Int64){
				return 'I' + data._data + ';';
			}else if (data instanceof Buffer){
				return 'B' + data._data + ';';
			}else if (data instanceof Date){
				return 'd' + data.getTime().toString(36) + ';';
			}else if (data instanceof Array){
				str = 'a';
				for (var i=0; i<data.length; i++){
					str += serialize(data[i]);
				}
			}else {
				str = 'o';
				var key, val;
				for (var i in data){
					if (has.call(data, i)){
						key = serialize(i);
						val = serialize(data[i]);
						if (key && val){
							str += key + val;
						}
					}
				}
			}
			return str + ';';
	}
}
exports.encode = serialize;

// 反序列化记录
function deserialize(str){
	var len = str.length;
	var offset = 0;
	var de = function(){
		if (offset >= len){
			// out of data
			err(-6);
		}

		var val;
		var end = str.indexOf(';', offset);
		if (end == -1){
			// throw exception
			err(-1);
		}
		switch (str.charAt(offset++)){
			case 'i': // Number
				val = str.substring(offset, end);
				offset = end+1;
				return parseInt(val, 36);

			case 'f': // Float
				val = str.substring(offset, end);
				offset = end+1;
				return parseFloat(val);

			case 'I': // Int64
				val = str.substring(offset, end);
				offset = end+1;
				return new Int64(val);

			case 's': // String
				end = str.indexOf(':', offset);
				if (end == -1){
					err(-2);
				}
				val = +str.substring(offset, end);
				if (isNaN(val)){
					err(-3);
				}
				offset = ++end + val;
				if (str.charAt(offset) != ';'){
					err(-4);
				}
				return str.substring(end, offset++);

			case 'a': // Array
				val = [];
				while (str.charAt(offset) != ';'){
					val.push(de());
				}
				offset++;
				return val;

			case 'o': // Object
				val = {};
				while (str.charAt(offset) != ';'){
					end = de();
					val[end] = de();
				}
				offset++;
				return val;

			case 'n': // Null
				offset++;
				return null;

			case 'N': // NaN
				offset++;
				return NaN;

			case 'B': // Buffer
				val = str.substring(offset, end);
				offset = end+1;
				return new Buffer(val);

			case 'b': // Boolean
				val = str.charAt(offset);
				offset += 2;
				return (val === '1');

			case 'd': // Date
				val = str.substring(offset, end);
				offset = end+1;
				return new Date(parseInt(val, 36));

			case 'u':
				offset++;
				return;

			default: // Unknow
				err(-5);
		}
	}
	return de();
}
exports.decode = deserialize;

if (!Number.isInteger){
	Number.isInteger = function(num){
		return (parseInt(num) === num);
	}
}

function Int64(val)
{
	this._data = val || '';
}

function _formatInt() {
	return '#' + this._data;
}

Int64.prototype.toString = _formatInt;
Int64.prototype.toJSON = _formatInt;
Int64.prototype.valueOf = _formatInt;

exports.Int64 = Int64;

function Buffer(val)
{
	this._data = val || '';
}

function _formatBuf() {
	return this._data;
}

Buffer.prototype.toString = _formatBuf;
Buffer.prototype.toJSON = _formatBuf;

function err(code)
{
	var e = new Error('Serialize Data Error.');
	e.code = code;
	throw e;
}

});