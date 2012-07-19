var tpl = (function () {
    var t, currency, currencies, index, makeGLink;
    t = function (d) {
        var arr = [];
        arr.push(index(d.all));
        arr.push(['h1', 'Data @ ' + (new Date(d.timestamp * 1000))]);
        arr.push(currencies(d.all));
        arr.push(['p', 'Data via ', ['a', {
            target: 'blank',
            href: 'http://openexchangerates.org/'
        }, 'Open Exchange Rates']]);
        return arr;
    };
    makeGLink = function (key, all) {
        var rtn = [
            'http://www.google.co.uk/finance?chdnp=1&chdd=1&chds=1&chdv=1&chvs=Linear&chdeh=0&chfdeh=0&chdet=1339487285444&chddm=39446&cmpto=',
        ], k;
        for (k in all) {
            if (key !== k) {
                rtn.push('CURRENCY:' + key + k + ';');
            }
        }
        rtn.push('&cmptdms=0;0;0;0;0&q=CURRENCY:' + key + (key === 'GBP' ? 'USD' : 'GBP') +'&ntsp=0');
        return rtn.join('');
    };
    index = function (d) {
        var arr = ['p'], k;
        for (k in d) {
            arr.push(['a', {href: '#' + k}, k + ', ']);
        }
        return arr;
    };
    currencies = function (d) {
        var arr = ['div'];
        for (k in d) {
            arr.push([
                'div',
                {
                    style: 'border: 1px solid',
                    id: k
                },
                ['h2', '1 ' + k + ':'],
                ['p', 'View Chart ', ['a', {
                    target: 'blank',
                    href: makeGLink(k, forEx.currencies)
                }, 'Google Finance']],
                currency(d[k])]);
        };
        return arr;
    };
    currency = function (d) {
        var arr = ['table'];
        for (k in d) {
            arr.push(row(k, d[k].old));
        }
        return arr;
    };
    row = function (title, old) {
        var tr = ['tr'], i, l, cell;
        tr.push(['th', {align: 'left'}, title]);
        l = old.length;
        for (i = 0; i < l; i += 1) {
            cell = old[i];
            mve = i === 0 ? 0 : cell.move;
            tr.push(['td', {
                align: 'left',
                style: {
                    background: (i === 0 ?
                        '#DFFFA5':
                        mve === 0 ?
                            'white' :
                            mve > 0 ?
                                '#DFFFA5':
                                '#FFCCCC'),
                    border: mve > 0.2 || mve < -0.2 ?
                        '1px solid' :
                        ''
                }
            }, forEx.round(cell.price) + ' (' + forEx.round(mve) + '%)']);
        }
        return tr;
    };
    return t;
})();
