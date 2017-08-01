/**
 * Created by Administrator on 2016/1/16.
 */

// 一个模块依赖另一个模块的 另一种写法
define(['a'], function (a) {
    return {
        helloD: function () {
            console.log('this is model D!!!');
            a.hello();
        }
    }
});