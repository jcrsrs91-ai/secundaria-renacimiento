const { execSync } = require('child_process');
execSync('git commit -m "feat: Separacion de Inventario y Cero Papel"', { stdio: 'inherit' });
execSync('git push origin main', { stdio: 'inherit' });
