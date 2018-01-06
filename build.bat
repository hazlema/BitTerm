del binaries\*

start nexe BitTerm.js -r ./utils.js -o binaries/BitTerm-win-x64.exe
start nexe BitTerm.js -r ./utils.js -t win32-x86-8.6.0 -o binaries/BitTerm-win-x32.exe
start nexe BitTerm.js -r ./utils.js -t macos-8.4.0 -o binaries/BitTerm-mac
start nexe BitTerm.js -r ./utils.js -t linux-x64 -o binaries/BitTerm-linux-x64
start nexe BitTerm.js -r ./utils.js -t linux-x86 -o binaries/BitTerm-linux-x86
pause
