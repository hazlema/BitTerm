/*
 * BitTerm v1, Simple Bitcoin Tracking & Alerts
 * By: FrostyCrits (BTC: 1LbEr6BAqcwKjJywvWQmwVSV289W7eQBUq
 *
 * If you use this, please donate to my BTC address
 */
global.fetch   = require('node-fetch')

var cc         = require('cryptocompare')
var fs         = require('fs');
var ansi       = require('ansi')
var cursor     = ansi(process.stdout)
var events     = require('events');

var BTCUpdate  = new events.EventEmitter();
var inputArray = new Array();
var inputTask  = "";
var Refresh;

var symbols    = {};
var suspend    = false;
var prompt     = "^n^G[" +
                "^CQ^wuit^G : " +
                "^CC^wurrency^G : " +
                "^CS^wearch^G : " +
                "^CD^wetails" +
                 "^G]^n^G[: "+
                 "^CU^wpdate^G : " +
                 "^CA^wdd^G : " +
                 "^CR^wemove^G : " +
                 "^CL^wimits " +
                 "^G:]: ^W";

var currencies = {
    BBD: 'Barbadian or Bajan Dollar',       BSD: 'Bahamian Dollar',             CAD: 'Canadian Dollar',             JMD: 'Jamaican Dollar',
    MXN: 'Mexican Peso',                    USD: 'US Dollar',                   XCD: 'East Caribbean Dollar',       BZD: 'Belizean Dollar',
    TTD: 'Trinidadian Dollar',              BGN: 'Bulgarian Lev',               CHF: 'Swiss Franc',                 CZK: 'Czech Koruna',
    DKK: 'Danish Krone',                    EUR: 'Euro',                        GBP: 'British Pound',               HRK: 'Croatian Kuna',
    HUF: 'Hungarian Forint',                ILS: 'Israeli Shekel',              NOK: 'Norwegian Krone',             PLN: 'Polish Zloty',
    RON: 'Romanian Leu',                    RSD: 'Serbian Dinar',               SEK: 'Swedish Krona',               TRY: 'Turkish Lira',
    BWP: 'Botswana Pula',                   GHS: 'Ghanaian Cedi',               KES: 'Kenyan Shilling',             LSL: 'Basotho Loti',
    MUR: 'Mauritian Rupee',                 MWK: 'Malawian Kwacha',             SZL: 'Swazi Lilangeni',             TND: 'Tunisian Dinar',
    ZAR: 'South African Rand',              ZMW: 'Zambian Kwacha',              AED: 'Emirati Dirham',              BHD: 'Bahraini Dinar',
    HKD: 'Hong Kong Dollar',                JOD: 'Jordanian Dinar',             JPY: 'Japanese Yen',                KWD: 'Kuwaiti Dinar',
    LKR: 'Sri Lankan Rupee',                OMR: 'Omani Rial',                  PHP: 'Philippine Peso',             PKR: 'Pakistani Rupee',
    QAR: 'Qatari Riyal',                    SAR: 'Saudi Arabian Riyal',         SGD: 'Singapore Dollar',            THB: 'Thai Baht',
    AUD: 'Australian Dollar',               FJD: 'Fijian Dollar',               NZD: 'New Zealand Dollar'
}

/* Default Values */
var coins    = {
    "BTC":   [0, 0, 0, false],
    "ETH":   [0, 0, 0, false],
    "LTC":   [0, 0, 0, false],
    "XVG":   [0, 0, 0, false],
    "XRP":   [0, 0, 0, false],
    "DOGE":  [0, 0, 0, false]
}

var settings = {
    isAerts:  false, 
    email:    '', 
    pollTime: 30000, 
    currency: 'USD' 
}

/* Convert scientific notation */
Number.prototype.noExponents = function() {
    var data = String(this).split(/[eE]/);
    if (data.length == 1) return data[0]; 
    var z    = '', sign = this < 0 ? '-' : '',

    str = data[0].replace('.', ''),
    mag = Number(data[1]) + 1;

    if (mag < 0){
        z = sign + '0.';
        while(mag++) z += '0';
        return z + str.replace(/^\-/,'');
    }

    mag -= str.length;  
    while(mag--) z += '0';
    return str + z;
}

/* Make sure there are 2 decimal places */
Number.prototype.twoDec = function() {
    var str = this + '';

    if (str.includes('.')) {
        if ((str.length - str.indexOf('.') - 1) == 1)
            str += '0';
    }

    return str;
}

/* Color formatting for the terminal */
var cWrite = function(str) {
    colorNext = false;

    for (counter=0; counter<str.length; counter++) {
        if (colorNext) {
            cursor.fg.reset();
            cursor.bg.reset();

            switch (str[counter]) {
                case 'w': cursor.fg.white();    break;        case 'W': cursor.fg.brightWhite();    break;
                case 'b': cursor.fg.blue();     break;        case 'B': cursor.fg.brightBlue();     break;
                case 'c': cursor.fg.cyan();     break;        case 'C': cursor.fg.brightCyan();     break;
                case 'e': cursor.fg.green();    break;        case 'E': cursor.fg.brightGreen();    break;
                case 'm': cursor.fg.magenta();  break;        case 'M': cursor.fg.brightMagenta();  break;
                case 'r': cursor.fg.red();      break;        case 'R': cursor.fg.brightRed();      break;
                case 'y': cursor.fg.yellow();   break;        case 'Y': cursor.fg.brightYellow();   break;
                case 'g': cursor.fg.black();    break;        case 'G': cursor.fg.brightBlack();    break;
                case 'n': console.log();        break;        case 's': cursor.beep();              break;
            }

            colorNext = false;
        } else 
            if (str[counter] == '^') 
                colorNext = true; 
            else 
                cursor.write(str[counter]);
    }
}

/* Get a list of symbols */
var getSymbols = function() {
    Coins = new Array();

    cc.coinList().then(coinList => { 
        for (let Coin in coinList.Data) {
            sym = coinList.Data[Coin].Symbol.replace('*', '');
            nam = coinList.Data[Coin].CoinName;
            symbols[sym] = nam;
        }

        /* Not needed but could be usefull */
        fs.writeFile("symbols.json", JSON.stringify(symbols, null, 2), function(){});
        forceUpdate();
    });
    return Coins;
}

/* Is this a symbol? */
var isSymbol = function(sym) {
    if (!symbols[sym]) {
        cWrite("^n^R> ^G[^C"+sym+"^G] ^wis not a symbol.^n");
        return false;
    }

    return true;
}

/* Get new BTC Data */
var forceUpdate = function() {
    if (!suspend) {
        theseCoins = new Array();
        
        for (let c in coins) 
            theseCoins.push(c);
    
        cc.priceMulti(theseCoins, [settings.currency, 'BTC']).then(prices => { BTCUpdate.emit('updates', prices) });
        
        clearInterval(Refresh);
        Refresh = setInterval(forceUpdate, settings.pollTime);
    }
}

var viewDetail = function(key, d) {
    s = d[key][settings.currency];

    cWrite("^n");
    cWrite("^R> ^WSymbol      ^G: ^C" + key + "^n");
    cWrite("^R> ^WName        ^G: ^C" + symbols[key] + "^n");
    
    if ( coins[key] ) {
        cWrite("^n");
        if (coins[key][0] == 0) 
            cWrite("^R> ^YUpper Limit ^G: ^RUpper limit is not set.^n");
        else
            cWrite("^R> ^YUpper Limit ^G: ^C" + coins[key][0].twoDec() + "^G " + settings.currency + "^n");

        if (coins[key][1] == 0) 
            cWrite("^R> ^YLower Limit ^G: ^RLower limit is not set.^n");
        else
            cWrite("^R> ^YLower Limit ^G: ^C" + coins[key][1].twoDec() + "^G " + settings.currency + "^n");
    }

    cWrite("^n");
    cWrite("^R> ^WPrice       ^G: $^C" + s.PRICE + "^G " + settings.currency + "^n");
    cWrite("^R> ^W24hr Open   ^G: $^C" + s.OPEN24HOUR + "^G " + settings.currency + "^n");
    cWrite("^R> ^W24hr High   ^G: $^C" + s.HIGH24HOUR + "^G " + settings.currency + "^n");
    cWrite("^R> ^W24hr Low    ^G: $^C" + s.LOW24HOUR + "^G " + settings.currency + "^n");
    cWrite("^n");
    cWrite("^R> ^W24hr Volume ^G: ^C" + s.VOLUME24HOUR + "^n");
    cWrite("^R> ^W24hr Change ^G: ^C" + s.CHANGE24HOUR + "^n");
    cWrite("^n");
    cWrite("^R> ^WSupply      ^G: ^C" + s.SUPPLY + "^n");
    cWrite("^R> ^WMarket Cap  ^G: ^C" + s.MKTCAP + "^n");
    cWrite(prompt);
    
    suspend = false;
}

/* New BTC Data 6*/
BTCUpdate.on('updates', function(coinData) {
    lenBTC = 0;
    lenUSD = 0;
    lenNME = 0;

    if (! suspend) {
        cWrite("^n^n^R> ^wLast update^G: ^W" + (new Date()).toLocaleString().replace(/-/g, "^G-^W").replace(/:/g, "^G:^W") + "^n^n");

        /* Determin padding size */
        for (let thisCoin in coinData) {
            BTC = coinData[thisCoin].BTC.noExponents();
            USD = coinData[thisCoin][settings.currency].noExponents();
            NME = symbols[thisCoin];

            lenBTC = lenBTC > BTC.length ? lenBTC : BTC.length;
            lenUSD = lenUSD > USD.length ? lenUSD : USD.length;
            lenNME = lenNME > (NME.length && NME.length <= 10) ? lenNME : NME.length;
        }

        /* Display the data */
        for (let thisCoin in coinData) {
            /* Select color based on last price */ 
            clr = "^Y";
            if (coins[thisCoin][2] > coinData[thisCoin][settings.currency]) clr = "^R";
            if (coins[thisCoin][2] < coinData[thisCoin][settings.currency]) clr = "^E";

            strCoin = ('' + thisCoin).padStart(7);
            strBTC  = ('' + coinData[thisCoin].BTC.noExponents()).padEnd(lenBTC + 1);
            strUSD  = ('' + coinData[thisCoin][settings.currency]).padStart(lenUSD);
            strNME = symbols[thisCoin].length >= 10 ? symbols[thisCoin].substr(0, 8) : symbols[thisCoin].padEnd(lenNME + 1);
 
           /* Show a warning */
            warnTxt = "";
            if (coins[thisCoin][0] != 0 && coins[thisCoin][0] < coinData[thisCoin][settings.currency]) 
                warnTxt = " ^s^G: ^MAbove Limit^G: ^W" + coins[thisCoin][0] + " " + settings.currency;

            if (coins[thisCoin][1] != 0 && coins[thisCoin][1] > coinData[thisCoin][settings.currency]) 
                warnTxt = " ^s^G: ^MBelow Limit^G: ^W" + coins[thisCoin][1] + " " + settings.currency;

            cWrite("^W" + strCoin + " ^G: ^C" + strNME + " ^G: ^W" + strBTC + "^wcoin ^G: ^W" + clr + strUSD + " " + settings.currency + warnTxt + "^n");
        } 

         /* Update all the last prices */
        for (let c in coins) 
            coins[c][2] = coinData[c][settings.currency];

        cWrite(prompt);
    }
});

/* Menu system */
function menuHandler(key) {
    if (!(suspend || key.length <= 0)) {
        switch(key[0].toLowerCase()) {
            case 'q': 
                process.exit(); 
                break;

            case 'u': 
                forceUpdate();  
                break;

            case 'a': 
                suspend = true;
                cWrite("^n^G[^wSymbol to add^G]: ^W")
                inputTask = "addSymbol";
                break;

            case 'c': 
                suspend = true;
                cWrite("^n^R> ^CTop Currencies^n^n");
                cWrite("^R> ^CUSD ^G: ^wUSA            ^CEUR ^G: ^wEuro         ^CGBP ^G: ^wBritish Pound^n");
                cWrite("^R> ^CAUD ^G: ^wAustralian     ^CCAD ^G: ^wCanadian     ^CSGD ^G: ^wSingapore^n");
                cWrite("^R> ^CMYR ^G: ^wMalaysian      ^CJPY ^G: ^wJapanese     ^CCNY ^G: ^wChinese Yuan^n^n");
                cWrite("^G[^wCurrency abbreviation^G]: ^W")
                inputTask = "addCurrency";
                break;

            case 'r': 
                suspend = true;
                cWrite("^n^G[^wSymbol to remove^G]: ^W")
                inputTask = "removeSymbol";
                break;
                
            case 'l': 
                suspend = true;
                cWrite("^n^G[^wSet ^Cprice^w Limits for Symbol^G]: ^W")
                inputTask = "limit1";
                break;

            case 's': 
                suspend = true;
                cWrite("^n^G[^wSearch^G]: ^W")
                inputTask = "searchSymbols";
                break;

            case 'd': 
                suspend = true;
                cWrite("^n^G[^wEnter symbol^G]: ^W")
                inputTask = "detailSymbol";
                break;
        }
    } else {
        switch(inputTask) {
            case 'addSymbol':
                if (isSymbol(key.toUpperCase())) {
                    coins[key.toUpperCase()] = [0,0,0,false];
                    forceUpdate();
                }
                inputTask = "";
                suspend   = false;
                break;

            case 'addCurrency':
                if (currencies[key.toUpperCase().trim()] ) {
                    settings.currency = key.toUpperCase().trim();
                    cWrite("^n^R> ^MCurrency set to^G: ^C" + currencies[key.toUpperCase().trim()] + "^n");
                } else
                    cWrite("^n^R> ^G[^C" + key.toUpperCase().trim() + "^G] ^wis not a valid currency^n");

                    inputTask = "";
                    suspend   = false;
                    break;

            case 'removeSymbol':
                key = key.toUpperCase().trim();

                if (coins[key])
                    delete coins[key];
                else
                    cWrite("^n^R> ^wInvalid selection^n");

                inputTask = "";
                suspend   = false;
                break;

            case 'searchSymbols':
                key = key.toUpperCase().trim();
                
                cWrite("^n");
                Object.entries(symbols).forEach(([sym, nme]) => {
                    if ( sym.toUpperCase().includes(key) || nme.toUpperCase().includes(key) )
                        cWrite("^W" + sym.padStart(7) + " ^G: ^C" + nme + "^n");
                });

                inputTask = "";
                suspend   = false;
                break;

            case "detailSymbol":
                if (isSymbol(key.toUpperCase()))
                    cc.priceFull([key.toUpperCase()], [settings.currency]).then(prices => { viewDetail(key.toUpperCase(), prices); });
                else
                    suspend = false;
                break;
                
            case 'limit1':
                key = key.toUpperCase().trim();
                
                if (coins[key]) {
                    if (inputArray[0] = key) {
                        if (coins[inputArray[0]][0] == 0)
                            cWrite("^G[^wUpper limit ^G(^w0^G: ^wnone^G)]: ^W");
                        else
                            cWrite("^G[^wUpper limit ^G(^w0^G: ^wnone^G, ^G[^CENTER^G]: ^Y" + coins[inputArray[0]][0] + "^G)]: ^W");

                        inputTask = 'limit2';
                    } else {
                        cWrite("^n^R> ^wInvalid selection^n");

                        inputTask = "";
                        suspend   = false;
                    }
                } else {
                    cWrite("^n^R> ^wInvalid selection^n");

                    inputTask = "";
                    suspend   = false;
                }
                break;

            case 'limit2':
                inputArray[1] = parseFloat(key);
        
                if (coins[inputArray[0]][1] == 0)
                    cWrite("^G[^wLower limit ^G(^w0^G: ^wnone^G)]: ^W");
                else
                    cWrite("^G[^wLower limit ^G(^w0^G: ^wnone^G, ^G[^CENTER^G]: ^Y" + coins[inputArray[0]][1] + "^G)]: ^W");

                inputTask = "limit3";
                break; 

            case 'limit3':
                inputArray[2] = parseFloat(key);

                if (!isNaN(inputArray[1])) coins[inputArray[0]][0] = inputArray[1];
                if (!isNaN(inputArray[2])) coins[inputArray[0]][1] = inputArray[2];
        
                inputTask = "";
                suspend   = false;
                break;

        }

        /* Save all settings */
        fs.writeFile("holdings.json", JSON.stringify(coins, null, 2), function(){});
        fs.writeFile("settings.json", JSON.stringify(settings, null, 2), function(){});
    }

    if (!suspend) cWrite(prompt);
}

//==============================================================================================================================//
//==============================================================================================================================//
//==============================================================================================================================//

cWrite("^n");
cWrite("^R> ^WBitTerm Alerts v1^G: ^WBy: ^EFrostyCrits ^G(^wDec, 2017^G)^n");
cWrite("^R> ^WBTC^G: ^Y1LbEr6BAqcwKjJywvWQmwVSV289W7eQBUq^n");

/* Load any saved data */
if (fs.existsSync('./settings.json')) {
    cWrite("^n^R> ^WLoading settings^G...^n");
    settings = require('./settings.json');
} else cWrite("^n^R> ^WUsing default settings^G...^n");

if (fs.existsSync('./holdings.json')) {
    cWrite("^R> ^WLoading holdings^G...^n");
    coins = require('./holdings.json');
} else cWrite("^R> ^WUsing default holdings^G...^n");

/* Fetch latest symbols */
cWrite("^R> ^WFetching symbols^G... ^WPlease Wait^G...");
getSymbols();

/* Start Keyboard input */
process.stdin.setEncoding('utf8');
process.stdin.on('readable', function () {
   var input = process.stdin.read();
   if(input !== null) menuHandler(input.trim());
});

/* Let's get this party started!!! */
Refresh = setInterval(forceUpdate, settings.pollTime);
 