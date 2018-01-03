/*
 * BitTerm v1, Simple Bitcoin Tracking & Alerts
 * By: FrostyCrits (BTC: 1LbEr6BAqcwKjJywvWQmwVSV289W7eQBUq
 *
 * If you use this, please donate to my BTC address
 */
global.fetch   = require('node-fetch');

var cc         = require('cryptocompare');
var fs         = require('fs');
var events     = require('events');
var utils      = require('./utils.js');

var BTCUpdate  = new events.EventEmitter();
var inputArray = [];
var inputTask  = "";
var Refresh;

var symbols    = {};
var suspend    = false;
var prompt     = "^n^G[" +
                 "^CQ^wuit^G : " +
                 "^CC^wurrency^G : " +
                 "^CS^wearch^G : " +
                 "^CD^wetails" +
                 "^G]^n^G[: " +
                 "^CU^wpdate^G : " +
                 "^CA^wdd^G : " +
                 "^CR^wemove^G : " +
                 "^CL^wimits " +
                 "^G:]: ^W";

/******************************************************
 * Desc: Default Values
 ******************************************************/
var currencies = {
    BBD: 'Barbadian or Bajan Dollar',   BSD: 'Bahamian Dollar',     CAD: 'Canadian Dollar',
    JMD: 'Jamaican Dollar',             MXN: 'Mexican Peso',        USD: 'US Dollar',
    XCD: 'East Caribbean Dollar',       BZD: 'Belizean Dollar',     TTD: 'Trinidadian Dollar',
    BGN: 'Bulgarian Lev',               CHF: 'Swiss Franc',         CZK: 'Czech Koruna',
    DKK: 'Danish Krone',                EUR: 'Euro',                GBP: 'British Pound',
    HRK: 'Croatian Kuna',               HUF: 'Hungarian Forint',    ILS: 'Israeli Shekel',
    NOK: 'Norwegian Krone',             PLN: 'Polish Zloty',        RON: 'Romanian Leu',
    RSD: 'Serbian Dinar',               SEK: 'Swedish Krona',       TRY: 'Turkish Lira',
    BWP: 'Botswana Pula',               GHS: 'Ghanaian Cedi',       KES: 'Kenyan Shilling',
    LSL: 'Basotho Loti',                MUR: 'Mauritian Rupee',     MWK: 'Malawian Kwacha',
    SZL: 'Swazi Lilangeni',             TND: 'Tunisian Dinar',      ZAR: 'South African Rand',
    ZMW: 'Zambian Kwacha',              AED: 'Emirati Dirham',      BHD: 'Bahraini Dinar',
    HKD: 'Hong Kong Dollar',            JOD: 'Jordanian Dinar',     JPY: 'Japanese Yen',
    KWD: 'Kuwaiti Dinar',               LKR: 'Sri Lankan Rupee',    OMR: 'Omani Rial',
    PHP: 'Philippine Peso',             PKR: 'Pakistani Rupee',     QAR: 'Qatari Riyal',
    SAR: 'Saudi Arabian Riyal',         SGD: 'Singapore Dollar',    THB: 'Thai Baht',
    AUD: 'Australian Dollar',           FJD: 'Fijian Dollar',       NZD: 'New Zealand Dollar'
};
var coins      = {
    "BTC":   [0, 0, 0, false],
    "ETH":   [0, 0, 0, false],
    "LTC":   [0, 0, 0, false],
    "XVG":   [0, 0, 0, false],
    "XRP":   [0, 0, 0, false],
    "DOGE":  [0, 0, 0, false]
};
var settings   = {
    isAerts:    false,
    email:      '',
    pollTime:   30000,
    currency:   'USD'
};

/******************************************************
 * Desc: Get a list of symbols
 ******************************************************/
var getSymbols = function() {
    Coins = new Array();

    cc.coinList().then(coinList => { 
        for (let Coin in coinList.Data) {
            sym = coinList.Data[Coin].Symbol.replace('*', '');
            nam = coinList.Data[Coin].CoinName;
            symbols[sym] = nam;
        }

        fs.writeFile("symbols.json", JSON.stringify(symbols, null, 2), function(){});
        forceUpdate();
    });

    return Coins;
};

/******************************************************
 * Desc: Is this a symbol?
 ******************************************************/
var isSymbol = function(sym) {
    if (!symbols[sym]) {
        utils.write("^n^R> ^G[^C"+sym+"^G] ^wis not a symbol.^n");
        return false;
    }

    return true;
};

/******************************************************
 * Desc: Get new BTC Data
 ******************************************************/
var forceUpdate = function() {
    if (!suspend) {
        theseCoins = new Array();
        
        for (let c in coins) 
            theseCoins.push(c);
    
        cc.priceMulti(theseCoins, [settings.currency, 'BTC']).then(prices => { BTCUpdate.emit('updates', prices) });
        
        clearInterval(Refresh);
        Refresh = setInterval(forceUpdate, settings.pollTime);
    }
};

/******************************************************
 * Desc: View the details of a symbol
 ******************************************************/
var viewDetail = function(key, d) {
    s = d[key][settings.currency];

    utils.write("^n");
    utils.write("^R> ^WSymbol      ^G: ^C" + key + "^n");
    utils.write("^R> ^WName        ^G: ^C" + symbols[key] + "^n");
    
    if ( coins[key] ) {
        utils.write("^n");
        if (coins[key][0] == 0) 
            utils.write("^R> ^YUpper Limit ^G: ^RUpper limit is not set.^n");
        else
            utils.write("^R> ^YUpper Limit ^G: ^C" + coins[key][0].twoDec() + "^G " + settings.currency + "^n");

        if (coins[key][1] == 0) 
            utils.write("^R> ^YLower Limit ^G: ^RLower limit is not set.^n");
        else
            utils.write("^R> ^YLower Limit ^G: ^C" + coins[key][1].twoDec() + "^G " + settings.currency + "^n");
    }

    utils.write("^n");
    utils.write("^R> ^WPrice       ^G: $^C" + ('' + s.PRICE).toColorNumber('^C', '^c') + "^G " + settings.currency + "^n");
    utils.write("^R> ^W24hr Open   ^G: $^C" + ('' + s.OPEN24HOUR).toColorNumber('^C', '^c') + "^G " + settings.currency + "^n");
    utils.write("^R> ^W24hr High   ^G: $^C" + ('' + s.HIGH24HOUR).toColorNumber('^C', '^c') + "^G " + settings.currency + "^n");
    utils.write("^R> ^W24hr Low    ^G: $^C" + ('' + s.LOW24HOUR).toColorNumber('^C', '^c') + "^G " + settings.currency + "^n");
    utils.write("^n");
    utils.write("^R> ^W24hr Volume ^G: ^C" + ('' + s.VOLUME24HOUR).toColorNumber('^C', '^c') + "^n");
    utils.write("^R> ^W24hr Change ^G: ^C" + ('' + s.CHANGE24HOUR).toColorNumber('^C', '^c') + "^n");
    utils.write("^n");
    utils.write("^R> ^WSupply      ^G: ^C" + ('' + s.SUPPLY).toColorNumber('^C', '^c') + "^n");
    utils.write("^R> ^WMarket Cap  ^G: ^C" + ('' + s.MKTCAP).toColorNumber('^C', '^c') + "^n");
    utils.write(prompt);
    
    suspend = false;
};

/******************************************************
 * Desc: New BTC Data
 ******************************************************/
BTCUpdate.on('updates', function(coinData) {
    lenBTC = 0;
    lenUSD = 0;
    lenNME = 0;

    if (!suspend) {
        utils.write("^n^n^R> ^wLast update^G: ^W" + (new Date()).toLocaleString().replace(/-/g, "^G-^W").replace(/:/g, "^G:^W") + "^n^n");

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

            utils.write("^W" + strCoin + " ^G: ^C" + strNME + " ^G: ^W" + strBTC + "^wcoin ^G: ^W" + clr + strUSD + " " + settings.currency + warnTxt + "^n");
        } 

         /* Update all the last prices */
        for (let c in coins) 
            coins[c][2] = coinData[c][settings.currency];

        utils.write(prompt);
    }
});

/******************************************************
 * Desc: Menu system
 ******************************************************/
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
                utils.write("^n^G[^wSymbol to add^G]: ^W")
                inputTask = "addSymbol";
                break;

            case 'c': 
                suspend = true;
                utils.write("^n^R> ^CTop Currencies^n^n");
                utils.write("^R> ^CUSD ^G: ^wUSA            ^CEUR ^G: ^wEuro         ^CGBP ^G: ^wBritish Pound^n");
                utils.write("^R> ^CAUD ^G: ^wAustralian     ^CCAD ^G: ^wCanadian     ^CSGD ^G: ^wSingapore^n");
                utils.write("^R> ^CMYR ^G: ^wMalaysian      ^CJPY ^G: ^wJapanese     ^CCNY ^G: ^wChinese Yuan^n^n");
                utils.write("^G[^wCurrency abbreviation^G]: ^W")
                inputTask = "addCurrency";
                break;

            case 'r': 
                suspend = true;
                utils.write("^n^G[^wSymbol to remove^G]: ^W")
                inputTask = "removeSymbol";
                break;
                
            case 'l': 
                suspend = true;
                utils.write("^n^G[^wSet ^Cprice^w Limits for Symbol^G]: ^W")
                inputTask = "limit1";
                break;

            case 's': 
                suspend = true;
                utils.write("^n^G[^wSearch^G]: ^W")
                inputTask = "searchSymbols";
                break;

            case 'd': 
                suspend = true;
                utils.write("^n^G[^wEnter symbol^G]: ^W")
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
                    utils.write("^n^R> ^MCurrency set to^G: ^C" + currencies[key.toUpperCase().trim()] + "^n");
                } else
                    utils.write("^n^R> ^G[^C" + key.toUpperCase().trim() + "^G] ^wis not a valid currency^n");

                    inputTask = "";
                    suspend   = false;
                    break;

            case 'removeSymbol':
                key = key.toUpperCase().trim();

                if (coins[key])
                    delete coins[key];
                else
                    utils.write("^n^R> ^wInvalid selection^n");

                inputTask = "";
                suspend   = false;
                break;

            case 'searchSymbols':
                key = key.toUpperCase().trim();
                
                utils.write("^n");
                Object.entries(symbols).forEach(([sym, nme]) => {
                    if ( sym.toUpperCase().includes(key) || nme.toUpperCase().includes(key) )
                        utils.write("^W" + sym.padStart(7) + " ^G: ^C" + nme + "^n");
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
                            utils.write("^G[^wUpper limit ^G(^w0^G: ^wnone^G)]: ^W");
                        else
                            utils.write("^G[^wUpper limit ^G(^w0^G: ^wnone^G, ^G[^CENTER^G]: ^Y" + coins[inputArray[0]][0] + "^G)]: ^W");

                        inputTask = 'limit2';
                    } else {
                        utils.write("^n^R> ^wInvalid selection^n");

                        inputTask = "";
                        suspend   = false;
                    }
                } else {
                    utils.write("^n^R> ^wInvalid selection^n");

                    inputTask = "";
                    suspend   = false;
                }
                break;

            case 'limit2':
                inputArray[1] = parseFloat(key);
        
                if (coins[inputArray[0]][1] == 0)
                    utils.write("^G[^wLower limit ^G(^w0^G: ^wnone^G)]: ^W");
                else
                    utils.write("^G[^wLower limit ^G(^w0^G: ^wnone^G, ^G[^CENTER^G]: ^Y" + coins[inputArray[0]][1] + "^G)]: ^W");

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

    if (!suspend) utils.write(prompt);
}

/******************************************************
 * Desc: Main Block
 ******************************************************/
utils.write("^n");
utils.write("^R> ^WBitTerm Alerts v1^G: ^WBy: ^EFrostyCrits ^G(^wDec, 2017^G)^n");
utils.write("^R> ^WBTC^G: ^Y1LbEr6BAqcwKjJywvWQmwVSV289W7eQBUq^n");

/* Load any saved data */
if (fs.existsSync('./settings.json')) {
    utils.write("^n^R> ^WLoading settings^G...^n");
    settings = require('./settings.json');
} else utils.write("^n^R> ^WUsing default settings^G...^n");

if (fs.existsSync('./holdings.json')) {
    utils.write("^R> ^WLoading holdings^G...^n");
    coins = require('./holdings.json');
} else utils.write("^R> ^WUsing default holdings^G...^n");

/* Fetch latest symbols */
utils.write("^R> ^WFetching symbols^G... ^WPlease Wait^G...");
getSymbols();

/* Start Keyboard input */
process.stdin.setEncoding('utf8');
process.stdin.on('readable', function () {
   var input = process.stdin.read();
   if(input !== null) menuHandler(input.trim());
});

/* Let's get this party started!!! */
Refresh = setInterval(forceUpdate, settings.pollTime);
