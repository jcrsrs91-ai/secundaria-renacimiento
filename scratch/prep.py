import re
import os

filepath = 'src/pages/dashboard/Inventario.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove unnecessary imports (optional, but good for cleanup)
# Left untouched to avoid breaking

# 2. Remove states related to POS
content = re.sub(r'const \[cajaTurno, setCajaTurno\] = useState\(null\);.*?\n', '', content)
content = re.sub(r'// Escuchar si ya hay una caja abierta para este usuario\s*useEffect\(\(\) => \{.*?\}, \[\]\);\s*', '', content, flags=re.DOTALL)
content = re.sub(r'// Escuchar gastos \(egresos\) de la caja actual\s*useEffect\(\(\) => \{.*?\}, \[cajaTurno\]\);\s*', '', content, flags=re.DOTALL)
content = re.sub(r'const \[corteConfig, setCorteConfig\] = useState.*?;\n', '', content)
content = re.sub(r'const \[activeIngresoTab, setActiveIngresoTab\] = useState.*?;\n', '', content)
content = re.sub(r'const \[fechaInicio, setFechaInicio\] = useState.*?;\n', '', content)
content = re.sub(r'const \[fechaFin, setFechaFin\] = useState.*?;\n', '', content)
content = re.sub(r'const \[pagosAdmin, setPagosAdmin\] = useState.*?;\n', '', content)
content = re.sub(r'const \[pagosExtra, setPagosExtra\] = useState.*?;\n', '', content)
content = re.sub(r'const \[showPagoAdminModal, setShowPagoAdminModal\] = useState.*?;\n', '', content)
content = re.sub(r'const \[studentSearchMatches, setStudentSearchMatches\] = useState.*?;\n', '', content)
content = re.sub(r'const \[showStudentDropdown, setShowStudentDropdown\] = useState.*?;\n', '', content)
content = re.sub(r'const \[allStudentsRaw, setAllStudentsRaw\] = useState.*?;\n', '', content)
content = re.sub(r'const materiasPorGrado = \{.*?\n  \};\n', '', content, flags=re.DOTALL)
content = re.sub(r'const \[pagoFormData, setPagoFormData\] = useState.*?;\n', '', content)
content = re.sub(r'const \[receiptPago, setReceiptPago\] = useState\(null\);\n', '', content)
content = re.sub(r'const \[pagosRecientes, setPagosRecientes\] = useState.*?;\n', '', content)
content = re.sub(r'const \[gastos, setGastos\] = useState.*?;\n', '', content)

# 3. Remove useEffects for students, pagosAdmin, pagosExtra
content = re.sub(r'useEffect\(\(\) => \{\s*const q = query\(collection\(db, \'students\'\)\).*?setPagosRecientes\(items\.reverse\(\)\); setAllStudentsRaw\(rawItems\);\s*\}\);\s*return \(\) => unsubscribe\(\);\s*\}, \[\]\);', '', content, flags=re.DOTALL)
content = re.sub(r'useEffect\(\(\) => \{\s*const qAdmin = query\(collection\(db, \'pagos_administrativos\'\)\);.*?return \(\) => \{ unsubAdmin\(\); unsubExtra\(\); \};\s*\}, \[\]\);', '', content, flags=re.DOTALL)

# 4. Remove tabs content: pagos, gastos, dashboard, corte
content = re.sub(r'\{\(!cajaTurno && \(activeTab === \'pagos\' \|\| activeTab === \'gastos\' \|\| activeTab === \'corte\'\)\) \? \(.*?\) : \(', '{true ? (', content, flags=re.DOTALL)
content = re.sub(r'\{activeTab === \'pagos\' && \(.*?\}\)\}\s*\}\)\}\s*</div>\s*</div>\s*</div>\s*\)\}\s*', '', content, flags=re.DOTALL)
# It's tricky to regex nested JSX. Instead, let's just find and replace the tab buttons and let the rendering code alone, OR just remove the whole blocks manually.

# A safer approach is to do string replacements for known blocks.
with open('scratch/optimize_inventario.py_done', 'w') as f:
    f.write('done')

