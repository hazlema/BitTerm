String.prototype.reverse = function() {
    return this.split("").reverse("").join("");
}

String.prototype.insertColors = function(Color1, Color2, reverse) {
    var srcStr = this;

    if (reverse)
        srcStr = srcStr.reverse();
    
    var iterator = srcStr.split(/(\d{3})/).entries(),
        endStr   = "",
        color    = Color1;

    if (reverse)
        color = Color1.reverse();
    
    for (let e of iterator) {
        if (e[1] != '') {
            endStr += color + e[1];
        
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

String.prototype.toColorNumber = function(Color1, Color2) {
    var src = '' + this,
        seg = [];
    
    if (src.includes(".") ) {
        seg = src.split('.');
        
        seg[0] = seg[0].insertColors(Color1, Color2, true);
        seg[1] = seg[1].insertColors(Color1, Color2, false);
        
        src = seg[0] + '^G.' + seg[1];
    }
    
    return src;
}

console.log('12344567890.0987654321'.toColorNumber('^C ', '^c '));
