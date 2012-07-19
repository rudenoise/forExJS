/*global document,window*/
var jph = (function (timeout) {
    var j, inject, makeSrc, makeQP, empty,
        //requests = {},//FOR CALLBACK CACHE
        callBacks = {},
        makeCallBack,
        stripCallBack = new RegExp('\\&callback\\=jph\\.callBacks\\.c[0-9]*$|\\?callback\\=jph\\.callBacks\\.c[0-9]*$'),
        //DOM FOR CLONING
        div = document.createElement('div'),
        script = document.createElement('script'),
        //TYPE CHECKERS AND VALIDATORS
        isStr, isBool, isFun, isArr, isObj, isEmptyArr, h, t,
        validURL, validURLRegExp, validParams, lastTS = false;
    j = function (baseURL, unique, valid) {
        // jph(baseURL/str/URL, unique/bool) -> function
        // URL MUST HAVE TRAILING / AND NO QUERY PARAMS
        // JHP ROOT FUNCTION
        var chn;// abbreviation for channel/j[baseURL]
        if (validURL(baseURL) && isBool(unique)) {
            if (j[baseURL] === undefined) {
                j[baseURL] = function (params, success, fail, valid) {
                    // closure(params/arr, success/fun, fail/fun, valid/fun) -> bool
                    // CLOSURE THAT HANDLES REQUESTS MADE ON THIS CHANNEL
                    if (validParams(params) && isFun(success) && isFun(fail)) {
                        if (chn.unique && chn.node.children.length > 0) {
                            chn.clear();
                            delete callBacks[chn.last];
                            callBacks[chn.last] = (function (cbID, lastURL) {
                                return function (data) {
                                    delete callBacks[cbID];
                                    // TO CACHE:
                                    //requests[lastURL] = data;
                                };
                            }(chn.last, chn.lastSrc));
                        }
                        chn.last = makeCallBack(chn, success, fail, params, valid);
                        inject(chn, makeSrc(params, chn.last));
                        return chn.last;
                    }
                    return false;
                };
                chn = j[baseURL];//CREATE chn SHORTCUT
                chn.unique = unique;
                chn.URL = baseURL;
                chn.node = div.cloneNode(false);
                chn.clear = function () {
                    // CLEAR ALL CHILD SCRIPT TAGS
                    if (chn.node.children.length > 0) {
                        return empty(chn.node);
                    }
                    return false;
                };
                document.body.appendChild(chn.node);
            }
            j[baseURL].node.setAttribute('class',
                'JSONP' + (unique ? ' unique' : ''));
            return j[baseURL];
        }
        return false;
    };
    j.clear = function () {
        // jph.clear() -> bool
        // removes script tags from channels
        var rtn = false, k;
        for (k in j) {
            if (j.hasOwnProperty(k) && j[k].node !== undefined) {
                rtn = true;
                j[k].clear();
                document.body.removeChild(j[k].node);
                delete j[k];
            }
        }
        return rtn;
    };
    j.callBacks = callBacks;
    // THE CACHE, THAT ISN'T IN YET
    //j.requests = requests;
    // PRIVATE
    // TODO: IMPROVE URL VALIDATION
    validURLRegExp = new RegExp('^[a-z]*:\\/\\/[a-z0-9\\.\\/\\-\\_]*\/$');
    validURL = function (str) {
        return isStr(str) && validURLRegExp.test(str);
    };
    validParams = function (arr) {
        return isArr(arr) ?
                arr.length === 1 ?
                        isObj(h(arr)) || isStr(h(arr)) ?
                                true : false :
                                isStr(h(arr)) ?
                                validParams(t(arr)) : false :
                false;
    };
    makeSrc = function (params, cbID) {
        // makeSrc(['a', 'b', 'c', {d: '1'}])
        // -> 'a/b/c?d=1'
        var p = params.length - 1;
        return isObj(params[p]) ?
            // last arg is query params
                params.slice(0, p).join('/') +
                makeQP(params.slice(p)[0]) +
                'callback=jph.callBacks.' + cbID :
                params.join('/') + '?callback=jph.callBacks.' + cbID;
    };
    makeQP = function (obj) {
        // makeQP({a: 'b', c: 'd'}) -> '?a=b&c=d'
        // make Query Param
        var str = ['?'], k;
        for (k in obj) {
            if (obj.hasOwnProperty(k)) {
                str = str.concat([k, '=', obj[k].toString(), '&']);
            }
        }
        return str.join('');
    };
    makeCallBack = function (chn, s, f, params, valid) {
        var id, ts, r;
        ts = new Date().getTime();
        id = 'c' + ts + (Math.floor(Math.random() * 1000));
        callBacks[id] = function (data) {
            //console.log('callback', id, data);
            chn.node.removeChild(document.getElementById(id));
            delete j.callBacks[id];
            r = isFun(valid) ?
                    valid(data) ?
                            s(data) : f(data) :
                        s(data);
        };
        callBacks[id].fail = function (data) {
            //console.log('Fail!!!', id);
            var node = document.getElementById(id);
            if (node !== null) {
                chn.node.removeChild(node);
            }
            delete j.callBacks[id];
            f(params);
        };
        callBacks[id].ts = ts;
        lastTS = ts;
        return id;
    };
    script.type = 'text/javascript';
    inject = function (chn, src) {
        var scNode = script.cloneNode(false);
        scNode.setAttribute('src', chn.URL + src);
        scNode.setAttribute('id', chn.last);
        chn.node.appendChild(scNode);
        chn.lastSrc = chn.URL + src.replace(stripCallBack, '');
        return scNode;
    };
    empty = function (channelNode) {
        var r;
        // remove all children from channelNode
        if (channelNode.children.length === 0) {
            r = true;
        } else {
            delete callBacks[channelNode.firstChild.getAttribute('id')];
            channelNode.removeChild(channelNode.firstChild);
            r = empty(channelNode);
        }
        return r;
    };
    window.setInterval(function () {
        var time = new Date().getTime(), k;
        for (k in callBacks) {
            if (callBacks.hasOwnProperty(k)) {
                if ((callBacks[k].ts + timeout) < time) {
                    callBacks[k].fail();
                }
            }
        }
        // CLEAR OUTSTANDING CALLBACKS (FF)
        if (lastTS !== false && (lastTS + (timeout * 4)) < time) {
            for (k in callBacks) {
                delete callBacks[k];
            }
            lastTS = false;
        }
    }, timeout / 4);
    // TYPE CHECKER SHORTCUTS (CURRENTLY DEPENDENT ON q.js https://github.com/rudenoise/Q.JS)
    isStr = window.q.isS;
    isBool = window.q.isB;
    isFun = window.q.isF;
    isArr = window.q.isA;
    isEmptyArr = window.q.isEA;
    isObj = window.q.isO;
    h = window.q.h;
    t = window.q.t;
    return j;
}(window.timeout || 3000));
// TEMP DEFAULT T/O 3 SEC
