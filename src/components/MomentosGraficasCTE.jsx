import { useMemo, cloneElement } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LabelList,
  ReferenceLine
} from 'recharts';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  BarChart3,
  Sparkles,
  CalendarCheck
} from 'lucide-react';
import {
  GRADOS_SEG,
  CAMPOS_FORMATIVOS_SEG
} from '../utils/momentosValoracionCalc.js';
import { truncateTo1Dec } from '../utils/format.js';

const fmtPct = (v) => `${(Number(v) || 0).toFixed(1)}%`;
const fmt1 = (v) =>
  v === null || v === undefined || isNaN(v) ? '-' : truncateTo1Dec(v, '-');

const nonZeroLabel = (v) => (Number(v) > 0 ? v : '');

const getSemaphoreColor = (val) => {
  if (val >= 8.5) return '#10b981';
  if (val >= 7.5) return '#3b82f6';
  if (val >= 6.5) return '#f59e0b';
  return '#ef4444';
};

const CAMPOS_CORTOS = {
  LENGUAJES: 'Lenguajes',
  'SABERES Y PENSAMIENTO CIENTÍFICO': 'Saberes y Pens.',
  'ÉTICA NATURALEZA Y SOCIEDAD': 'Ética, Nat. y Soc.',
  'DE LO HUMANO Y LO COMUNITARIO': 'De lo Humano'
};

const DISCIPLINA_GRUPOS = [
  { label: 'Español', ids: ['espanol1', 'espanol2', 'espanol3'] },
  { label: 'Inglés', ids: ['ingles1', 'ingles2', 'ingles3'] },
  { label: 'Artes', ids: ['artes1', 'artes2', 'artes3'] },
  { label: 'Matemáticas', ids: ['matematicas1', 'matematicas2', 'matematicas3'] },
  { label: 'Ciencias (Bio/Fís/Quí)', ids: ['biologia', 'fisica', 'quimica'] },
  { label: 'Geografía (1°)', ids: ['geografia'] },
  { label: 'Historia', ids: ['historia1', 'historia2', 'historia3'] },
  { label: 'Form. Cívica y Ética', ids: ['fce1', 'fce2', 'fce3'] },
  { label: 'Tecnología', ids: ['tecnologia1', 'tecnologia2', 'tecnologia3'] },
  { label: 'Educación Física', ids: ['educfisica1', 'educfisica2', 'educfisica3'] }
];

function ChartBox({
  printMode = false,
  screenHeight = 250,
  printWidth = 560,
  printHeight = 360,
  minWidth = 220,
  children
}) {
  if (printMode) {
    return (
      <div className="w-full flex items-center justify-center">
        {cloneElement(children, { width: printWidth, height: printHeight })}
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={screenHeight} minWidth={minWidth}>
      {children}
    </ResponsiveContainer>
  );
}

function EmptyChartNotice({ message = 'Sin datos capturados aún para graficar en este Momento.' }) {
  return (
    <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500 text-xs sm:text-sm font-medium">
      {message}
    </div>
  );
}

function CTEHeaderBadge({ title, momentoTitulo, cicloEscolar, turnoVista = 'Todos' }) {
  const esUnSoloTurno = turnoVista === 'Matutino' || turnoVista === 'Vespertino';
  return (
    <div className="flex flex-col sm:flex-row print:flex-row sm:items-center print:items-center justify-between gap-2 mb-4 print:mb-3 bg-gradient-to-r from-slate-900 to-indigo-950 text-white px-4 py-3 print:py-2.5 print:px-4 rounded-xl shadow-xs">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-indigo-500/25 border border-indigo-400/30 text-indigo-200">
          <BarChart3 className="w-4 h-4 print:w-5 print:h-5" />
        </div>
        <div>
          <h5 className="text-xs sm:text-sm print:text-base font-extrabold uppercase tracking-wide">
            {title}
          </h5>
          <p className="text-[11px] print:text-xs text-slate-300">
            Visualización Ejecutiva — Consejo Técnico Escolar (CTE)
          </p>
        </div>
      </div>
      <span className="self-start sm:self-center print:self-center text-[11px] print:text-xs font-bold bg-white/10 border border-white/20 px-2.5 py-1 rounded-full text-sky-200 uppercase">
        {momentoTitulo}
        {esUnSoloTurno ? ` · Turno ${turnoVista}` : ''} · Ciclo {cicloEscolar}
      </span>
    </div>
  );
}

/* =========================================================================
   1. TABLERO DE MATRÍCULA GENERAL
   ========================================================================= */
function MatriculaCTE({ matricula, momentoTitulo, cicloEscolar, printMode = false, turnoVista = 'Todos' }) {
  const esc = matricula?.totalEscuela;
  const hayDatos = (esc?.existencia?.t || 0) > 0 || (esc?.inicial?.t || 0) > 0;

  const barGradosData = useMemo(
    () =>
      GRADOS_SEG.map((g, idx) => ({
        grado: `${idx + 1}° Grado`,
        Hombres: matricula?.totalesGrado?.[g]?.existencia?.h || 0,
        Mujeres: matricula?.totalesGrado?.[g]?.existencia?.m || 0
      })),
    [matricula]
  );

  const pieSexoData = useMemo(
    () => [
      { name: 'Hombres', value: esc?.existencia?.h || 0, color: '#2563eb' },
      { name: 'Mujeres', value: esc?.existencia?.m || 0, color: '#db2777' }
    ],
    [esc]
  );

  const totalEx = esc?.existencia?.t || 0;

  return (
    <div className="print:w-full">
      <CTEHeaderBadge
        title="Análisis Gráfico de Matrícula y Retención"
        momentoTitulo={momentoTitulo}
        cicloEscolar={cicloEscolar}
        turnoVista={turnoVista}
      />

      {!hayDatos ? (
        <EmptyChartNotice />
      ) : (
        <div className="space-y-4 print:space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 print:grid-cols-4 gap-3 print:gap-3">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 print:p-3">
              <p className="text-[11px] print:text-xs font-bold text-emerald-700 uppercase flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Existencia Total
              </p>
              <p className="text-2xl print:text-3xl font-black text-emerald-950 mt-1">{totalEx}</p>
              <p className="text-[11px] print:text-xs text-emerald-700 mt-0.5">
                {esc?.grupos || 0} grupos activos
              </p>
            </div>
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 print:p-3">
              <p className="text-[11px] print:text-xs font-bold text-blue-700 uppercase">Inscripción Inicial</p>
              <p className="text-2xl print:text-3xl font-black text-blue-950 mt-1">{esc?.inicial?.t || 0}</p>
              <p className="text-[11px] print:text-xs text-blue-700 mt-0.5">
                {esc?.inicial?.h || 0} H · {esc?.inicial?.m || 0} M
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 print:p-3">
              <p className="text-[11px] print:text-xs font-bold text-slate-600 uppercase">Movimientos (Altas / Bajas)</p>
              <p className="text-2xl print:text-3xl font-black text-slate-900 mt-1">
                <span className="text-emerald-600">+{esc?.altas?.t || 0}</span>{' '}
                <span className="text-slate-400 text-lg">/</span>{' '}
                <span className="text-rose-600">-{esc?.bajas?.t || 0}</span>
              </p>
              <p className="text-[11px] print:text-xs text-slate-500 mt-0.5">Dentro de fecha de corte</p>
            </div>
            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 print:p-3">
              <p className="text-[11px] print:text-xs font-bold text-rose-700 uppercase flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" /> % Deserción / Bajas
              </p>
              <p className="text-2xl print:text-3xl font-black text-rose-900 mt-1">{fmtPct(esc?.pctBajas)}</p>
              <p className="text-[11px] print:text-xs text-rose-700 mt-0.5">Sobre (Inicial + Altas)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 print:grid-cols-3 gap-4 print:gap-3">
            <div className="lg:col-span-2 print:col-span-2 bg-white border border-slate-200 rounded-xl p-4 print:p-3.5 shadow-2xs">
              <h6 className="text-xs print:text-sm font-extrabold uppercase tracking-wider text-slate-700 mb-3 print:mb-2">
                Existencia por Grado y Sexo
              </h6>
              <div className="h-64 print:h-auto w-full">
                <ChartBox printMode={printMode} screenHeight={250} printWidth={560} printHeight={375} minWidth={240}>
                  <BarChart data={barGradosData} margin={{ top: 22, right: 16, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="grado" tick={{ fontSize: printMode ? 13 : 11, fontWeight: 700, fill: '#334155' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: printMode ? 12 : 11, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: printMode ? '13px' : '12px', fontWeight: 700 }} />
                    <Bar dataKey="Hombres" fill="#2563eb" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                      <LabelList dataKey="Hombres" position="top" formatter={nonZeroLabel} style={{ fontSize: printMode ? 13 : 11, fontWeight: 800, fill: '#1e3a8a' }} />
                    </Bar>
                    <Bar dataKey="Mujeres" fill="#db2777" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                      <LabelList dataKey="Mujeres" position="top" formatter={nonZeroLabel} style={{ fontSize: printMode ? 13 : 11, fontWeight: 800, fill: '#831843' }} />
                    </Bar>
                  </BarChart>
                </ChartBox>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 print:p-3.5 shadow-2xs flex flex-col justify-between">
              <h6 className="text-xs print:text-sm font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                Composición por Sexo
              </h6>
              <div className="h-52 print:h-auto relative flex items-center justify-center my-auto">
                <ChartBox printMode={printMode} screenHeight={205} printWidth={265} printHeight={290} minWidth={200}>
                  <PieChart>
                    <Pie
                      data={pieSexoData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={printMode ? 62 : 54}
                      outerRadius={printMode ? 98 : 80}
                      paddingAngle={3}
                      isAnimationActive={false}
                    >
                      {pieSexoData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [
                        `${val} (${totalEx > 0 ? ((val / totalEx) * 100).toFixed(1) : '0.0'}%)`,
                        'Alumnos'
                      ]}
                      contentStyle={{ borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </PieChart>
                </ChartBox>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] print:text-xs font-bold uppercase text-slate-400">Existencia</span>
                  <span className="text-2xl print:text-3xl font-black text-slate-900">{totalEx}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs print:text-xs pt-2 border-t border-slate-100">
                {pieSexoData.map((s) => (
                  <div key={s.name} className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg">
                    <span className="flex items-center gap-1.5 font-bold text-slate-700">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </span>
                    <span className="font-black text-slate-900">
                      {totalEx > 0 ? `${((s.value / totalEx) * 100).toFixed(1)}%` : '0.0%'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   2. TABLERO DE APROVECHAMIENTO (PROMEDIOS)
   ========================================================================= */
function AprovechamientoCTE({ aprovechamiento, momentoTitulo, cicloEscolar, printMode = false, turnoVista = 'Todos' }) {
  const esc = aprovechamiento?.escuela;
  const promEscuela = esc?.promTurno ?? null;
  const esUnSoloTurno = turnoVista === 'Matutino' || turnoVista === 'Vespertino';
  const mostrarComparativaTurnos = useMemo(() => {
    if (esUnSoloTurno) return false;
    const v = aprovechamiento?.turnos?.Vespertino?.promGrado || {};
    return GRADOS_SEG.some((g) => v[g] !== null && v[g] !== undefined);
  }, [aprovechamiento, esUnSoloTurno]);

  const rankingDisciplinas = useMemo(() => {
    const matMap = esc?.materias || {};
    const items = [];
    DISCIPLINA_GRUPOS.forEach((grp) => {
      const vals = grp.ids
        .map((id) => matMap[id])
        .filter((v) => v !== null && v !== undefined && !isNaN(v));
      if (vals.length === 0) return;
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      const val1 = parseFloat(truncateTo1Dec(avg, '0')) || 0;
      items.push({
        disciplina: grp.label,
        promedio: val1,
        color: getSemaphoreColor(val1)
      });
    });
    return items.sort((a, b) => b.promedio - a.promedio);
  }, [esc]);

  const radarData = useMemo(() => {
    const matMap = esc?.materias || {};
    const campoKeys = Object.keys(CAMPOS_CORTOS);
    return campoKeys.map((campoNombre) => {
      const entry = { campo: CAMPOS_CORTOS[campoNombre] };
      GRADOS_SEG.forEach((grado, idx) => {
        const cfObj = CAMPOS_FORMATIVOS_SEG[grado].find((c) => c.campo === campoNombre);
        const vals = (cfObj?.materias || [])
          .map((m) => matMap[m.id])
          .filter((v) => v !== null && v !== undefined && !isNaN(v));
        const val = vals.length > 0 ? parseFloat(truncateTo1Dec(vals.reduce((a, b) => a + b, 0) / vals.length, '0')) : 0;
        entry[`g${idx + 1}`] = val;
      });
      return entry;
    });
  }, [esc]);

  const gradosBarData = useMemo(() => {
    const matutino = aprovechamiento?.turnos?.Matutino?.promGrado || {};
    const vespertino = aprovechamiento?.turnos?.Vespertino?.promGrado || {};
    const escuelaG = esc?.promGrado || {};
    return GRADOS_SEG.map((g, idx) => ({
      grado: `${idx + 1}° Grado`,
      Matutino: matutino[g] !== null && matutino[g] !== undefined ? parseFloat(truncateTo1Dec(matutino[g], '0')) : 0,
      Vespertino: vespertino[g] !== null && vespertino[g] !== undefined ? parseFloat(truncateTo1Dec(vespertino[g], '0')) : 0,
      Escuela: escuelaG[g] !== null && escuelaG[g] !== undefined ? parseFloat(truncateTo1Dec(escuelaG[g], '0')) : 0
    }));
  }, [aprovechamiento, esc]);

  const mejorGrado = useMemo(() => {
    let best = null;
    GRADOS_SEG.forEach((g, idx) => {
      const val = esc?.promGrado?.[g];
      if (val !== null && val !== undefined && !isNaN(val)) {
        if (!best || val > best.val) best = { label: `${idx + 1}° Grado`, val };
      }
    });
    return best;
  }, [esc]);

  const topDisc = rankingDisciplinas[0] || null;
  const lowDisc = rankingDisciplinas.length > 0 ? rankingDisciplinas[rankingDisciplinas.length - 1] : null;
  const hayDatos = promEscuela !== null && rankingDisciplinas.length > 0;

  return (
    <div className="print:w-full">
      <CTEHeaderBadge
        title="Análisis Pedagógico de Aprovechamiento y Campos Formativos"
        momentoTitulo={momentoTitulo}
        cicloEscolar={cicloEscolar}
        turnoVista={turnoVista}
      />

      {!hayDatos ? (
        <EmptyChartNotice message="Aún no hay calificaciones capturadas para los alumnos de este Momento." />
      ) : (
        <div className="space-y-4 print:space-y-2.5">
          <div className="grid grid-cols-2 lg:grid-cols-4 print:grid-cols-4 gap-3 print:gap-2.5">
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 print:p-2.5">
              <p className="text-[11px] font-bold text-indigo-700 uppercase flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> {esUnSoloTurno ? `Prom. ${turnoVista}` : 'Promedio Escolar'}
              </p>
              <p className="text-2xl print:text-2xl font-black text-indigo-950 mt-1">{fmt1(promEscuela)}</p>
              <p className="text-[11px] text-indigo-700 mt-0.5">Corte {momentoTitulo}</p>
            </div>
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 print:p-2.5">
              <p className="text-[11px] font-bold text-emerald-700 uppercase flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> Grado Líder
              </p>
              <p className="text-xl print:text-2xl font-black text-emerald-950 mt-1">
                {mejorGrado ? `${mejorGrado.label} (${fmt1(mejorGrado.val)})` : '-'}
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">Mejor promedio global</p>
            </div>
            <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5 print:p-2.5">
              <p className="text-[11px] font-bold text-sky-700 uppercase flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Disciplina Destacada
              </p>
              <p className="text-base sm:text-lg print:text-lg font-black text-sky-950 mt-1 truncate">
                {topDisc ? `${topDisc.disciplina}` : '-'}
              </p>
              <p className="text-[11px] text-sky-700 mt-0.5">
                {topDisc ? `Promedio ${topDisc.promedio.toFixed(1)}` : ''}
              </p>
            </div>
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 print:p-2.5">
              <p className="text-[11px] font-bold text-amber-800 uppercase flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Área Prioritaria
              </p>
              <p className="text-base sm:text-lg print:text-lg font-black text-amber-950 mt-1 truncate">
                {lowDisc ? `${lowDisc.disciplina}` : '-'}
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                {lowDisc ? `Promedio ${lowDisc.promedio.toFixed(1)} (Reforzar)` : ''}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 print:grid-cols-2 gap-4 print:gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4 print:p-3 shadow-2xs">
              <h6 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Comparativa por Campos Formativos NEM (1°, 2° y 3°)
              </h6>
              <div className="h-72 print:h-auto w-full">
                <ChartBox printMode={printMode} screenHeight={280} printWidth={430} printHeight={235} minWidth={240}>
                  <RadarChart data={radarData} outerRadius={printMode ? '75%' : '72%'}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis dataKey="campo" tick={{ fontSize: printMode ? 12 : 11, fontWeight: 700, fill: '#1e293b' }} />
                    <PolarRadiusAxis angle={30} domain={[5, 10]} tickCount={6} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Radar name="1er Grado" dataKey="g1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.22} strokeWidth={2} isAnimationActive={false} />
                    <Radar name="2do Grado" dataKey="g2" stroke="#10b981" fill="#10b981" fillOpacity={0.22} strokeWidth={2} isAnimationActive={false} />
                    <Radar name="3er Grado" dataKey="g3" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.22} strokeWidth={2} isAnimationActive={false} />
                    <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 700 }} />
                    <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                  </RadarChart>
                </ChartBox>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 print:p-3 shadow-2xs">
              <h6 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                {esUnSoloTurno ? `Ranking de Disciplinas — Turno ${turnoVista}` : 'Ranking de Disciplinas — Promedio Escolar'}
              </h6>
              <div className="h-72 print:h-auto w-full">
                <ChartBox printMode={printMode} screenHeight={280} printWidth={430} printHeight={235} minWidth={240}>
                  <BarChart data={rankingDisciplinas} layout="vertical" margin={{ top: 14, right: 36, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" domain={[5, 10]} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis type="category" dataKey="disciplina" width={128} tick={{ fontSize: printMode ? 11 : 10, fontWeight: 700, fill: '#334155' }} />
                    <Tooltip
                      formatter={(v) => [Number(v).toFixed(1), 'Promedio']}
                      contentStyle={{ borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                    {promEscuela !== null && (
                      <ReferenceLine
                        x={parseFloat(truncateTo1Dec(promEscuela, '0'))}
                        stroke="#0f172a"
                        strokeDasharray="4 4"
                        label={{
                          value: `Prom ${fmt1(promEscuela)}`,
                          position: 'top',
                          fill: '#0f172a',
                          fontSize: 10,
                          fontWeight: 800
                        }}
                      />
                    )}
                    <Bar dataKey="promedio" radius={[0, 6, 6, 0]} barSize={printMode ? 17 : 16} isAnimationActive={false}>
                      {rankingDisciplinas.map((item) => (
                        <Cell key={item.disciplina} fill={item.color} />
                      ))}
                      <LabelList dataKey="promedio" position="right" formatter={(v) => Number(v).toFixed(1)} style={{ fontSize: printMode ? 11 : 10, fontWeight: 800, fill: '#0f172a' }} />
                    </Bar>
                  </BarChart>
                </ChartBox>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 print:p-3 shadow-2xs">
            <h6 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
              Promedio General por Grado
            </h6>
            <div className="h-56 print:h-auto w-full">
              <ChartBox printMode={printMode} screenHeight={215} printWidth={880} printHeight={155} minWidth={240}>
                <BarChart data={gradosBarData} margin={{ top: 20, right: 20, left: -12, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="grado" tick={{ fontSize: printMode ? 12 : 11, fontWeight: 700, fill: '#334155' }} />
                  <YAxis domain={[5, 10]} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 700 }} />
                  {mostrarComparativaTurnos && (
                    <>
                      <Bar dataKey="Matutino" fill="#0ea5e9" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                        <LabelList dataKey="Matutino" position="top" formatter={(v) => (v > 0 ? v.toFixed(1) : '')} style={{ fontSize: printMode ? 11 : 10, fontWeight: 800, fill: '#0369a1' }} />
                      </Bar>
                      <Bar dataKey="Vespertino" fill="#8b5cf6" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                        <LabelList dataKey="Vespertino" position="top" formatter={(v) => (v > 0 ? v.toFixed(1) : '')} style={{ fontSize: printMode ? 11 : 10, fontWeight: 800, fill: '#5b21b6' }} />
                      </Bar>
                    </>
                  )}
                  <Bar
                    dataKey="Escuela"
                    name={esUnSoloTurno ? `Promedio Turno ${turnoVista}` : 'Promedio Escolar'}
                    fill="#4f46e5"
                    radius={[6, 6, 0, 0]}
                    barSize={46}
                    isAnimationActive={false}
                  >
                    <LabelList dataKey="Escuela" position="top" formatter={(v) => (v > 0 ? v.toFixed(1) : '')} style={{ fontSize: printMode ? 12 : 11, fontWeight: 900, fill: '#312e81' }} />
                  </Bar>
                </BarChart>
              </ChartBox>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   3. TABLERO DE DESEMPEÑO ALCANZADO
   ========================================================================= */
function DesempenoCTE({ desempeno, momentoTitulo, cicloEscolar, printMode = false, turnoVista = 'Todos' }) {
  const esc = desempeno?.totalEscuela;
  const evaluados = esc?.comprobacion || 0;

  const barData = useMemo(
    () =>
      GRADOS_SEG.map((g, idx) => {
        const d = desempeno?.totalesGrado?.[g] || {};
        return {
          grado: `${idx + 1}° Grado`,
          '8.0 a 10': d.r8 || 0,
          '7.0 a 7.9': d.r7 || 0,
          '6.0 a 6.9': d.r6 || 0,
          '5.0 a 5.9': d.r5 || 0
        };
      }),
    [desempeno]
  );

  const pieData = useMemo(
    () => [
      { name: 'Excelencia (8.0–10)', value: esc?.r8 || 0, pct: esc?.pct8 || 0, color: '#10b981' },
      { name: 'Satisfactorio (7.0–7.9)', value: esc?.r7 || 0, pct: esc?.pct7 || 0, color: '#3b82f6' },
      { name: 'En Desarrollo (6.0–6.9)', value: esc?.r6 || 0, pct: esc?.pct6 || 0, color: '#f59e0b' },
      { name: 'Requieren Apoyo (5.0–5.9)', value: esc?.r5 || 0, pct: esc?.pct5 || 0, color: '#ef4444' }
    ],
    [esc]
  );

  return (
    <div className="print:w-full">
      <CTEHeaderBadge
        title="Semáforo de Indicadores de Logro y Desempeño"
        momentoTitulo={momentoTitulo}
        cicloEscolar={cicloEscolar}
        turnoVista={turnoVista}
      />

      {evaluados === 0 ? (
        <EmptyChartNotice message="Aún no hay alumnos con promedio evaluado para graficar su nivel de logro." />
      ) : (
        <div className="space-y-4 print:space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 print:grid-cols-4 gap-3 print:gap-3">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 print:p-3">
              <p className="text-[11px] print:text-xs font-bold text-emerald-700 uppercase">Excelencia (8.0–10)</p>
              <p className="text-2xl print:text-3xl font-black text-emerald-950 mt-1">{esc?.r8 || 0}</p>
              <p className="text-[11px] print:text-xs font-bold text-emerald-700 mt-0.5">{fmtPct(esc?.pct8)} del alumnado</p>
            </div>
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 print:p-3">
              <p className="text-[11px] print:text-xs font-bold text-blue-700 uppercase">Satisfactorio (7.0–7.9)</p>
              <p className="text-2xl print:text-3xl font-black text-blue-950 mt-1">{esc?.r7 || 0}</p>
              <p className="text-[11px] print:text-xs font-bold text-blue-700 mt-0.5">{fmtPct(esc?.pct7)} del alumnado</p>
            </div>
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 print:p-3">
              <p className="text-[11px] print:text-xs font-bold text-amber-800 uppercase">En Desarrollo (6.0–6.9)</p>
              <p className="text-2xl print:text-3xl font-black text-amber-950 mt-1">{esc?.r6 || 0}</p>
              <p className="text-[11px] print:text-xs font-bold text-amber-800 mt-0.5">{fmtPct(esc?.pct6)} del alumnado</p>
            </div>
            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 print:p-3">
              <p className="text-[11px] print:text-xs font-bold text-rose-700 uppercase flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Requieren Apoyo (5.0–5.9)
              </p>
              <p className="text-2xl print:text-3xl font-black text-rose-900 mt-1">{esc?.r5 || 0}</p>
              <p className="text-[11px] print:text-xs font-bold text-rose-700 mt-0.5">{fmtPct(esc?.pct5)} del alumnado</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 print:grid-cols-3 gap-4 print:gap-3">
            <div className="lg:col-span-2 print:col-span-2 bg-white border border-slate-200 rounded-xl p-4 print:p-3.5 shadow-2xs">
              <h6 className="text-xs print:text-sm font-extrabold uppercase tracking-wider text-slate-700 mb-3 print:mb-2">
                Distribución de Logro Académico por Grado
              </h6>
              <div className="h-64 print:h-auto w-full">
                <ChartBox printMode={printMode} screenHeight={250} printWidth={560} printHeight={375} minWidth={240}>
                  <BarChart data={barData} margin={{ top: 18, right: 16, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="grado" tick={{ fontSize: printMode ? 13 : 11, fontWeight: 700, fill: '#334155' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: printMode ? 12 : 11, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: printMode ? '12px' : '11px', fontWeight: 700 }} />
                    <Bar dataKey="8.0 a 10" stackId="a" fill="#10b981" isAnimationActive={false}>
                      <LabelList dataKey="8.0 a 10" position="center" formatter={nonZeroLabel} style={{ fontSize: printMode ? 12 : 10, fontWeight: 800, fill: '#ffffff' }} />
                    </Bar>
                    <Bar dataKey="7.0 a 7.9" stackId="a" fill="#3b82f6" isAnimationActive={false}>
                      <LabelList dataKey="7.0 a 7.9" position="center" formatter={nonZeroLabel} style={{ fontSize: printMode ? 12 : 10, fontWeight: 800, fill: '#ffffff' }} />
                    </Bar>
                    <Bar dataKey="6.0 a 6.9" stackId="a" fill="#f59e0b" isAnimationActive={false}>
                      <LabelList dataKey="6.0 a 6.9" position="center" formatter={nonZeroLabel} style={{ fontSize: printMode ? 12 : 10, fontWeight: 800, fill: '#ffffff' }} />
                    </Bar>
                    <Bar dataKey="5.0 a 5.9" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                      <LabelList dataKey="5.0 a 5.9" position="center" formatter={nonZeroLabel} style={{ fontSize: printMode ? 12 : 10, fontWeight: 800, fill: '#ffffff' }} />
                    </Bar>
                  </BarChart>
                </ChartBox>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 print:p-3.5 shadow-2xs flex flex-col justify-between">
              <h6 className="text-xs print:text-sm font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                Panorama Global de Desempeño
              </h6>
              <div className="h-52 print:h-auto relative flex items-center justify-center my-auto">
                <ChartBox printMode={printMode} screenHeight={205} printWidth={265} printHeight={290} minWidth={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={printMode ? 62 : 54}
                      outerRadius={printMode ? 98 : 80}
                      paddingAngle={2}
                      isAnimationActive={false}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name, item) => [`${val} alumnos (${fmtPct(item?.payload?.pct)})`, name]}
                      contentStyle={{ borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </PieChart>
                </ChartBox>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] print:text-xs font-bold uppercase text-slate-400">Evaluados</span>
                  <span className="text-2xl print:text-3xl font-black text-slate-900">{evaluados}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] print:text-xs pt-2 border-t border-slate-100">
                {pieData.map((p) => (
                  <div key={p.name} className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded">
                    <span className="flex items-center gap-1 font-semibold text-slate-700 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                      {p.name.split(' ')[0]}
                    </span>
                    <span className="font-black text-slate-900 ml-1">{fmtPct(p.pct)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   4. TABLERO DE ASISTENCIA
   ========================================================================= */
function AsistenciaCTE({ asistencia, momentoTitulo, cicloEscolar, printMode = false, turnoVista = 'Todos' }) {
  const esc = asistencia?.totalEscuela;
  const total = esc?.total || 0;

  const barData = useMemo(
    () =>
      GRADOS_SEG.map((g, idx) => {
        const d = asistencia?.totalesGrado?.[g] || {};
        return {
          grado: `${idx + 1}° Grado`,
          'Sin faltas (0)': d.sinFaltas || 0,
          '1 a 5 días': d.f1_5 || 0,
          '6 a 10 días': d.f6_10 || 0,
          'Más de 10 días': d.fMas10 || 0
        };
      }),
    [asistencia]
  );

  const pieData = useMemo(
    () => [
      { name: 'Sin faltas', value: esc?.sinFaltas || 0, pct: esc?.pctSinFaltas || 0, color: '#10b981' },
      { name: '1 a 5 días', value: esc?.f1_5 || 0, pct: esc?.pct1_5 || 0, color: '#38bdf8' },
      { name: '6 a 10 días', value: esc?.f6_10 || 0, pct: esc?.pct6_10 || 0, color: '#f59e0b' },
      { name: 'Más de 10 días', value: esc?.fMas10 || 0, pct: esc?.pctMas10 || 0, color: '#e11d48' }
    ],
    [esc]
  );

  return (
    <div className="print:w-full">
      <CTEHeaderBadge
        title="Análisis de Asistencia y Alertas de Ausentismo"
        momentoTitulo={momentoTitulo}
        cicloEscolar={cicloEscolar}
        turnoVista={turnoVista}
      />

      {total === 0 ? (
        <EmptyChartNotice message="Aún no hay conteos de asistencia registrados para graficar." />
      ) : (
        <div className="space-y-4 print:space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 print:grid-cols-4 gap-3 print:gap-3">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 print:p-3">
              <p className="text-[11px] print:text-xs font-bold text-emerald-700 uppercase flex items-center gap-1">
                <CalendarCheck className="w-3.5 h-3.5" /> Asistencia Perfecta (0)
              </p>
              <p className="text-2xl print:text-3xl font-black text-emerald-950 mt-1">{esc?.sinFaltas || 0}</p>
              <p className="text-[11px] print:text-xs font-bold text-emerald-700 mt-0.5">{fmtPct(esc?.pctSinFaltas)}</p>
            </div>
            <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5 print:p-3">
              <p className="text-[11px] print:text-xs font-bold text-sky-700 uppercase">Inasistencia Leve (1–5 d)</p>
              <p className="text-2xl print:text-3xl font-black text-sky-950 mt-1">{esc?.f1_5 || 0}</p>
              <p className="text-[11px] print:text-xs font-bold text-sky-700 mt-0.5">{fmtPct(esc?.pct1_5)}</p>
            </div>
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 print:p-3">
              <p className="text-[11px] print:text-xs font-bold text-amber-800 uppercase">Alerta Media (6–10 d)</p>
              <p className="text-2xl print:text-3xl font-black text-amber-950 mt-1">{esc?.f6_10 || 0}</p>
              <p className="text-[11px] print:text-xs font-bold text-amber-800 mt-0.5">{fmtPct(esc?.pct6_10)}</p>
            </div>
            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 print:p-3">
              <p className="text-[11px] print:text-xs font-bold text-rose-700 uppercase flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Riesgo Alto (&gt; 10 d)
              </p>
              <p className="text-2xl print:text-3xl font-black text-rose-900 mt-1">{esc?.fMas10 || 0}</p>
              <p className="text-[11px] print:text-xs font-bold text-rose-700 mt-0.5">{fmtPct(esc?.pctMas10)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 print:grid-cols-3 gap-4 print:gap-3">
            <div className="lg:col-span-2 print:col-span-2 bg-white border border-slate-200 rounded-xl p-4 print:p-3.5 shadow-2xs">
              <h6 className="text-xs print:text-sm font-extrabold uppercase tracking-wider text-slate-700 mb-3 print:mb-2">
                Distribución de Inasistencias por Grado
              </h6>
              <div className="h-64 print:h-auto w-full">
                <ChartBox printMode={printMode} screenHeight={250} printWidth={560} printHeight={375} minWidth={240}>
                  <BarChart data={barData} margin={{ top: 18, right: 16, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="grado" tick={{ fontSize: printMode ? 13 : 11, fontWeight: 700, fill: '#334155' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: printMode ? 12 : 11, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: printMode ? '12px' : '11px', fontWeight: 700 }} />
                    <Bar dataKey="Sin faltas (0)" stackId="b" fill="#10b981" isAnimationActive={false}>
                      <LabelList dataKey="Sin faltas (0)" position="center" formatter={nonZeroLabel} style={{ fontSize: printMode ? 12 : 10, fontWeight: 800, fill: '#ffffff' }} />
                    </Bar>
                    <Bar dataKey="1 a 5 días" stackId="b" fill="#38bdf8" isAnimationActive={false}>
                      <LabelList dataKey="1 a 5 días" position="center" formatter={nonZeroLabel} style={{ fontSize: printMode ? 12 : 10, fontWeight: 800, fill: '#0f172a' }} />
                    </Bar>
                    <Bar dataKey="6 a 10 días" stackId="b" fill="#f59e0b" isAnimationActive={false}>
                      <LabelList dataKey="6 a 10 días" position="center" formatter={nonZeroLabel} style={{ fontSize: printMode ? 12 : 10, fontWeight: 800, fill: '#ffffff' }} />
                    </Bar>
                    <Bar dataKey="Más de 10 días" stackId="b" fill="#e11d48" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                      <LabelList dataKey="Más de 10 días" position="center" formatter={nonZeroLabel} style={{ fontSize: printMode ? 12 : 10, fontWeight: 800, fill: '#ffffff' }} />
                    </Bar>
                  </BarChart>
                </ChartBox>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 print:p-3.5 shadow-2xs flex flex-col justify-between">
              <h6 className="text-xs print:text-sm font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                Tasa Global de Asistencia
              </h6>
              <div className="h-52 print:h-auto relative flex items-center justify-center my-auto">
                <ChartBox printMode={printMode} screenHeight={205} printWidth={265} printHeight={290} minWidth={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={printMode ? 62 : 54}
                      outerRadius={printMode ? 98 : 80}
                      paddingAngle={2}
                      isAnimationActive={false}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name, item) => [`${val} alumnos (${fmtPct(item?.payload?.pct)})`, name]}
                      contentStyle={{ borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </PieChart>
                </ChartBox>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] print:text-xs font-bold uppercase text-slate-400">Sin faltas</span>
                  <span className="text-xl print:text-2xl font-black text-emerald-700">{fmtPct(esc?.pctSinFaltas)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] print:text-xs pt-2 border-t border-slate-100">
                {pieData.map((p) => (
                  <div key={p.name} className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded">
                    <span className="flex items-center gap-1 font-semibold text-slate-700 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                      {p.name}
                    </span>
                    <span className="font-black text-slate-900 ml-1">{fmtPct(p.pct)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MomentosGraficasCTE({
  sheet,
  matricula,
  aprovechamiento,
  desempeno,
  asistencia,
  momentoTitulo,
  cicloEscolar,
  printMode = false,
  turnoVista = 'Todos'
}) {
  if (sheet === 'matricula') {
    return (
      <MatriculaCTE
        matricula={matricula}
        momentoTitulo={momentoTitulo}
        cicloEscolar={cicloEscolar}
        printMode={printMode}
        turnoVista={turnoVista}
      />
    );
  }
  if (sheet === 'aprovechamiento') {
    return (
      <AprovechamientoCTE
        aprovechamiento={aprovechamiento}
        momentoTitulo={momentoTitulo}
        cicloEscolar={cicloEscolar}
        printMode={printMode}
        turnoVista={turnoVista}
      />
    );
  }
  if (sheet === 'desempeno') {
    return (
      <DesempenoCTE
        desempeno={desempeno}
        momentoTitulo={momentoTitulo}
        cicloEscolar={cicloEscolar}
        printMode={printMode}
        turnoVista={turnoVista}
      />
    );
  }
  if (sheet === 'asistencia') {
    return (
      <AsistenciaCTE
        asistencia={asistencia}
        momentoTitulo={momentoTitulo}
        cicloEscolar={cicloEscolar}
        printMode={printMode}
        turnoVista={turnoVista}
      />
    );
  }
  return null;
}
