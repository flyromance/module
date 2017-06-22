/**
 * Created by Administrator on 2016/1/16.
 */

// 一个模块依赖另一个模块
define(function (require) {
    return {
        helloC: function () {
            console.log('this is c model');
            var a = require('js/module/a');
            a.hello();
        }
    }
});