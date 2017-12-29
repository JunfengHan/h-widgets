define(function(require, exports) {
    var util = require('util');
    var pubjs = require('pubjs');
    var $ = require('jquery');
    pubjs.use([
        '@plugins/model'
    ], function() {
        var router = /\?mod=(\w+)(?:\.(\w+))?/;
        //初始化PUBJS
        pubjs.init();
        pubjs.config('data/points', {
            '@w_tpl': ROOT('/src/tpl')
        });
    
        var modeFile, modeName;
        var matches = location.search.match(router);
        if(!matches){
            document.write(`url加上参数：?mod=input.textInput </br>`);
        }
        else if (matches.length > 1) {
            modeFile = matches[1];
            modeName = matches[2] || 'base';
            require.async(['@widgets/' + modeFile, '@widgetsConf/' + modeFile], function(mods, configs) {
                var factory = mods[modeName];
                if (!factory) {
                    document.write(modeFile + '.' + modeName + '不是一个模块类!');
                    return false;
                }
                pubjs.core.create('main', factory, util.extend(configs && configs[modeName] || {}, {
                    target: $('#widgetsContainer')
                }));
            });
        } else {
            document.write('参数错误！');
        }

    });
});