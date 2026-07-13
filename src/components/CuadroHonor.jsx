import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Medal, Award, Printer, Search } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { truncateTo1Dec, truncateTo2Dec } from '../utils/format';
import DiplomaPrint from './DiplomaPrint';
import CuadroHonorListaPrint from './CuadroHonorListaPrint';
import ManualDiplomaModal from './ManualDiplomaModal';
import DiplomaGeneracionPrint from './DiplomaGeneracionPrint';
import ArtesDiplomaModal from './ArtesDiplomaModal';
import DiplomaArtesPrint from './DiplomaArtesPrint';
import { Palette } from 'lucide-react';

const materiasPorGrado = {
  '1er Grado': [
    { id: 'espanol1', name: 'Español I' }, { id: 'ingles1', name: 'Inglés I' }, { id: 'artes1', name: 'Artes I' },
    { id: 'matematicas1', name: 'Matemáticas I' }, { id: 'biologia', name: 'Ciencias I (Biología)' },
    { id: 'geografia', name: 'Geografía' }, { id: 'historia1', name: 'Historia I' }, { id: 'fce1', name: 'Formación Cívica y Ética I' },
    { id: 'tecnologia1', name: 'Tecnología I' }, { id: 'educfisica1', name: 'Educación Física I' }
  ],
  '2do Grado': [
    { id: 'espanol2', name: 'Español II' }, { id: 'ingles2', name: 'Inglés II' }, { id: 'artes2', name: 'Artes II' },
    { id: 'matematicas2', name: 'Matemáticas II' }, { id: 'fisica', name: 'Ciencias II (Física)' },
    { id: 'historia2', name: 'Historia II' }, { id: 'fce2', name: 'Formación Cívica y Ética II' },
    { id: 'tecnologia2', name: 'Tecnología II' }, { id: 'educfisica2', name: 'Educación Física II' }
  ],
  '3er Grado': [
    { id: 'espanol3', name: 'Español III' }, { id: 'ingles3', name: 'Inglés III' }, { id: 'artes3', name: 'Artes III' },
    { id: 'matematicas3', name: 'Matemáticas III' }, { id: 'quimica', name: 'Ciencias III (Química)' },
    { id: 'historia3', name: 'Historia III' }, { id: 'fce3', name: 'Formación Cívica y Ética III' },
    { id: 'tecnologia3', name: 'Tecnología III' }, { id: 'educfisica3', name: 'Educación Física III' }
  ]
};

export default function CuadroHonor() {
  const [loading, setLoading] = useState(false);
  const [grado, setGrado] = useState('1er Grado');
  const [turno, setTurno] = useState('Matutino');
  const [periodo, setPeriodo] = useState('t1');
  const [activos, setActivos] = useState([]);
  const [printData, setPrintData] = useState(null); // null o arreglo de { student, average, place, periodoName }
  const [showPrintLista, setShowPrintLista] = useState(false);
  const [showManualDiploma, setShowManualDiploma] = useState(false);
  
  // Generación
  const [showGeneracionModal, setShowGeneracionModal] = useState(false);
  const [generacionPrintData, setGeneracionPrintData] = useState(null);
  
  // Artes
  const [showArtesDiplomaModal, setShowArtesDiplomaModal] = useState(false);
  const [artesPrintData, setArtesPrintData] = useState(null);
  
  const [genStudentId, setGenStudentId] = useState('');
  const [genPromedio, setGenPromedio] = useState('');
  const [genText, setGenText] = useState('2023-2026');
  const [genTurno, setGenTurno] = useState('Matutino');

  // Cargar estudiantes
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const qAll = query(collection(db, "students"), where("status", "==", "Activo"));
        const snap = await getDocs(qAll);
        const allData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setActivos(allData);
      } catch (error) {
        console.error("Error cargando estudiantes:", error);
      }
      setLoading(false);
    };
    fetchStudents();
  }, []);

  const getAverage = (student, currentPeriodo, materias) => {
    let sum = 0, count = 0, hasFailed = false;

    if (currentPeriodo === 'anual') {
      materias.forEach(mat => {
        const t1 = parseFloat(student.calificaciones?.['t1']?.[mat.id]);
        const t2 = parseFloat(student.calificaciones?.['t2']?.[mat.id]);
        const t3 = parseFloat(student.calificaciones?.['t3']?.[mat.id]);
        let s = 0, c = 0;
        if (!isNaN(t1)) { s += t1; c++; if (t1 < 6) hasFailed = true; }
        if (!isNaN(t2)) { s += t2; c++; if (t2 < 6) hasFailed = true; }
        if (!isNaN(t3)) { s += t3; c++; if (t3 < 6) hasFailed = true; }
        
        if (c === 3) {
          const matAvg = parseFloat(truncateTo1Dec(s / c, '0'));
          sum += matAvg;
          count++;
          if (matAvg < 6) hasFailed = true;
        } else {
          // Si no tiene los 3 trimestres en alguna materia, no puede entrar al anual
          hasFailed = true; 
        }
      });
    } else {
      materias.forEach(mat => {
        const val = parseFloat(student.calificaciones?.[currentPeriodo]?.[mat.id]);
        if (!isNaN(val)) {
          sum += val;
          count++;
          if (val < 6) hasFailed = true;
        }
      });
    }

    // Para el cuadro de honor, deben tener todas las materias y ninguna reprobada
    if (count < materias.length || hasFailed) return 0;

    // Retornamos el promedio exacto sin redondear ni truncar para que el desempate sea preciso
    return sum / count;
  };

  const getPeriodoName = () => {
    if (periodo === 't1') return '1er Trimestre';
    if (periodo === 't2') return '2do Trimestre';
    if (periodo === 't3') return '3er Trimestre';
    return 'Promedio Anual';
  };

  const ganadores = useMemo(() => {
    const filtered = activos.filter(a => a.grado === grado && a.turno === turno);
    const materias = materiasPorGrado[grado] || [];
    
    // Calcular promedios
    const conPromedio = filtered.map(student => {
      const average = getAverage(student, periodo, materias);
      return { student, average };
    });

    // Ordenar de mayor a menor y filtrar los que tienen 0
    const sorted = conPromedio.filter(s => s.average > 0).sort((a, b) => b.average - a.average);

    const places = [];
    let currentAverage = -1;
    let rankIndex = 0;

    for (const item of sorted) {
      if (item.average !== currentAverage) {
        if (rankIndex === 3) break; // Ya tenemos 1ro, 2do y 3er lugar distinctos
        rankIndex++;
        currentAverage = item.average;
      }
      
      places.push({
        ...item,
        place: rankIndex,
        periodoName: getPeriodoName()
      });
    }

    // Ordenar por lugar, luego alfabéticamente por apellido y finalmente por grupo
    places.sort((a, b) => {
      if (a.place !== b.place) return a.place - b.place;

      const apA = (a.student.apellidoPaterno || '').trim().localeCompare((b.student.apellidoPaterno || '').trim(), 'es', { sensitivity: 'base' });
      if (apA !== 0) return apA;

      const amA = (a.student.apellidoMaterno || '').trim().localeCompare((b.student.apellidoMaterno || '').trim(), 'es', { sensitivity: 'base' });
      if (amA !== 0) return amA;

      const grA = (a.student.grupo || '').trim().localeCompare((b.student.grupo || '').trim(), 'es', { sensitivity: 'base' });
      return grA;
    });

    return places;
  }, [activos, grado, turno, periodo]);

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Cargando Cuadro de Honor...</div>;
  }

  const primerLugar = ganadores.filter(g => g.place === 1);
  const segundoLugar = ganadores.filter(g => g.place === 2);
  const tercerLugar = ganadores.filter(g => g.place === 3);

  const renderGanadoresList = (lista, title, bgClass, textClass, borderClass, iconClass, MedalIcon) => {
    if (lista.length === 0) return null;
    return (
      <div className={`rounded-2xl p-6 ${bgClass} border ${borderClass} mb-6 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <MedalIcon className="w-32 h-32" />
        </div>
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className={`p-3 rounded-xl ${bgClass} shadow-sm border ${borderClass}`}>
            <MedalIcon className={`w-8 h-8 ${iconClass}`} />
          </div>
          <div>
            <h3 className={`text-xl font-black uppercase tracking-widest ${textClass}`}>{title}</h3>
            <p className="text-sm font-semibold opacity-80">{truncateTo2Dec(lista[0].average)} de Promedio</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
          {lista.map((ganador, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-black/5 flex flex-col gap-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Alumno(a)</p>
                <h4 className="font-bold text-slate-800 leading-tight">
                  {ganador.student.nombres} {ganador.student.apellidoPaterno} {ganador.student.apellidoMaterno}
                </h4>
              </div>
              
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">
                  Grupo "{ganador.student.grupo}"
                </span>
                
                <button 
                  onClick={() => setPrintData([ganador])}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center transition hover:bg-opacity-80
                    ${title === 'Primer Lugar' ? 'border-yellow-200 text-yellow-700 hover:bg-yellow-50' : 
                      title === 'Segundo Lugar' ? 'border-slate-300 text-slate-600 hover:bg-slate-50' : 
                      'border-amber-200 text-amber-700 hover:bg-amber-50'}
                  `}
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5" /> Diploma
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
      
      {/* Imprimir Dialog */}
      {printData && (
        <DiplomaPrint alumnos={printData} turno={turno} onClose={() => setPrintData(null)} />
      )}
      
      {showPrintLista && (
        <CuadroHonorListaPrint 
          ganadores={ganadores} 
          grado={grado} 
          turno={turno} 
          periodoName={getPeriodoName()} 
          onClose={() => setShowPrintLista(false)} 
        />
      )}

      {showManualDiploma && (
        <ManualDiplomaModal 
          onClose={() => setShowManualDiploma(false)} 
          onGenerate={(data, manualTurno) => {
            setShowManualDiploma(false);
            setTurno(manualTurno); // Temporary override for printing signature
            setPrintData(data);
          }} 
        />
      )}

      {/* Diploma Artes Modal y Print */}
      {artesPrintData && (
        <DiplomaArtesPrint
          student={artesPrintData.student}
          turno={artesPrintData.turno}
          onClose={() => setArtesPrintData(null)}
        />
      )}

      {showArtesDiplomaModal && (
        <ArtesDiplomaModal
          activos={activos}
          onClose={() => setShowArtesDiplomaModal(false)}
          onGenerate={(data, manualTurno) => {
            setShowArtesDiplomaModal(false);
            setArtesPrintData({ student: data.student, turno: manualTurno });
          }}
        />
      )}

      {generacionPrintData && (
        <DiplomaGeneracionPrint
          student={generacionPrintData.student}
          promedio={generacionPrintData.promedio}
          generacion={generacionPrintData.generacion}
          turno={generacionPrintData.turno}
          onClose={() => setGeneracionPrintData(null)}
        />
      )}

      {showGeneracionModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-500" /> Diploma de Generación
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Alumno (Solo 3er Grado)</label>
                <select 
                  value={genStudentId}
                  onChange={e => setGenStudentId(e.target.value)}
                  className="w-full border-slate-300 rounded-lg shadow-sm p-2 text-sm"
                >
                  <option value="">Selecciona al ganador...</option>
                  {activos.filter(s => s.grado === '3er Grado').sort((a,b) => a.apellidoPaterno.localeCompare(b.apellidoPaterno)).map(al => (
                    <option key={al.id} value={al.id}>{al.apellidoPaterno} {al.apellidoMaterno} {al.nombres}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Promedio de Generación</label>
                <input 
                  type="number" step="0.01" 
                  value={genPromedio} onChange={e => setGenPromedio(e.target.value)}
                  placeholder="Ej. 9.9"
                  className="w-full border-slate-300 rounded-lg shadow-sm p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Texto de Generación</label>
                <input 
                  type="text" 
                  value={genText} onChange={e => setGenText(e.target.value)}
                  className="w-full border-slate-300 rounded-lg shadow-sm p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Turno</label>
                <select value={genTurno} onChange={e => setGenTurno(e.target.value)} className="w-full border-slate-300 rounded-lg shadow-sm p-2 text-sm">
                  <option value="Matutino">Matutino</option>
                  <option value="Vespertino">Vespertino</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setShowGeneracionModal(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg text-sm">Cancelar</button>
              <button 
                disabled={!genStudentId || !genPromedio || !genText}
                onClick={() => {
                  const student = activos.find(s => s.id === genStudentId);
                  setGeneracionPrintData({ student, promedio: genPromedio, generacion: genText, turno: genTurno });
                  setShowGeneracionModal(false);
                }}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold text-sm"
              >
                Generar Diploma
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header & Filtros */}
      <div className="p-6 border-b border-slate-200 bg-slate-50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-500" />
              Cuadro de Honor
            </h2>
            <p className="text-slate-500 mt-1 font-medium">Reconocimiento a los mejores promedios de la institución.</p>
          </div>
          <div className="flex gap-3 flex-wrap justify-end">
            <button 
              onClick={() => setShowGeneracionModal(true)}
              className="bg-slate-900 hover:bg-black text-amber-500 px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-slate-300 transition flex items-center"
            >
              <Trophy className="w-5 h-5 mr-2" /> Diploma Generación
            </button>
            <button 
              onClick={() => setShowArtesDiplomaModal(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-rose-200 transition flex items-center"
            >
              <Palette className="w-5 h-5 mr-2" /> Diploma Artes
            </button>
            <button 
              onClick={() => setShowManualDiploma(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition flex items-center"
            >
              <Award className="w-5 h-5 mr-2" /> Diploma Manual
            </button>
            {ganadores.length > 0 && (
              <>
                <button 
                  onClick={() => setShowPrintLista(true)}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-slate-200 transition flex items-center"
                >
                  <Printer className="w-5 h-5 mr-2" /> Imprimir Lista Oficial
                </button>
                <button 
                  onClick={() => setPrintData(ganadores)}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-200 transition flex items-center"
                >
                  <Printer className="w-5 h-5 mr-2" /> Imprimir Diplomas
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Grado</label>
            <select value={grado} onChange={(e) => setGrado(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-medium text-slate-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition">
              <option value="1er Grado">1er Grado</option>
              <option value="2do Grado">2do Grado</option>
              <option value="3er Grado">3er Grado</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Turno</label>
            <select value={turno} onChange={(e) => setTurno(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-medium text-slate-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition">
              <option value="Matutino">Matutino</option>
              <option value="Vespertino">Vespertino</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Periodo a Evaluar</label>
            <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-medium text-slate-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition">
              <option value="t1">1er Trimestre</option>
              <option value="t2">2do Trimestre</option>
              <option value="t3">3er Trimestre</option>
              <option value="anual">Promedio Anual (Final)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Podium Render */}
      <div className="p-8">
        {ganadores.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">No hay calificaciones registradas</h3>
            <p className="text-slate-500 max-w-sm mx-auto">Aún no se han capturado calificaciones para {grado} en el {getPeriodoName()} del turno {turno}.</p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            {renderGanadoresList(primerLugar, 'Primer Lugar', 'bg-yellow-50', 'text-yellow-700', 'border-yellow-200', 'text-yellow-500', Trophy)}
            {renderGanadoresList(segundoLugar, 'Segundo Lugar', 'bg-slate-100', 'text-slate-700', 'border-slate-300', 'text-slate-500', Medal)}
            {renderGanadoresList(tercerLugar, 'Tercer Lugar', 'bg-amber-50', 'text-amber-800', 'border-amber-200', 'text-amber-600', Award)}
          </div>
        )}
      </div>

    </div>
  );
}
