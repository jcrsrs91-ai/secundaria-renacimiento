import os  
import re  
with open('src/pages/dashboard/ControlEscolar.jsx', 'r', encoding='utf-8') as f: text = f.read()  
old_sort = r'''  \}\)\.sort\(\(a, b\) => \{''' 
