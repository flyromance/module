/**
 *
 */

require.config({
    baseUrl: '', // 如果不指定，则使用data-main的指定的baseUrl, 一般这边要重新配置一下
    paths: {
        // 不配置baseUrl，就要写成 a: 'js/a'
        a: 'a',
        b: 'b',
        c: 'c',
        d: 'd'
    },
    // b.js中的写法就要用下面这种方式来调用~，新版本可以不用这个方法来申明！
    shim: {
        b: {
            exports: 'b'
        }
    }
});

// context(['c'], function (c) {
//     c.helloC();
// });

// require.s.contexts._.require(['d'], function (d) {
//     d.helloD();
// });

require(['js/module/c', 'js/module/jquery-1.11.3', 'js/module/jsencrypt'], function (c, d, en) {
    console.log(en);
});

// require(['b'], function(b) {
//     console.log(b);
// });