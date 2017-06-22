(function () {

    var modules = {};
    var baseUrl = '';
    var pathMap = {};
    var STATUS = {
        LOADING: 0,
        LOADED: 1,
        EXECUTED: 2
    };

    var head = document.getElementsByTagName('head')[0];
    var scriptClassName = +new Date();

    function isType(obj, type) {
        return Object.prototype.toString.call(obj) === "[object " + type + "]"
    }

    function loadScript(url, callback) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = false;
        script.className = scriptClassName;
        script.src = url;

        if (script.readyState) {
            script.onreadystatechange = function () {
                if (script.readyState == 'complete' || script.readyState == 'loaded') {
                    script.onreadystatechange = null;
                    callback && callback();
                }
            }
        } else {
            script.onload = function () {
                callback && callback();
            }
        }

        head.insertBefore(script, document.getElementsByTagName('script')[0]);
    }

    function parseSrc(id) {
        var ret, firstOne, firstTwo, temp;
        id = pathMap[id] || id; // 在config中配置过的路径
        firstOne = id.slice(0, 1);
        firstTwo = id.slice(0, 2);

        // 如果是绝对路径：http(s)://xxx , //xxx , /xxx
        if (/^(http(s)?:)?\/\/?/.test(id)) {
            ret = id;
        } else if (firstTwo == './') { // ./xx/xx.js
            ret = baseUrl + id.slice(1);
        } else if (firstTwo == '..') { // ../xx/xx.js
            temp = baseUrl;
            id = id.replace(/\.\.\//g, function (all) {
                temp = temp.slice(0, temp.lastIndexOf('/'));
                return '';
            });
            ret = temp + '/' + id;
        } else { // xx/xx.js
            ret = baseUrl + '/' + id;
        }

        // 末尾添加.js
        if (!/\.js$/.test(ret)) {
            ret += '.js'
        }

        return ret;
    }

    function parseSrcs(deps) {
        var ret = [];
        for (var i = 0; i < deps.length; i++) {
            ret.push(parseSrc(deps[i]));
        }
        return ret;
    }

    // 获取正在解析执行的js文件的路径src
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

    function fireFactory(id) {
        var parsed_id = parseSrc(id);
        var _module = modules[parsed_id];
        var args = [],
            parsed_deps = parseSrcs(_module.deps),
            parents = _module.parents;

        // 获取模块所依赖的模块的exports
        for (var i = 0; i < parsed_deps.length; i++) {
            args.push(modules[parsed_deps[i]].exports);
        }

        // 返回值为该主模块的exports
        _module.exports = _module.factory.apply(null, args);

        // 模块执行完毕
        _module.status = STATUS.EXECUTED; 

        // 一个模块执行完毕，就要通知依赖它的父模块，父模块可能可以执行了
        for (var j = 0; j < parents.length; j++) {
            parsed_parent_id = parseSrc(parents[j]); 
            exeCuteModule(parents[j], modules[parsed_parent_id].deps, modules[parsed_parent_id].factory);
        }
    }

    /**
     * @param: id {string} 
     * @param: deps {array} 
     * @param: factory {function} 
     * @return: undefined
     */
    function exeCuteModule(id, deps, factory) {
        var parsed_id = parseSrc(id); // 获取唯一路径
        var parsed_deps = parseSrcs(deps); // 

        // require or define(模块不是动态插入，而是直接写在页面上)
        if (!modules[parsed_id]) {
            modules[parsed_id] = {
                deps: deps,
                parents: [],
                factory: factory,
                status: STATUS.LOADED,
                exports: {}
            };
        } else { // 动态插入的define模块
            modules[parsed_id].status = STATUS.LOADED;
            modules[parsed_id].factory = factory;
            modules[parsed_id].deps = deps;
        }

        var lens, num = 0, executedNum = 0, i, j, _module;
        for (i = 0, lens = parsed_deps.length; i < lens; i++) {
            _module = modules[parsed_deps[i]];
            num++;
            if (!_module) {
                modules[parsed_deps[i]] = _module = {
                    parents: [id],
                    status: STATUS.LOADING,
                    exports: {}
                }
                loadScript(parsed_deps[i]);
            } else {
                if (_module.status == STATUS.EXECUTED) {
                    executedNum++;
                }
            }        
            if (_module.parents.indexOf(id) < 0) {
                _module.parents.push(id);
            }
        }

        // 代表主模块依赖的模块都加载完毕
        if (num == executedNum) {
            fireFactory(id, deps, factory);
        }
    }

    function define(id, deps, factory) {
        // 处理参数
        if (arguments.length == 1) {
            factory = id;
            deps = [];
            id = getCurrentScriptSrc();
        } else if (arguments.length == 2) {
            if (typeof id == 'string') {
                factory = deps;
                deps = [];
            }
            if (isType(id, 'Array')) {
                factory = deps;
                desp = id;
                id = getCurrentScriptSrc();
            }
        }

        exeCuteModule(id, deps, factory);
    }

    function require(deps, factory, id) {
        id = id || new Date().getTime() + ''; 
        exeCuteModule(id, deps, factory); 
    }

    require.config = function (conf) {
        if (typeof conf.baseUrl === 'string' && conf) {
            baseUrl = conf.baseUrl
        }
        if (isType(conf.paths, 'Object')) {
            for (var key in conf.paths) {
                if (conf.paths.hasOwnProperty(key)) {
                    pathMap[key] = conf.paths[key];
                }
            }
        }
    }

    window.define = define;
    window.require = require;
    window.modules = modules;

})();
