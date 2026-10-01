const fs = require('fs');
const path = 'src/pages/dashboard/Inventario.jsx';
let text = fs.readFileSync(path, 'utf8');

const replacements = {
    '├│': 'ó',
    '├í': 'á',
    '├⌐': 'é',
    '├®': 'é',
    '├¡': 'í',
    '├║': 'ú',
    '├▒': 'ñ',
    '├æ': 'Ñ',
    '├ô': 'Ó',
    '├ë': 'É',
    '├ì': 'Í',
    '├ü': 'Á',
    '├Ü': 'Ú',
    '┬í': '¡',
    '┬┐': '¿',
    '┬¿': '¿',
    '´┐¢nicamente': 'únicamente',
    'Instituci´┐¢n': 'Institución',
    'v´┐¢lido': 'válido',
    'tr´┐¢mites': 'trámites',
    'Tr´┐¢mite': 'Trámite',
    'aclaraci´┐¢n': 'aclaración',
    '´┐¢': 'ó' // Fallback
};

for (const [bad, good] of Object.entries(replacements)) {
    text = text.split(bad).join(good);
}

fs.writeFileSync(path, text, 'utf8');
console.log('Fixed encoding issues in Inventario.jsx');
