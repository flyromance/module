// 无依赖也要写空数组[]，不然不会执行factory函数
// require(function () {
// 	console.log('no dep');
// })

// require(['b'], function(b) {
//     console.log(b);
// });

require(['js/module/a', 'b'], function (a, b) {
    console.log(a);
});

// context(['c'], function (c) {
//     c.helloC();
// });

// require.s.contexts._.require(['d'], function (d) {
//     d.helloD();
// });

console.log(4);