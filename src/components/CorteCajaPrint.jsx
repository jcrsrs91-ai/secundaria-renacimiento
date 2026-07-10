import React from 'react';

export default function CorteCajaPrint({ config, pagos, gastos }) {
  if (!config) return null;

  // Filtrar por fechas y turno
  const start = new Date(config.fechaInicio + 'T00:00:00').getTime();
  const end = new Date(config.fechaFin + 'T23:59:59').getTime();

  const filterData = (data) => {
    return data.filter(item => {
      const date = new Date(item.fechaRegistro).getTime();
      const inRange = date >= start && date <= end;
      const matchTurno = config.turno === 'Todos' || item.turno === config.turno || item.turno === 'General';
      return inRange && matchTurno;
    });
  };

  const pagosFiltrados = filterData(pagos);
  const gastosFiltrados = filterData(gastos);

  // Totales
  const totalIngresos = pagosFiltrados.reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
  const totalEgresos = gastosFiltrados.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);
  const saldoFinal = totalIngresos - totalEgresos;

  // Agrupar ingresos por concepto
  const ingresosPorConcepto = pagosFiltrados.reduce((acc, p) => {
    const cat = p.concepto_nombre || 'Otro';
    if (!acc[cat]) acc[cat] = { count: 0, amount: 0 };
    acc[cat].count += 1;
    acc[cat].amount += Number(p.monto) || 0;
    return acc;
  }, {});

  // Agrupar egresos por concepto
  const egresosPorConcepto = gastosFiltrados.reduce((acc, g) => {
    const cat = g.concepto || 'Otro';
    if (!acc[cat]) acc[cat] = { count: 0, amount: 0 };
    acc[cat].count += 1;
    acc[cat].amount += Number(g.monto) || 0;
    return acc;
  }, {});

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto text-black font-sans print:m-0 print:p-4 print:max-w-full text-sm">
      {/* Encabezado */}
      <div className="text-center mb-6 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-bold uppercase">Escuela Secundaria Técnica N°68</h1>
        <h2 className="text-xl font-semibold uppercase">"Renacimiento"</h2>
        <p className="text-sm mt-1">C.C.T. 12DST0068Z</p>
        <p className="text-sm">Departamento de Contraloría</p>
        <h3 className="text-lg font-bold mt-4 uppercase bg-slate-100 border border-black inline-block px-4 py-1">
          Corte de Caja Oficial
        </h3>
      </div>

      {/* Metadatos del Reporte */}
      <div className="flex justify-between items-center mb-6 bg-slate-50 p-4 border border-slate-300 rounded-lg">
        <div>
          <p><strong>Periodo:</strong> {new Date(config.fechaInicio + 'T00:00:00').toLocaleDateString()} al {new Date(config.fechaFin + 'T23:59:59').toLocaleDateString()}</p>
          <p><strong>Turno Analizado:</strong> {config.turno}</p>
        </div>
        <div className="text-right">
          <p><strong>Fecha de Emisión:</strong> {new Date().toLocaleDateString()}</p>
          <p><strong>Operaciones Totales:</strong> {pagosFiltrados.length + gastosFiltrados.length}</p>
        </div>
      </div>

      {/* Resumen Financiero */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border-2 border-emerald-600 p-4 rounded-lg text-center bg-emerald-50">
          <p className="text-sm font-bold text-emerald-800 uppercase">Total Ingresos</p>
          <p className="text-2xl font-black text-emerald-700">${totalIngresos.toFixed(2)}</p>
        </div>
        <div className="border-2 border-rose-600 p-4 rounded-lg text-center bg-rose-50">
          <p className="text-sm font-bold text-rose-800 uppercase">Total Egresos</p>
          <p className="text-2xl font-black text-rose-700">${totalEgresos.toFixed(2)}</p>
        </div>
        <div className="border-2 border-blue-600 p-4 rounded-lg text-center bg-blue-50">
          <p className="text-sm font-bold text-blue-800 uppercase">Saldo en Caja</p>
          <p className="text-2xl font-black text-blue-700">${saldoFinal.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Desglose Ingresos */}
        <div>
          <h4 className="font-bold border-b-2 border-black mb-2 pb-1 uppercase">Desglose de Ingresos</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="px-2 py-1 text-left border">Concepto</th>
                <th className="px-2 py-1 text-center border">Cant.</th>
                <th className="px-2 py-1 text-right border">Monto</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(ingresosPorConcepto).map(([key, data]) => (
                <tr key={key}>
                  <td className="px-2 py-1 border">{key}</td>
                  <td className="px-2 py-1 text-center border">{data.count}</td>
                  <td className="px-2 py-1 text-right border font-semibold">${data.amount.toFixed(2)}</td>
                </tr>
              ))}
              {Object.keys(ingresosPorConcepto).length === 0 && (
                <tr><td colSpan="3" className="px-2 py-4 text-center border text-gray-500">Sin ingresos en este periodo</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Desglose Egresos */}
        <div>
          <h4 className="font-bold border-b-2 border-black mb-2 pb-1 uppercase">Desglose de Egresos</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="px-2 py-1 text-left border">Concepto</th>
                <th className="px-2 py-1 text-center border">Cant.</th>
                <th className="px-2 py-1 text-right border">Monto</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(egresosPorConcepto).map(([key, data]) => (
                <tr key={key}>
                  <td className="px-2 py-1 border">{key}</td>
                  <td className="px-2 py-1 text-center border">{data.count}</td>
                  <td className="px-2 py-1 text-right border font-semibold">${data.amount.toFixed(2)}</td>
                </tr>
              ))}
              {Object.keys(egresosPorConcepto).length === 0 && (
                <tr><td colSpan="3" className="px-2 py-4 text-center border text-gray-500">Sin egresos en este periodo</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Firmas de Auditoría */}
      <div className="mt-16 pt-8 flex justify-between items-end border-t border-dashed border-gray-400">
        <div className="text-center w-56">
          <div className="border-b border-black mb-2"></div>
          <p className="font-bold text-sm">Contralor(a) Escolar</p>
          <p className="text-xs text-gray-600">Elaboró</p>
        </div>
        <div className="text-center w-56">
          <div className="border-b border-black mb-2"></div>
          <p className="font-bold text-sm">Dirección Escolar</p>
          <p className="text-xs text-gray-600">Autorizó / Validó</p>
        </div>
        <div className="text-center w-56">
          <div className="border-b border-black mb-2"></div>
          <p className="font-bold text-sm">Auditor / Tesorero (APF)</p>
          <p className="text-xs text-gray-600">Revisión Física</p>
        </div>
      </div>
      
      <div className="mt-12 text-center text-xs text-gray-500">
        <p>Documento generado por el Sistema Integral de Control Escolar (SICE)</p>
      </div>
    </div>
  );
}
