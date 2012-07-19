var forEx = (function () {
    var f = {}, oei, app,
        url = 'http://openexchangerates.org/',
        currencies = {
            AUD: {},// Australian Dollars
            //BRL: {},// Bazillian Real
            //CNY: {},// Chinese Yuan
            CAD: {},
            CHF: {},
            EUR: {},// Euro
            GBP: {},// British Pounds
            JPY: {},
            //INR: {},// Indian Rupee
            //SLL: {},// Sierra Leyone, Leyone
            USD: {},//  US Dollars
            XAU: {}
        };
    f.start = function () {
        app.innerHTML = '';
        oe(['latest.json'], f.success, function () {
            lmd(['h1', 'NO DATA'], app);
        });
    };
    f.outside = {};
    f.success = function (data) {
        var d = {};
        f.outside = data;
        d.timestamp = data.timestamp;
        d.all = f.compareAll(f.crunch(data), data.timestamp);
        lmd(tpl(d), app);
    };
    f.crunch = function (d) {
        var k, rtn = {};
        for (k in d.rates) {
            if (k in currencies) {
                rtn[k] = d.rates[k];
            }
        }
        return rtn;
    };
    f.compare = function (key, obj, ts) {
        var rtn = {}, k, dp = 10000, end, val;
        for (k in obj) {
            if (k !== key) {
                rtn[k] = {
                    current: (obj[k] * (1 / obj[key])),
                    old: typeof currencies[key][k] === 'undefined' ?
                        []:
                        currencies[key][k].old
                };
                val = currencies[key][k] = rtn[k];
                end = val.old.length - 1;
                if (end === -1 || val.old[end].ts < ts) {
                    val.old.push({
                        price: rtn[k].current,
                        move: end === -1 ?
                            0:
                            (// % change from last price
                                (rtn[k].current - val.old[end].price) /
                                rtn[k].current
                            ) * 100, 
                            /* move againts last price
                            (val.old[end].price > rtn[k].current ?
                                -(val.old[end].price - rtn[k].current):
                                (rtn[k].current - val.old[end].price)),
                            */
                        ts: ts
                    });
                }
            }
        }
        return rtn;
    };
    f.compareAll = function (currencies, ts) {
        var rtn = {}, k;
        for (k in currencies) {
            rtn[k] = f.compare(k, currencies, ts);
        }
        return rtn;
    };
    f.round = function (val) {
        var dp = 10000;// 4dp
        return Math.round(
            dp *
            val
        ) / dp;
    };
    f.currencies = currencies;
    // PRIVATE
    document.getElementById('ref').addEventListener('click', function () {
        f.start();
    }, false);
    app = document.getElementById('app');
    oe = jph(url, true);
    return f;
})();

// 1st run
forEx.start();
// update every minuite
setInterval(forEx.start, (1000 * 60 * 5));

// GET NEWS FEED:
// https://www.google.co.uk/finance/company_news?q=CURRENCY:GBP&output=json
