const fs = require('fs');
let c = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

const regexLoad = /useEffect\(\(\) => \{\s*\/\/\s*Load saved data[\s\S]*?\}, \[\]\);/;

const stateAndFetch = `
  const [historicoData, setHistoricoData] = useState(null);

  useEffect(() => {
    const fetchHistorico = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'configuracion', 'formato911_historico'));
        if (docSnap.exists()) {
          setHistoricoData(docSnap.data().tablesData);
        }
      } catch (err) {
        console.error("Error loading 911 data", err);
      }
    };
    fetchHistorico();
  }, []);
`;

c = c.replace(regexLoad, stateAndFetch);

const regexReturn = /(return TableGrid;\s*\})/;

const restoreEffect = `
  useEffect(() => {
    if (historicoData && containerRef.current) {
      const tables = containerRef.current.querySelectorAll('table');
      historicoData.forEach((tableData, tIdx) => {
        const table = tables[tIdx];
        if (table) {
          const trs = table.querySelectorAll('tbody tr');
          tableData.forEach((rowData, rIdx) => {
            const tr = trs[rIdx];
            if (tr) {
              const tds = tr.querySelectorAll('td');
              let dataCellIndex = 0;
              tds.forEach((td) => {
                if (td.classList.contains('data-cell') || td.hasAttribute('contenteditable')) {
                  if (rowData[dataCellIndex] !== undefined) {
                    td.innerText = rowData[dataCellIndex];
                  }
                  dataCellIndex++;
                }
              });
            }
          });
        }
      });
    }
  }, [historicoData, TableGrid]);

  return TableGrid;
}
`;

c = c.replace(regexReturn, restoreEffect);

fs.writeFileSync('src/components/Formato911.jsx', c, 'utf8');
