const fs = require('fs');

let content = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

// 1. Remove the opening useMemo wrapper
content = content.replace(
  /return useMemo\(\(\) => \(\s*<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">/,
  `return (\n    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">`
);

// 2. Remove the closing useMemo wrapper
content = content.replace(
  /<\/div>\s*\n\s*\), \[shiftFilter, isSaving\]\);\s*\}/,
  `</div>\n    </div>\n  );\n}`
);

// 3. Find where the table section begins `<div className="space-y-12">`
// We will change it so that everything from `<div className="space-y-12">` downwards is wrapped in useMemo

// Split at `<div className="space-y-12">`
const parts = content.split('<div className="space-y-12">');

if (parts.length === 2) {
  // `parts[1]` contains the tables until the end of the file. But wait, it ends with `</div>\n    </div>\n  );\n}` which I just added!
  // I need to split that end off.
  
  let tablesJSX = parts[1];
  // Remove the very last `</div>\n    </div>\n  );\n}` from tablesJSX
  tablesJSX = tablesJSX.replace(/<\/div>\s*\n\s*<\/div>\s*\n\s*\);\s*\n\s*\}/, '');

  const newCode = `${parts[0]}
      {useMemo(() => (
        <div className="space-y-12" ref={containerRef}>
          ${tablesJSX}
        </div>
      ), [shiftFilter])}
    </div>
  );
}`;

  fs.writeFileSync('src/components/Formato911.jsx', newCode, 'utf8');
  console.log('Fixed useMemo successfully!');
} else {
  console.log('Failed to split!');
}
