const fs = require('fs');

let content = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

// We need to separate the header from the tables.
// The useMemo starts around line 66: `return useMemo(() => (`
// Let's remove the `return useMemo(() => (` and the wrapper.

content = content.replace(/return useMemo\(\(\) => \(\s*<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 f911-container" ref=\{containerRef\}>/, '');

// Now we find the end of the file.
content = content.replace(/<\/div>\s*\n\s*\), \[shiftFilter, isSaving\]\);\s*\}/, '');

// Now the whole file from the header to the end is just JSX.
// We want to return the header normally, and memoize ONLY the `<div className="space-y-12">` part!

// The header ends right before: `<div className="space-y-12">`
const [beforeHeader, rest] = content.split('<div className="space-y-12">');

const newRender = `
  const tablesJSX = useMemo(() => (
    <div className="space-y-12" ref={containerRef}>
${rest}
    </div>
  ), [shiftFilter]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 f911-container">
${beforeHeader}
      {tablesJSX}
    </div>
  );
}
`;

// But wait, `beforeHeader` contains the header. Let's see what's in beforeHeader.
// The split happened at `<div className="space-y-12">`.
// But the `beforeHeader` doesn't have the `return (`!
// I need to add `return (` manually.
