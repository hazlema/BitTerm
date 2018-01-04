var ansi       = require('ansi');
var cursor     = ansi(process.stdout);

/******************************************************
 * Desc: Color formatting for the terminal
 ******************************************************/
var write = function(str, params) {
    var colorNext = false;
    if (str === undefined) str = '';

    // Replace ${...}
    if (params) { 
        for (let i of str.match(/[${](\w+)[}]/g).entries()) {
            rep = i[1].replace("{", "").replace("}", "");
            str = str.replace('$'+i[1], params[parseInt(rep)]);
        }
    }
    
    // Colorize
    for (counter = 0; counter < str.length; counter++) {
        if (colorNext) {
            cursor.fg.reset();
            cursor.bg.reset();

            switch (str[counter]) {
                case 'w': cursor.fg.white();         break;
                case 'W': cursor.fg.brightWhite();   break;
                case 'b': cursor.fg.blue();          break;
                case 'B': cursor.fg.brightBlue();    break;
                case 'c': cursor.fg.cyan();          break;
                case 'C': cursor.fg.brightCyan();    break;
                case 'e': cursor.fg.green();         break;
                case 'E': cursor.fg.brightGreen();   break;
                case 'm': cursor.fg.magenta();       break;
                case 'M': cursor.fg.brightMagenta(); break;
                case 'r': cursor.fg.red();           break;
                case 'R': cursor.fg.brightRed();     break;
                case 'y': cursor.fg.yellow();        break;
                case 'Y': cursor.fg.brightYellow();  break;
                case 'g': cursor.fg.black();         break;
                case 'G': cursor.fg.brightBlack();   break;
                case 'n': console.log();             break;
                case 's': cursor.beep();             break;  // System Beep
            }

            colorNext = false;
        } else 
            if (str[counter] == '^') 
                colorNext = true; 
            else 
                cursor.write(str[counter]);
    }
}

var writeLine = function(str, params) {
    if (str === undefined) str = '';
    return write(str + '^n', params)
}

/******************************************************
 * Desc: Convert scientific notation to a long string
 ******************************************************/
Number.prototype.noExponents = function () {
    var data = String(this).split(/[eE]/),
        z    = '';
    
    if (data.length === 1) { return data[0]; }
    
    var sign = this < 0 ? '-' : '',
        str  = data[0].replace('.', ''),
        mag  = Number(data[1]) + 1;

    if (mag < 0) {
        z = sign + '0.';
        while (mag++) 
            z += '0';
        
        return z + str.replace(/^\-/,'');
    }

    mag -= str.length;
    while (mag--) 
        z += '0';
    
    return str + z;
};

/******************************************************
 * Desc: Make sure there are two decimal places
 ******************************************************/
Number.prototype.twoDec = function() {
    var str = this + '';

    if (str.includes('.')) {
        if ((str.length - str.indexOf('.') - 1) == 1)
            str += '0';
    }
    return str;
};

/******************************************************
 * Desc: Reverse a string
 ******************************************************/
String.prototype.reverse = function() {
    return this.split("").reverse("").join("");
}

/******************************************************
 * Desc: Insert color into string in groups of 3
 ******************************************************/
String.prototype.insertColors = function(Color1, Color2, reverse) {
    var srcStr = this;

    if (reverse)
        srcStr = srcStr.reverse();
    
    var iterator = srcStr.split(/(\d{3})/).entries(), 
        endStr   = "",
        color    = Color2;

    if (reverse)
        color = Color2.reverse();
    
    for (let e of iterator) {
        if (e[1] != '') {
            if (reverse) endStr += e[1] + color; else endStr += color + e[1];
        
            if (reverse)
                if (color == Color1.reverse()) color = Color2.reverse(); else color = Color1.reverse();
            else
                if (color == Color1) color = Color2; else color = Color1;
        }
    }
    
    if (reverse)
        endStr = endStr.reverse();

    return endStr;
}

/******************************************************
 * Desc: Colorize a big number w/ Dec
 ******************************************************/
String.prototype.toColorNumber = function(Color1, Color2) {
    var src = '' + this,
        seg = [];
    
    if (src.includes(".") ) {
        seg = src.split('.');
        
        seg[0] = seg[0].insertColors(Color1, Color2, true);
        seg[1] = seg[1].insertColors(Color1, Color2, false);
        
        src = seg[0] + '^R.' + seg[1];
    }
    return src;
}

Number.prototype.toColorNumber = function(Color1, Color2) {
    return (this + '').toColorNumber(Color1, Color2);
}

Number.prototype.padEnd   = function(args) { return ('' + this).padEnd(args);   };
Number.prototype.padStart = function(args) { return ('' + this).padStart(args); };

    
module.exports = {
  ansi,
  cursor,
  write,
  writeLine
}
