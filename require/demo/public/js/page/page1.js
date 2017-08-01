// context(['c'], function (c) {
//     c.helloC();
// });

// require.s.contexts._.require(['d'], function (d) {
//     d.helloD();
// });

// require(['b'], function(b) {
//     console.log(b);
// });

require(['c', 'js/module/jsencrypt'], function (c, d, en) {
    console.log(en);
});

