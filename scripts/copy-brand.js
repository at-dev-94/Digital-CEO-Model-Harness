const fs = require("fs");
const path = require("path");

const srcDir = "C:\\Users\\Administrator\\.cursor\\projects\\c-Users-Administrator-Downloads-Aiautomatin\\assets";
const dstDir = path.join(__dirname, "..", "public", "brand");
fs.mkdirSync(dstDir, { recursive: true });

const files = fs.readdirSync(srcDir);
const copies = [
  ["5.29.00_AM", "logo-247.jpg"],
  ["5.27.34_AM", "logo-247-neon.jpg"],
  ["6.50.43_AM", "ceo.jpg"],
];

for (const [needle, destName] of copies) {
  const name = files.find((f) => f.includes(needle));
  if (!name) {
    console.error("missing", needle);
    process.exit(1);
  }
  fs.copyFileSync(path.join(srcDir, name), path.join(dstDir, destName));
  console.log("copied", destName, fs.statSync(path.join(dstDir, destName)).size);
}
