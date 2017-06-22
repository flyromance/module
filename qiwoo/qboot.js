(function () {

    var qboot = {
        /**
         * 轮询执行某个task，直到task返回false或者超过轮询最大次数上限
         * 如果成功超过轮询上限，执行complete，否则执行abort
         * @param task 轮询的任务
         * @param step 轮询间隔，以毫秒为单位
         * @param max 最大轮询次数
         * @param complete 超过最大次数，轮询成功
         * @param abort task返回false，轮询被中断
         */
        poll: function (task, step, max, complete, abort) {
            step = step || 100;
            if (max == null) max = Infinity;
            if (max <= 0) {
                complete && complete();
                return;
            }

            if (task() !== false) {
                setTimeout(function () {
                    qboot.poll(task, step, max - 1, complete, abort);
                }, step);
            } else {
                abort && abort();
            }
        },
        /**
         * 等待直到cond条件为true执行success
         * 如果等待次数超过max，则执行failer
         * @param cond await条件，返回true则执行success，否则继续等待，直到超过等待次数max，执行failer
         * @param success await成功
         * @param failer await失败
         * @param step 时间间隔
         * @param max 最大次数
         */
        await: function (cond, success, failer, step, max) {
            qboot.poll(function () {
                if (cond()) {
                    success();
                    return false;
                }
                return true;
            }, step, max, failer);
        },
        /**
         * jsonp
         * @param url 接口地址
         * @param data 接口地址参数，对象{}, 需要encodeURIJson为 xxx&xxx
         * @param callback 回调函数
         * @param opt 配置参数
         */
        jsonp: (function () {
            var reqMap = {},
                seq = 0,
                threshold = 600000; // 默认10分钟更新一次缓存，因为存在CDN回原的问题，需要这么设置

            var monitorData = {};

            var jsonpRet = function (url, data, callback, opt) {
                if (typeof data !== 'object') {
                    opt = callback;
                    callback = data;
                    data = null;
                }

                // 合并配置参数
                opt = qboot.mix(opt || {}, {
                    jsonp: '_callback',
                    timeout: 30000,
                    threshold: threshold
                });

                // 配置接口地址
                if (data) {
                    url += (/\?/.test(url) ? "&" : "?") + qboot.encodeURIJson(data);
                }

                //为url生成callback名
                //为了不让CDN失效，唯一的url对应唯一的名字
                var jsonp;
                jsonp = reqMap[url] = reqMap[url] || opt['cb'] || ('__jsonp' + (seq++) + '__');

                monitorData[jsonp] = {
                    url: url,
                    startTime: +new Date()
                };

                url += (/\?/.test(url) ? "&" : "?") + opt.jsonp + '=' + encodeURIComponent(jsonp) + '&t=' + Math.floor((new Date()).getTime() / opt.threshold);

                if (!window[jsonp]) {
                    window[jsonp] = (function () {

                        var list = []; //初始化一个队列

                        var ret = function (data, err) {
                            monitorData[jsonp].endTime = +new Date();
                            jsonpRet.fire('resourceLoaded', {data: monitorData[jsonp]});
                            var fn = list.shift(); //从队列里取出要执行的函数
                            if (fn) {
                                fn(data, err);
                            }
                        };

                        //将函数添加到队列的接口
                        ret.add = function (fn) {
                            list.push(fn);
                        };

                        return ret;
                    })();
                }

                var t = setTimeout(function () {
                    window[jsonp](null, {status: 'error', reason: 'timeout'}); //如果超时，返回data为null，reason为timeout
                }, opt.timeout);

                //将函数存放到调用队列里
                //这个是为了支持同时用相同的url参数调用多次接口
                //这里不做返回次序的验证，因此可能服务器返回顺序会交错，但是一般情况下应该没影响
                window[jsonp].add(function (data, err) {
                    clearTimeout(t);
                    if (callback) {
                        err = err || {status: 'ok'};
                        callback(data, err);
                    }
                });

                qload({path: url, type: 'js', force: true});

                qboot.createEvents(jsonpRet);
            };

            jsonpRet.getMonitorData = function () {
                return monitorData;
            };

            return jsonpRet;
        })(),
        /**
         * encodeURI一个Json对象
         * @method encodeURIJson
         * @static
         * @param {json} : 只有一层json，每一键对应的值可以是字符串或字符串数组
         * @returns {string} : 返回被encodeURI结果。
         */
        encodeURIJson: function (json) {
            var s = [];
            for (var p in json) {
                if (json[p] == null) continue;
                if (json[p] instanceof Array) {
                    for (var i = 0; i < json[p].length; i++) {
                        s.push(encodeURIComponent(p) + '[]=' + encodeURIComponent(json[p][i]));
                    }
                } else {
                    s.push(encodeURIComponent(p) + '=' + encodeURIComponent(json[p]));
                }
            }
            return s.join('&');
        },
        mix: function (des, src, map) {
            map = map || function (d, s, i) {
                    // !(des[i] || (i in des)) 这里要加一个des[i]，是因为要照顾一些不可枚举的属性
                    // todo: 就算i是不可枚举属性， i in des 也是返回true
                    if (!i in des) {
                        return d;
                    }
                    return s;
                };
            if (map === true) { //override
                map = function (d, s) {
                    return s;
                }
            }

            for (var i in src) {
                des[i] = map(des[i], src[i], i, des, src);
                if (des[i] === undefined) delete des[i]; //如果返回undefined，尝试删掉这个属性
            }
            return des;
        },

        /**
         * 简版的自定义事件
         */
        createEvents: function (obj) {
            var events = {},
                mix = qboot.mix,
                extend = $.extend;

            extend(true, obj, {
                on: function (evtType, handler) {
                    events[evtType] = events[evtType] || [];
                    if (events[evtType].indexOf(handler) > -1) {
                        return;
                    }
                    events[evtType].push(handler);
                    return true;
                },
                off: function (evtType, handler) {
                    events[evtType] = events[evtType] || [];
                    if (handler) {
                        var idx = events[evtType].indexOf(handler);
                        if (idx < 0) {
                            return false;
                        }
                        // console.log(idx);
                        events[evtType].splice(idx, 1);
                    } else {
                        events[evtType] = [];
                    }
                    // console.log(evtType,events[evtType]);
                    return true;
                },
                fire: function (evtType, args) {
                    args = args || {};
                    extend(true, args, {
                        type: evtType,
                        target: obj,
                        preventDefault: function () {
                            args.returnValue = false;
                        }
                    });
                    var handlers = events[evtType] || [];
                    for (var i = 0; i < handlers.length; i++) {
                        handlers[i](args);
                    }
                    return args.returnValue !== false
                }
            });

            mix(obj, {
                on: function (evtType, handler) {
                    events[evtType] = events[evtType] || [];
                    events[evtType].push(handler);
                },
                fire: function (evtType, args) {
                    args = args || {};
                    mix(args, {
                        type: evtType,
                        target: obj,
                        preventDefault: function () {
                            args.returnValue = false;
                        }
                    });
                    var handlers = events[evtType] || [];
                    for (var i = 0; i < handlers.length; i++) {
                        handlers[i](args);
                    }
                    return args.returnValue !== false
                }
            });

            obj.trigger = obj.fire;
            return obj;
        }
    };

    // cookie 操作
    qboot.cookie = {
        getRaw: function (key) {
            var reg = new RegExp("(^| )" + key + "=([^;]*)(;|\x24)"),
                result = reg.exec(document.cookie);

            if (result) {
                return result[2] || null;
            }

            return null;
        },
        get: function (key) {
            if (typeof key !== 'string') return null;
            var _key = encodeURIComponent(key);
            var _value = qboot.cookie.getRaw(_key);
            return typeof value === 'string' ? decodeURIComponent(_value) : null;
        },
        setRaw: function (key, value, options) {
            options = options || {};
            var expires = options.expires;
            if (typeof options.expires === 'number') {
                expires = new Date();
                expires.setTime(expires.getTime() + options.expires);
            }

            document.cookie = key + "=" + value +
                (options.path ? "; path=" + options.path : "") +
                (expires ? "; expires=" + expires.toGMTString() : "") +
                (options.domain ? "; domain=" + options.domain : "") +
                (options.secure ? "; secure" : '');
        },
        set: function (key, value, options) {
            qboot.cookie.setRaw(encodeURIComponent(key), encodeURIComponent(value), options);
        },
        remove: function (key, options) {
            options = options || {};
            options.expires = new Date(0);
            qboot.cookie.setRaw(encodeURIComponent(key), '', options);
        }
    };

    window.qboot = qboot;
})();