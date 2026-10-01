const fs = require('fs');
const path = require('path');

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
    '´┐¢': 'ó', // Fallback
    'ÔÇó': '-', // Use standard hyphen instead of bullet to avoid encoding issues
    '•': '-',   // Also replace bullet with hyphen just in case
    'Ô×ò': '+'
};

let modifiedFiles = 0;

function walk(dir) {
    fs.readdirSync(dir).forEach(f => {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) walk(p);
        else if (p.endsWith('.jsx') || p.endsWith('.js')) {
            let txt = fs.readFileSync(p, 'utf8');
            let original = txt;
            for (const [bad, good] of Object.entries(replacements)) {
                txt = txt.split(bad).join(good);
            }
            if (txt !== original) {
                fs.writeFileSync(p, txt, 'utf8');
                console.log('Fixed', p);
                modifiedFiles++;
            }
        }
    });
}

walk('src');
console.log('Total files fixed:', modifiedFiles);
