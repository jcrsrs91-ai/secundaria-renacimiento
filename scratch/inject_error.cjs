const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('</body>', `<script>
window.addEventListener('error', function(e) {
  document.body.innerHTML = '<div style="color:red;padding:20px;font-size:20px;font-family:monospace;background:white;z-index:999999;position:fixed;top:0;left:0;width:100%;height:100%;"><h1>CRITICAL ERROR</h1>' + e.message + '<br>Stack:<br>' + (e.error && e.error.stack ? e.error.stack.replace(/\\n/g, '<br>') : '') + '</div>';
});
window.addEventListener('unhandledrejection', function(e) {
  document.body.innerHTML = '<div style="color:red;padding:20px;font-size:20px;font-family:monospace;background:white;z-index:999999;position:fixed;top:0;left:0;width:100%;height:100%;"><h1>PROMISE ERROR</h1>' + e.reason + '</div>';
});
</script></body>`);
fs.writeFileSync('index.html', html);
console.log("Error overlay injected");
