const fs = require('fs');

let content = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

// The block to extract
const table2Regex = /\s*<div className="mt-8 mb-6">\s*<p className="text-sm font-semibold mb-2">2\. De las alumnas y alumnos provenientes[\s\S]*?<\/div>\s*<\/div>/;

const match = content.match(table2Regex);
if (!match) {
  console.log("Could not find table2 block");
  process.exit(1);
}

const table2Block = match[0];

// Remove it from its current place
content = content.replace(table2Regex, '');

// Now we need to find the end of Section II and insert it there.
// Section II ends precisely before: {/* III. BECAS */}

content = content.replace(
  /\s*\{\/\* III\. BECAS \*\/\}/,
  `${table2Block}\n\n        {/* III. BECAS */}`
);

fs.writeFileSync('src/components/Formato911.jsx', content, 'utf8');
console.log("Table II.2 successfully moved to the end of Section II");
