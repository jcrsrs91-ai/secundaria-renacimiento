import React from 'react';
import ConstanciaEERPrint from './ConstanciaEERPrint';

export default function BatchConstanciaEERPrint({ data = [], fechaExpedicion }) {
  return (
    <div className="batch-constancias bg-slate-100 min-h-screen py-8 print:py-0 print:bg-white flex flex-col items-center">
      <style>{`
        @media print {
          @page { size: letter portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
          .page-break { page-break-after: always; break-after: page; }
          .page-break:last-child { page-break-after: auto; break-after: auto; }
          .no-print { display: none !important; }
        }
      `}</style>
      
      {data.map((item, index) => (
        <div key={item.student.id || index} className="page-break w-[21.59cm] shadow-xl print:shadow-none mb-8 print:mb-0 bg-white relative">
          <ConstanciaEERPrint 
            student={item.student} 
            regularizadas={item.regularizadas} 
            adeudos={item.adeudos} 
            fechaExpedicion={fechaExpedicion} 
          />
        </div>
      ))}
    </div>
  );
}