require.config({
	// 来源1：如果有data-main，会根据data-main配置一个baseUrl
	// 来源2：这边配置了baseUrl，回去覆盖requirejs内部的baseUrl
	// 作用：如果require或者define的name不是绝对路径，就要与baseUrl合成，生成一个路径作为script的src
    baseUrl: '/', 

    // 不配置baseUrl，就要写成 a: 'js/a'
    // require或者define的module_name再paths中时，用paths中的值，如果此值为相对路径就与baseUrl相结合，如果为绝对路径直接作为src
    paths: {
        a: 'a',
        b: 'b',
        c: 'js/module/c',
        d: 'd',
        jquery: 'js/lib/jquery'
    },

    // b.js中的写法就要用下面这种方式来调用~，新版本可以不用这个方法来申明！
    shim: {
        b: {
            exports: 'b'
        }
    }
});

console.log(3);