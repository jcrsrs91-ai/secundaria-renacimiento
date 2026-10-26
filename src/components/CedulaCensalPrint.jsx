import React, { useState, useMemo, useEffect } from 'react';
import { Printer, ArrowLeft, Settings, Layers, List, FileText } from 'lucide-react';

const DEFAULT_CONFIG = {
  // Datos Personales del Responsable
  nombreResponsable: 'PROFR. JUAN CARLOS TABOADA BARAJAS',
  domicilioParticular: '',
  ciudad: 'ACAPULCO DE JUÁREZ, GRO.',
  correo: '',
  rfc: '',
  cp: '39715',
  celular: '',
  telefonoResponsable: '',
  // Datos de la Escuela
  nombreEscuela: 'ESC. SEC. TEC. N° 68 "RENACIMIENTO"',
  localidad: 'CD. RENACIMIENTO',
  region: 'ACAPULCO – COYUCA DE BENITEZ',
  municipio: 'ACAPULCO DE JUÁREZ',
  cct: '12DST0077B',
  zona: '24',
  sector: '06',
  nivel: 'SECUNDARIA',
  telefonoEscuela: '7444415678',
  // Firmas
  nombreDirectorFirma: 'PROFR. JUAN CARLOS TABOADA BARAJAS',
  nombreSupervisorFirma: '',
  nombreJefeInventarios: 'PROFR. JOSE ELIAS SILVA POLANCO'
};

export default function CedulaCensalPrint({ resguardos = [], inventario = [], initialBlank = false, onBack }) {
  const [modoOrigen, setModoOrigen] = useState(initialBlank ? 'blanco' : 'resguardos_agrupado');
  // 'resguardos_agrupado' | 'resguardos_desglosado' | 'inventario_agrupado' | 'inventario_desglosado' | 'blanco'
  const [showConfig, setShowConfig] = useState(false);

  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('cedula_censal_config_est68');
      if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_CONFIG;
  });

  useEffect(() => {
    try {
      localStorage.setItem('cedula_censal_config_est68', JSON.stringify(config));
    } catch (e) {
      console.error(e);
    }
  }, [config]);

  const filasMostradas = useMemo(() => {
    if (modoOrigen === 'blanco') return [];

    // 1. Obtener lista base según fuente seleccionada
    if (modoOrigen === 'resguardos_desglosado' || modoOrigen === 'resguardos_agrupado') {
      const allResguardoItems = [];
      resguardos.forEach(res => {
        const area = res.areaResguardante || res.area || res.cargo || '';
        const resguardante = res.nombreResguardante || res.resguardante || '';
        if (Array.isArray(res.articulos)) {
          res.articulos.forEach(art => {
            if (!art.cantidad && !art.descripcion && !art.articulo && !art.marca) return;
            allResguardoItems.push({
              cantidad: Number(art.cantidad) || 1,
              concepto: (art.descripcion || art.articulo || 'SIN DESCRIPCIÓN').trim().toUpperCase(),
              marca: (art.marca || 'S/M').trim().toUpperCase(),
              modelo: (art.modelo || 'S/M').trim().toUpperCase(),
              serie: (art.serie || 'S/N').trim().toUpperCase(),
              estado: (art.estado || 'BUENO').trim().toUpperCase(),
              observaciones: (
                art.observaciones ||
                [area && `ÁREA: ${area}`, resguardante && `RESG: ${resguardante}`, art.codigo && `CÓD: ${art.codigo}`]
                  .filter(Boolean)
                  .join(' | ')
              ).toUpperCase(),
              area
            });
          });
        }
      });

      if (modoOrigen === 'resguardos_desglosado') {
        return allResguardoItems;
      }

      // Agrupar por CONCEPTO + MARCA + MODELO + ESTADO
      const map = {};
      allResguardoItems.forEach(item => {
        const key = `${item.concepto}|${item.marca}|${item.modelo}|${item.estado}`;
        if (!map[key]) {
          map[key] = {
            cantidad: item.cantidad,
            concepto: item.concepto,
            marca: item.marca,
            modelo: item.modelo,
            serie: item.serie || 'S/N',
            estado: item.estado,
            areasSet: new Set(item.area ? [item.area.toUpperCase()] : []),
            seriesSet: new Set(item.serie && item.serie !== 'S/N' ? [item.serie] : [])
          };
        } else {
          map[key].cantidad += item.cantidad;
          if (item.area) map[key].areasSet.add(item.area.toUpperCase());
          if (item.serie && item.serie !== 'S/N') map[key].seriesSet.add(item.serie);
        }
      });

      return Object.values(map)
        .map(g => ({
          cantidad: g.cantidad,
          concepto: g.concepto,
          marca: g.marca,
          modelo: g.modelo,
          serie: g.seriesSet.size === 1 ? [...g.seriesSet][0] : (g.seriesSet.size > 1 ? 'VARIOS' : 'S/N'),
          estado: g.estado,
          observaciones: g.areasSet.size > 0 ? `DISTRIBUIDO EN: ${[...g.areasSet].join(', ')}` : 'EN RESGUARDO'
        }))
        .sort((a, b) => a.concepto.localeCompare(b.concepto));
    }

    // 2. Fuente: Inventario General Completo (Activos, excluyendo Bajas)
    const activos = inventario.filter(i => (i.estadoFisico || i.estado) !== 'Baja');
    if (modoOrigen === 'inventario_desglosado') {
      return activos.map(i => ({
        cantidad: Number(i.cantidad) || 1,
        concepto: (i.descripcion || i.articulo || 'SIN NOMBRE').trim().toUpperCase(),
        marca: (i.marca || 'S/M').trim().toUpperCase(),
        modelo: (i.modelo || 'S/M').trim().toUpperCase(),
        serie: (i.serie || 'S/N').trim().toUpperCase(),
        estado: (i.estadoFisico || i.estado || 'BUENO').trim().toUpperCase(),
        observaciones: [i.ubicacion && `UBIC: ${i.ubicacion}`, i.codigo && `CÓD: ${i.codigo}`, i.observaciones]
          .filter(Boolean)
          .join(' | ')
          .toUpperCase()
      }));
    }

    // Inventario General Agrupado
    const invMap = {};
    activos.forEach(i => {
      const concepto = (i.descripcion || i.articulo || 'SIN NOMBRE').trim().toUpperCase();
      const marca = (i.marca || 'S/M').trim().toUpperCase();
      const modelo = (i.modelo || 'S/M').trim().toUpperCase();
      const estado = (i.estadoFisico || i.estado || 'BUENO').trim().toUpperCase();
      const key = `${concepto}|${marca}|${modelo}|${estado}`;
      const qty = Number(i.cantidad) || 1;

      if (!invMap[key]) {
        invMap[key] = {
          cantidad: qty,
          concepto,
          marca,
          modelo,
          estado,
          ubicaciones: new Set(i.ubicacion ? [i.ubicacion.toUpperCase()] : []),
          series: new Set(i.serie && i.serie !== 'S/N' ? [i.serie.toUpperCase()] : [])
        };
      } else {
        invMap[key].cantidad += qty;
        if (i.ubicacion) invMap[key].ubicaciones.add(i.ubicacion.toUpperCase());
        if (i.serie && i.serie !== 'S/N') invMap[key].series.add(i.serie.toUpperCase());
      }
    });

    return Object.values(invMap)
      .map(g => ({
        cantidad: g.cantidad,
        concepto: g.concepto,
        marca: g.marca,
        modelo: g.modelo,
        serie: g.series.size === 1 ? [...g.series][0] : (g.series.size > 1 ? 'VARIOS' : 'S/N'),
        estado: g.estado,
        observaciones: g.ubicaciones.size > 0 ? `ÁREAS: ${[...g.ubicaciones].join(', ')}` : ''
      }))
      .sort((a, b) => a.concepto.localeCompare(b.concepto));
  }, [modoOrigen, resguardos, inventario]);

  const totalPiezas = useMemo(
    () => filasMostradas.reduce((acc, f) => acc + (Number(f.cantidad) || 0), 0),
    [filasMostradas]
  );

  // Asegurar mínimo 17 renglones como en el formato oficial de la SEG
  const emptyRowsCount = Math.max(0, 17 - filasMostradas.length);

  return (
    <div className="print-cedula-censal bg-white font-sans text-black">
      <style>{`
        @media print {
          @page { size: landscape; margin: 0.8cm; }
          html, body, #root { height: auto !important; overflow: visible !important; min-height: auto !important; display: block !important; }
          * { overflow: visible !important; }
          aside, header { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; margin: 0; }
          .no-print { display: none !important; }
          .print-cedula-censal { display: block !important; width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; }
        }
        @media screen {
          .print-cedula-censal { padding: 1.5rem 2rem; max-width: 1180px; margin: 1.5rem auto; box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.15); border-radius: 0.75rem; border: 1px solid #e2e8f0; }
        }
      `}</style>

      {/* BARRA DE HERRAMIENTAS EN PANTALLA (NO SE IMPRIME) */}
      <div className="no-print mb-6 space-y-4 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="px-3.5 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-xs flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Volver al Inventario
            </button>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">
              Cédula Censal Oficial SEG — {modoOrigen === 'blanco' ? 'Formato en Blanco' : `${filasMostradas.length} filas (${totalPiezas} bienes concentrados)`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center border transition ${
                showConfig
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Settings className="w-4 h-4 mr-1.5" /> Editar Datos del Responsable / Escuela
            </button>
            <button
              onClick={() => window.print()}
              className="px-5 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-bold shadow-sm text-xs flex items-center"
            >
              <Printer className="w-4 h-4 mr-1.5" /> Imprimir Cédula Censal
            </button>
          </div>
        </div>

        {/* Selector de Modo de Concentrado */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            ¿Qué información deseas mostrar en la Cédula Censal?
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setModoOrigen('resguardos_agrupado')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center transition ${
                modoOrigen === 'resguardos_agrupado'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5 mr-1.5" /> Concentrado de Resguardos (Agrupado)
            </button>
            <button
              onClick={() => setModoOrigen('resguardos_desglosado')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center transition ${
                modoOrigen === 'resguardos_desglosado'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              <List className="w-3.5 h-3.5 mr-1.5" /> Concentrado de Resguardos (Partida por Partida)
            </button>
            <button
              onClick={() => setModoOrigen('inventario_agrupado')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center transition ${
                modoOrigen === 'inventario_agrupado'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5 mr-1.5" /> Todo el Inventario Activo (Agrupado)
            </button>
            <button
              onClick={() => setModoOrigen('inventario_desglosado')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center transition ${
                modoOrigen === 'inventario_desglosado'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              <List className="w-3.5 h-3.5 mr-1.5" /> Todo el Inventario (1 por 1)
            </button>
            <button
              onClick={() => setModoOrigen('blanco')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center transition ${
                modoOrigen === 'blanco'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" /> Formato en Blanco (Llenar a mano)
            </button>
          </div>
        </div>

        {/* Panel desplegable para editar los datos del encabezado y firmas */}
        {showConfig && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-amber-200 pb-2">
              <h4 className="font-bold text-amber-900 uppercase tracking-wider">
                Datos del Encabezado y Firmas (Se guardan automáticamente)
              </h4>
              <button
                onClick={() => setConfig(DEFAULT_CONFIG)}
                className="text-amber-700 hover:underline font-semibold"
              >
                Restaurar valores por defecto
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre del Responsable:</label>
                <input
                  type="text"
                  value={config.nombreResponsable}
                  onChange={e => setConfig({ ...config, nombreResponsable: e.target.value })}
                  className="w-full p-1.5 border border-slate-300 rounded bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Domicilio Particular:</label>
                <input
                  type="text"
                  value={config.domicilioParticular}
                  onChange={e => setConfig({ ...config, domicilioParticular: e.target.value })}
                  className="w-full p-1.5 border border-slate-300 rounded bg-white"
                  placeholder="Calle, Número, Colonia..."
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Correo Electrónico:</label>
                <input
                  type="text"
                  value={config.correo}
                  onChange={e => setConfig({ ...config, correo: e.target.value })}
                  className="w-full p-1.5 border border-slate-300 rounded bg-white"
                  placeholder="ejemplo@correo.com"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">RFC del Responsable:</label>
                <input
                  type="text"
                  value={config.rfc}
                  onChange={e => setConfig({ ...config, rfc: e.target.value })}
                  className="w-full p-1.5 border border-slate-300 rounded bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">C.P. / Ciudad:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.cp}
                    onChange={e => setConfig({ ...config, cp: e.target.value })}
                    className="w-24 p-1.5 border border-slate-300 rounded bg-white"
                    placeholder="C.P."
                  />
                  <input
                    type="text"
                    value={config.ciudad}
                    onChange={e => setConfig({ ...config, ciudad: e.target.value })}
                    className="flex-1 p-1.5 border border-slate-300 rounded bg-white"
                    placeholder="Ciudad"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Celular / Teléfono Particular:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.celular}
                    onChange={e => setConfig({ ...config, celular: e.target.value })}
                    className="w-1/2 p-1.5 border border-slate-300 rounded bg-white"
                    placeholder="Celular"
                  />
                  <input
                    type="text"
                    value={config.telefonoResponsable}
                    onChange={e => setConfig({ ...config, telefonoResponsable: e.target.value })}
                    className="w-1/2 p-1.5 border border-slate-300 rounded bg-white"
                    placeholder="Teléfono fijo"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Director(a) de la Escuela (Firma Izq.):</label>
                <input
                  type="text"
                  value={config.nombreDirectorFirma}
                  onChange={e => setConfig({ ...config, nombreDirectorFirma: e.target.value })}
                  className="w-full p-1.5 border border-slate-300 rounded bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Supervisor de la Zona (Firma Centro):</label>
                <input
                  type="text"
                  value={config.nombreSupervisorFirma}
                  onChange={e => setConfig({ ...config, nombreSupervisorFirma: e.target.value })}
                  className="w-full p-1.5 border border-slate-300 rounded bg-white"
                  placeholder="Nombre del Supervisor (opcional)"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Jefe de Inventarios (Firma Der.):</label>
                <input
                  type="text"
                  value={config.nombreJefeInventarios}
                  onChange={e => setConfig({ ...config, nombreJefeInventarios: e.target.value })}
                  className="w-full p-1.5 border border-slate-300 rounded bg-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          FORMATO OFICIAL: CÉDULA CENSAL DE MOBILIARIO, EQUIPO DE OFICINA Y COMPUTO
          ===================================================================== */}
      <div className="w-full text-black select-text">
        {/* ENCABEZADO OFICIAL CON LOGOS */}
        <div className="flex justify-between items-center mb-2">
          <div className="w-1/4 flex items-center">
            <img src="/logo-sep.png" alt="Gobierno de Guerrero" className="h-14 object-contain" />
          </div>
          <div className="w-2/4 text-center">
            <h1 className="font-bold text-[11px] leading-tight uppercase tracking-tight">
              SECRETARIA DE EDUCACIÓN GUERRERO<br />
              SUBSECRETARIA DE ADMINISTRACIÓN Y FINANZAS<br />
              DIRECCIÓN GENERAL DE RECURSOS MATERIALES Y SERVICIOS<br />
              DEPARTAMENTO DE ALMACENES E INVENTARIOS<br />
              OFICINA DE INVENTARIOS
            </h1>
          </div>
          <div className="w-1/4 flex justify-end items-center">
            <img src="/logo-educacion.png" alt="Secretaría de Educación" className="h-14 object-contain" />
          </div>
        </div>

        {/* BARRA GRIS DE TÍTULO */}
        <div
          className="border border-black text-center py-1 mb-2"
          style={{ backgroundColor: '#cccccc' }}
        >
          <h2 className="font-bold text-[12px] uppercase tracking-wide">
            CÉDULA CENSAL DE MOBILIARIO, EQUIPO DE OFICINA Y COMPUTO
          </h2>
        </div>

        {/* RECUADRO SUPERIOR DIVIDIDO EN DOS COLUMNAS */}
        <div className="flex w-full border border-black mb-2 text-[10px]">
          {/* IZQUIERDA: DATOS PERSONALES DEL RESPONSABLE */}
          <div className="w-1/2 border-r border-black p-2">
            <div className="text-center font-bold text-[10.5px] mb-1.5 uppercase">
              DATOS PERSONALES DEL RESPONSABLE
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline">
                <span className="font-bold mr-1.5 whitespace-nowrap">NOMBRE:</span>
                <span className="uppercase font-medium flex-1 truncate">
                  {modoOrigen === 'blanco' ? '' : config.nombreResponsable}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="font-bold mr-1.5 whitespace-nowrap">DOMICILIO PARTICULAR:</span>
                <span className="uppercase font-medium flex-1 truncate">
                  {modoOrigen === 'blanco' ? '' : config.domicilioParticular}
                </span>
              </div>
              <div className="flex items-baseline">
                <div className="w-[55%] flex items-baseline pr-2">
                  <span className="font-bold mr-1.5 whitespace-nowrap">CIUDAD:</span>
                  <span className="uppercase font-medium truncate">
                    {modoOrigen === 'blanco' ? '' : config.ciudad}
                  </span>
                </div>
                <div className="w-[45%] flex items-baseline">
                  <span className="font-bold mr-1.5 whitespace-nowrap">CORREO :</span>
                  <span className="font-medium truncate">
                    {modoOrigen === 'blanco' ? '' : config.correo}
                  </span>
                </div>
              </div>
              <div className="flex items-baseline">
                <div className="w-[55%] flex items-baseline pr-2">
                  <span className="font-bold mr-1.5 whitespace-nowrap">RFC:</span>
                  <span className="uppercase font-medium truncate">
                    {modoOrigen === 'blanco' ? '' : config.rfc}
                  </span>
                </div>
                <div className="w-[45%] flex items-baseline">
                  <span className="font-bold mr-1.5 whitespace-nowrap">C.P.:</span>
                  <span className="uppercase font-medium truncate">
                    {modoOrigen === 'blanco' ? '' : config.cp}
                  </span>
                </div>
              </div>
              <div className="flex items-baseline">
                <div className="w-[55%] flex items-baseline pr-2">
                  <span className="font-bold mr-1.5 whitespace-nowrap">CELULAR:</span>
                  <span className="uppercase font-medium truncate">
                    {modoOrigen === 'blanco' ? '' : config.celular}
                  </span>
                </div>
                <div className="w-[45%] flex items-baseline">
                  <span className="font-bold mr-1.5 whitespace-nowrap">TELEFONO:</span>
                  <span className="uppercase font-medium truncate">
                    {modoOrigen === 'blanco' ? '' : config.telefonoResponsable}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* DERECHA: DATOS DE LA ESCUELA */}
          <div className="w-1/2 p-2">
            <div className="text-center font-bold text-[10.5px] mb-1.5 uppercase">
              DATOS DE LA ESCUELA
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline">
                <span className="font-bold mr-1.5 whitespace-nowrap">NOMBRE DE LA ESCUELA:</span>
                <span className="uppercase font-medium flex-1 truncate">
                  {config.nombreEscuela}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="font-bold mr-1.5 whitespace-nowrap">LOCALIDAD:</span>
                <span className="uppercase font-medium flex-1 truncate">
                  {config.localidad}
                </span>
              </div>
              <div className="flex items-baseline">
                <div className="w-[55%] flex items-baseline pr-2">
                  <span className="font-bold mr-1.5 whitespace-nowrap">REGIÓN:</span>
                  <span className="uppercase font-medium truncate text-[9px]">
                    {config.region}
                  </span>
                </div>
                <div className="w-[45%] flex items-baseline">
                  <span className="font-bold mr-1.5 whitespace-nowrap">MUNICIPIO:</span>
                  <span className="uppercase font-medium truncate">
                    {config.municipio}
                  </span>
                </div>
              </div>
              <div className="flex items-baseline">
                <div className="w-[55%] flex items-baseline pr-2">
                  <span className="font-bold mr-1.5 whitespace-nowrap">C.C.T.:</span>
                  <span className="uppercase font-medium truncate">
                    {config.cct}
                  </span>
                </div>
                <div className="w-[22%] flex items-baseline pr-1">
                  <span className="font-bold mr-1 whitespace-nowrap">ZONA:</span>
                  <span className="uppercase font-medium truncate">
                    {config.zona}
                  </span>
                </div>
                <div className="w-[23%] flex items-baseline">
                  <span className="font-bold mr-1 whitespace-nowrap">SECTOR:</span>
                  <span className="uppercase font-medium truncate">
                    {config.sector}
                  </span>
                </div>
              </div>
              <div className="flex items-baseline">
                <div className="w-[55%] flex items-baseline pr-2">
                  <span className="font-bold mr-1.5 whitespace-nowrap">NIVEL:</span>
                  <span className="uppercase font-medium truncate">
                    {config.nivel}
                  </span>
                </div>
                <div className="w-[45%] flex items-baseline">
                  <span className="font-bold mr-1.5 whitespace-nowrap">TELEFONO:</span>
                  <span className="uppercase font-medium truncate">
                    {config.telefonoEscuela}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TABLA PRINCIPAL DEL CONCENTRADO */}
        <table className="w-full border-collapse border border-black text-[9.5px] mb-2">
          <thead>
            <tr style={{ backgroundColor: '#cccccc' }} className="font-bold uppercase text-center">
              <th className="border border-black py-1.5 px-1 w-[6%]">CANT.</th>
              <th className="border border-black py-1.5 px-2 w-[31%]">CONCEPTO</th>
              <th className="border border-black py-1.5 px-1 w-[11%]">MARCA</th>
              <th className="border border-black py-1.5 px-1 w-[9%]">MODELO</th>
              <th className="border border-black py-1.5 px-1 w-[11%]">SERIE</th>
              <th className="border border-black py-1 px-1 w-[10%] leading-tight">
                ESTADO<br />FISICO
              </th>
              <th className="border border-black py-1.5 px-2 w-[22%]">OBSERVACIONES</th>
            </tr>
          </thead>
          <tbody>
            {filasMostradas.map((fila, idx) => (
              <tr key={idx} className="h-[22px] text-center">
                <td className="border border-black px-1 py-0.5 font-bold">{fila.cantidad}</td>
                <td className="border border-black px-2 py-0.5 text-left uppercase font-medium">
                  {fila.concepto}
                </td>
                <td className="border border-black px-1 py-0.5 uppercase">{fila.marca}</td>
                <td className="border border-black px-1 py-0.5 uppercase">{fila.modelo}</td>
                <td className="border border-black px-1 py-0.5 uppercase font-mono text-[8.5px]">
                  {fila.serie}
                </td>
                <td className="border border-black px-1 py-0.5 uppercase font-semibold">
                  {fila.estado}
                </td>
                <td className="border border-black px-1.5 py-0.5 text-left uppercase text-[8px] leading-tight">
                  {fila.observaciones}
                </td>
              </tr>
            ))}
            {[...Array(emptyRowsCount)].map((_, idx) => (
              <tr key={`empty-${idx}`} className="h-[22px]">
                <td className="border border-black px-1 py-0.5">&nbsp;</td>
                <td className="border border-black px-1 py-0.5">&nbsp;</td>
                <td className="border border-black px-1 py-0.5">&nbsp;</td>
                <td className="border border-black px-1 py-0.5">&nbsp;</td>
                <td className="border border-black px-1 py-0.5">&nbsp;</td>
                <td className="border border-black px-1 py-0.5">&nbsp;</td>
                <td className="border border-black px-1 py-0.5">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* RECUADRO INFERIOR DE 3 FIRMAS */}
        <div className="flex w-full border border-black min-h-[108px] text-[9.5px] uppercase font-bold">
          {/* COLUMNA 1: ATENTAMENTE / DIRECTOR(A) DE LA ESCUELA */}
          <div className="w-1/3 border-r border-black flex flex-col justify-between p-2 text-center">
            <div className="tracking-widest">A T E N T A M E N T E</div>
            <div className="mt-10">
              {config.nombreDirectorFirma && (
                <div className="text-[9px] font-bold mb-0.5">{config.nombreDirectorFirma}</div>
              )}
              <div>DIRECTOR (A) DE LA ESCUELA</div>
            </div>
          </div>

          {/* COLUMNA 2: Vo. Bo. / SUPERVISOR DE LA ZONA */}
          <div className="w-1/3 border-r border-black flex flex-col justify-between p-2 text-center">
            <div>Vo. Bo.</div>
            <div className="mt-10">
              {config.nombreSupervisorFirma && (
                <div className="text-[9px] font-bold mb-0.5">{config.nombreSupervisorFirma}</div>
              )}
              <div>SUPERVISOR DE LA ZONA</div>
            </div>
          </div>

          {/* COLUMNA 3: JEFE DE INVENTARIOS */}
          <div className="w-1/3 flex flex-col justify-between p-2 text-center">
            <div>JEFE DE INVENTARIOS</div>
            <div className="mt-6 leading-tight text-[9px]">
              <div>{config.nombreJefeInventarios}</div>
              <div>REPRESENTANTE DE RECURSOS MATERIALES Y SERVICIOS</div>
              <div>DE LA REGIÓN ACAPULCO – COYUCA DE BENITEZ.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
