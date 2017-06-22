/**
 * Created by Administrator on 2015/12/24.
 */

!(function (global, factory) {

    if (typeof module !== 'undefined' && module.exports) { // commonjs 一般在node环境
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) { // amd 一般在浏览器环境
        define('jquery', [], factory)
    } else if (typeof global !== "undefined") { // 浏览器环境
        global.$ = factory();
    } else {
        throw new Error('vin needs a environment such as window');
    }

})(typeof window !== "undefined" ? window : this, function () {
    // 工厂模式，返回对象；
    /*var strundefined = typeof undefined;

     var fly = function(){
     alert('this is my first frame');
     }
     return fly;*/

    // 另一种写法
    return (function () {
        var $ = function () {

        };
        return $;
    })();
});

// 定义全局modele对象，用来储存每个模块，也就是用户自己定义的对象，如jQuery、_、$等等；
var modules = {};
// 声明定义模块的函数
function define(name, dependencies, fn) {
    if (!modules[name]) {
        var module = {
            name: name,
            dependencies: dependencies,
            fn: fn
        };
        modules[name] = module;
    }
    return modules[name];
}

// 定义一些简单的模块；
define('a', [], function () {
    return 1;
});
define('b', ['a'], function (a) {
    return ++a;
});
define('c', ["a", "b"], function (a, b) {
    return a + b;
});
