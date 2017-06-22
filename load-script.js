/**
 * Created by Administrator on 2016/1/26.
 */

// 1、压缩js文件

// 2、减少js文件个数，也就是减少http请求个数；1*100kb > 4*25kb

// 3、放在页面底部
//    原因：防止页面假死（js执行过程不阻碍页面其他内容显示）；页面元素可供js操作（DOM结构创建完毕）；

// 4、需要的时候再加载，动态加载脚本，动态
//    原因：复杂的页面难免有很多个js文件，其中一部分也是出于可维护性考虑
function loadScript(url, callback) {
    // 创建script，并指定类型
    var script = document.createElement('script');
    script.type = 'text/javascript';

    // 事件监听，异步的编程，异步加载js文件
    if (script.readyState) { // ie 浏览器
        script.onreadystatechange = function () {
            if (script.readyState == 'loaded' || script.readyState == 'complete') {
                script.onreadystatechange = null;
                typeof callback === 'function' && callback();
            }
        };
    } else { // 其他的浏览器
        script.onload = function () {
            script.onload = null;
            typeof callback === 'function' && callback();
        };
    }

    script.src = url; // 指定下载路径，也可放在监听事件之前；

    // 注意：只有当script插入当文档中时，才开始下载js文件！
    document.getElementsByTagName('head')[0].appendChild(script);
}

function printReadyState(num) {
    console.log(num, document.readyState);
}
