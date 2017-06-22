/**
 * LABjs里主要使用了三种技巧，分别为Script Element、XHR Injection以及Cache Trick
 *
 */

if (ifPreloadScript) {    //当请求的脚本文件是否进行预加载：1、需要预加载 2、浏览器支持预加载

    if (supportRealPreloading) {    //如果支持真正的预加载

        if (supportPreloadPropNatively) {    //支持通过设置script标签的preload属性，实现script的预加载，以及分离加载和执行
            //Nicholas C. Zakas大神的美好愿望，尚未有浏览器支持：http://www.nczonline.net/blog/2011/02/14/separating-javascript-download-and-execution/
            script.onpreload = callback;
            script.newPreload = true;
            script.src = targetUrl;

        } else {

            script.onreadystatechange = callback;    //其实就是指IE浏览器，假设指定了script元素的src属性，IE浏览器里会立即加载
            script.src = targetUrl;    //即使script元素没有被插入页面，callback为预加载后的回调
        }

    }
    else if (inSameDomain) {    //非跨域，采用XHR Injection：请求的脚本与当前页面处于同一个域

        xhr = new XMLHttpRequest();    //由于上个判断已经将IE无情地抛弃在这个条件分支之外，所以大胆地用 new XMLHttpRequest()吧
        xhr.onreadystatechange = callback;
        xhr.open("GET", targetUrl);
        xhr.send();

    }
    else {    //最无奈的后招，Cache Trick，新版chromei已经不支持

        script.onload = callback;
        script.type = 'text/cache';
        script.src = targetUrl;
    }

} else {

    if (canContrlExecutionOrderByAsync) {    //如果能够通过script元素的async属性来强制并行加载的脚本顺序执行
        //kyle大神着力推进的提案，目前已被html5小组接受并放入草案：http://wiki.whatwg.org/wiki/Dynamic_Script_Execution_Order#My_Solution
        script.onload = callback;
        script.async = false;    //将script元素的async设为false，可以保证script的执行顺序与请求顺序保持一致
        script.src = targetUrl;

    }
    else {

        script.onload = callback;
        script.src = targetUrl;
    }
}
