const fs = require('fs');

let c = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

// Find where state is declared
const stateOld = `  const [historicoData, setHistoricoData] = useState(null);

  useEffect(() => {
    const fetchHistorico = async () => {`;

const stateNew = `  const [historicoData, setHistoricoData] = useState(null);
  const [snapshotCicloPasado, setSnapshotCicloPasado] = useState(null);
  const [loadingSnapshot, setLoadingSnapshot] = useState(true);

  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        const snap = await getDoc(doc(db, 'historical_911', 'latest'));
        if (snap.exists()) {
          setSnapshotCicloPasado(snap.data());
        }
      } catch (err) {
        console.error("Error fetching snapshot", err);
      } finally {
        setLoadingSnapshot(false);
      }
    };
    fetchSnapshot();
  }, []);

  useEffect(() => {
    const fetchHistorico = async () => {`;

c = c.replace(stateOld, stateNew);

// Add the banner at the top of the modal (before the first question)
const bannerOld = `        {/* TABLA DE PREGUNTAS (ESTILO SEP) */}
        <div ref={containerRef} className="bg-white p-4 sm:p-8 rounded-lg border border-slate-200" style={{ maxWidth: '1000px', margin: '0 auto' }}>`;

const bannerNew = `        {/* TABLA DE PREGUNTAS (ESTILO SEP) */}
        <div ref={containerRef} className="bg-white p-4 sm:p-8 rounded-lg border border-slate-200" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          {!loadingSnapshot && !snapshotCicloPasado && (
            <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
              <h4 className="font-bold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Aviso: Fotografía del Ciclo Pasado no encontrada
              </h4>
              <p>
                El sistema detectó que este es tu primer ciclo escolar usándolo. Debido a esto, las Secciones I, II, III y IV (que corresponden a datos históricos de <strong>Fin de Cursos del ciclo anterior</strong>) no se pueden automatizar todavía y deberán llenarse manualmente.
              </p>
              <p className="mt-2 font-semibold">
                ¡No te preocupes! Al finalizar este año, cuando presiones el botón de "Cierre de Ciclo Escolar", el sistema tomará una fotografía automática de tu escuela y el próximo año todas estas secciones se llenarán solas al instante.
              </p>
            </div>
          )}

          {!loadingSnapshot && snapshotCicloPasado && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
              <h4 className="font-bold mb-2 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Fotografía Histórica Encontrada ({snapshotCicloPasado.ciclo})
              </h4>
              <p>
                Las Secciones I a la IV están siendo automatizadas leyendo la base de datos congelada del ciclo <strong>{snapshotCicloPasado.ciclo}</strong> (tomada el {new Date(snapshotCicloPasado.fechaCierre).toLocaleDateString()}).
              </p>
            </div>
          )}`;

c = c.replace(bannerOld, bannerNew);

fs.writeFileSync('src/components/Formato911.jsx', c, 'utf8');
console.log('Fixed Formato911');
