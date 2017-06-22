/**
 *  @blog https://gmiam.com/post/xiao-qiao-de-mo-kuai-jia-zai-qi.html
 *  @github https://github.com/ygm125/loader/blob/master/load.js
 */
(function (window) {
    var document = window.document;
    var head = document.head || document.getElementsByTagName('head')[0];
    var moduleClass = 'mod' + new Date() * 1;
    var W3C = document.dispatchEvent;
    var modules = {};
    var baseUrl = (function () {
        var tags = document.getElementsByTagName("script"),
            script = tags[tags.length - 1],
            url = script.hasAttribute ? script.src : script.getAttribute('src', 4);
        return script.getAttribute("data-baseurl") || url.replace(/\/[^\/]+$/, "");
    })();

    var toString = Object.prototype.toString;

    var STATE = { LOADING: 0, LOADED: 1, EXECUTED: 2 };

    var moduleMap = {};

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (item, index) {
            var n = this.length,
                i = ~~index;
            if (i < 0)
                i += n;
            for (; i < n; i++)
                if (this[i] === item)
                    return i;
            return -1;
        }
    }

    function isType(obj, type) {
        return toString.call(obj) === '[object ' + type + ']';
    }

    function log(str) {
        console && console.log(str);
    }

    function loadJS(url, callback) {
        var node = document.createElement("script");
        node.className = moduleClass; //让getCurrentScript只处理类名为moduleClass的script节点
        node[W3C ? "onload" : "onreadystatechange"] = function () {
            if (W3C || /loaded|complete/i.test(node.readyState)) {
                callback && callback();
                node[W3C ? "onload" : "onreadystatechange"] = null;
                // head.removeChild(node);
            }
        };
        node.onerror = function () {
            log('failed load:', url);
        };
        node.src = url;
        head.insertBefore(node, head.firstChild);
    }

    function parseId(id) {
        var url, tmp, ret, spath;
        // 如果id是配置的好的路径
        if (id in moduleMap) {
            id = moduleMap[id];
        }

        // 完整路径 http://www.baidu.com/sss/ddd/xx.js
        if (/^(\w+)(\d)?:.*/.test(id)) {
            ret = id;
        } else {
            tmp = id.charAt(0);
            spath = id.slice(0, 2);
            if (tmp != "." && tmp != "/") { // 当前路径
                ret = baseUrl + "/" + id;
            } else if (spath == "./") { // 当前路径
                ret = baseUrl + id.slice(1);
            } else if (spath == "..") { // 相对路径
                url = baseUrl;
                id = id.replace(/\.\.\//g, function () {
                    url = url.substr(0, url.lastIndexOf("/"));
                    return "";
                });
                ret = url + "/" + id;
            } else { // 绝对路径 /xx/ss/xx.js or //www.baid.com/xxx/sss.js

            }
        }
        if (!/\.js$/.test(ret)) {
            ret += ".js";
        }
        return ret;
    }

    function parseIds(ids) {
        for (var i = 0; i < ids.length; i++) {
            ids[i] = parseId(ids[i]);
        }
        return ids;
    }

    /**
     * @id {string}: 模块路径，唯一标识
     * @parent {string}: 此id对应的模块被parent依赖
     * @return {string}
     */
    function load(id, parent) {
        if (!modules[id]) { //如果之前没有加载过
            modules[id] = {
                state: STATE.LOADING,
                parents: [], // 此模块被依赖的模块数组
                exports: {}
            };
            loadJS(id);
        }

        // 添加模块的被依赖数组
        if (modules[id].parents.indexOf(parent) === -1) {
            modules[id].parents.push(parent);
        }
        return id;
    }

    /**
     * 获取正在解析的js文件的src路径
     * @refer https://github.com/samyk/jiagra/blob/master/jiagra.js
     * @method getCurrentScript
     * @return {string}
     */
    function getCurrentScript() {
        var stack, sourceURL;

        // 强制报错,以便捕获e
        try {
            a.b.c();
        } catch (e) {
            stack = e.stack;
            sourceURL = e.sourceURL;
        }

        // 标准浏览器(IE10、Chrome、Opera、Firefox)
        if (stack) {
            stack = stack.split(/[@ ]/g).pop(); //取得最后一行,最后一个空格或@之后的部分
            stack = stack[0] === "(" ? stack.slice(1, -1) : stack.replace(/\s/, ""); //去掉换行符
            return stack.replace(/(:\d+)?:\d+$/i, ""); //去掉行号与或许存在的出错字符起始位置
        }
        // safari的错误对象只有line, sourceId, sourceURL属性
        else if (sourceURL) {
            return sourceURL;
        }
        // IE 6-9; 正在解析的script标签，此时的readyState == 'interactive'
        else {
            var nodes = head.getElementsByTagName("script"); // 只在head标签中寻找
            for (var i = nodes.length, node; node = nodes[--i];) {
                if (node.className === moduleClass && node.readyState === "interactive") {
                    return node.src;
                }
            }
        }
    }

    function fireFactory(id, deps, factory) {
        var mod = modules[id];
        if (deps) {
            var args = [];
            for (var i = 0; i < deps.length; i++) {
                args.push(modules[deps[i]].exports);
            }
        }
        var ret = factory.apply(null, args);
        if (ret) {
            mod.exports = ret;
        }
        mod.state = STATE.EXECUTED;
        if (mod.parents) {
            for (var j = 0, len = mod.parents.length; j < len; j++) {
                var pid = mod.parents[j];
                require(modules[pid].deps, modules[pid].factory, pid);
            }
        }
    }

    function require(deps, factory, parent) {
        var id = parent || (+new Date + '');
        id = parseId(id);
        deps = parseIds(deps);
        var ni = 0,
            ci = 0;
        for (var i = 0, len = deps.length; i < len; i++) {
            var url = load(deps[i], id);
            if (url) {
                ni++;
                if (modules[url] && modules[url].state === STATE.EXECUTED) {
                    ci++;
                }
            }
        }

        // require([a, b], fn); 标明此模块没有被依赖，没有parent属性
        modules[id] = modules[id] || { deps: deps, factory: factory };

        // parent依赖的模块都执行完毕了
        if (ni === ci) {
            fireFactory(id, deps, factory);
        }
    }

    function define(id, deps, factory) {
        if (arguments.length === 1) {
            factory = id;
            id = getCurrentScript();
            deps = [];
        }
        if (arguments.length === 2) {
            if (isType(id, "String")) {
                factory = deps;
                deps = [];
            }
            if (isType(id, "Array")) {
                factory = deps;
                deps = id;
                id = getCurrentScript();
            }
        }
        id = parseId(id);
        modules[id].factory = factory;
        modules[id].deps = deps;
        modules[id].state = STATE.LOADED;
        require(deps, factory, id);
    }

    require.config = function (conf) {
        baseUrl = conf.baseUrl ? conf.baseUrl : baseUrl;
        var pathMap = conf.paths ? conf.paths : {};
        for (var key in pathMap) {
            if (pathMap[key]) {
                moduleMap[key] = pathMap[key];
            }
        }
    }

    define.amd = {
        modules: modules
    };

    window.require = require;
    window.define = define;

})(window);
