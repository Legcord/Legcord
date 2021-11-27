BIN="dist/linux-unpacked/armcord";

echo    "Building the binary";

npm run package;
chmod +x $BIN;
$BIN "--trace-warnings ...";
echo    "Done";