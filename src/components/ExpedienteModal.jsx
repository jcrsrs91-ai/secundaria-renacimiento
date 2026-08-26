import React, { useState } from 'react';
import { X, ExternalLink, Download, AlertTriangle } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { PDFDocument } from 'pdf-lib';

export default function ExpedienteModal({ student, onClose }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!student) return null;

  const docs = [
    { key: 'actaUrl', label: 'Acta de Nacimiento' },
    { key: 'curpUrl', label: 'CURP' },
    { key: 'certificadoUrl', label: 'Certificado de Primaria' },
    { key: 'asignacionUrl', label: 'Constancia de Asignación' },
    { key: 'ineUrl', label: 'INE del Tutor' },
    { key: 'domicilioUrl', label: 'Comprobante de Domicilio' },
    { key: 'ineContacto1Url', label: 'INE Contacto 1' },
    { key: 'ineContacto2Url', label: 'INE Contacto 2' }
  ];

  const availableDocs = docs.filter(d => student[d.key]);

  const handleOpenAll = () => {
    availableDocs.forEach(d => {
      window.open(student[d.key], '_blank');
    });
  };

  const handleDownloadZip = async () => {
    if (availableDocs.length === 0) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const zip = new JSZip();
      for (const d of availableDocs) {
        const url = student[d.key];
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        
        let ext = 'pdf';
        if (blob.type.includes('image/jpeg')) ext = 'jpg';
        else if (blob.type.includes('image/png')) ext = 'png';
        
        zip.file(`${d.label}.${ext}`, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `Expediente_${student.curp || student.nombres}.zip`);
    } catch (error) {
      console.error(error);
      setErrorMsg('Error de seguridad (CORS) bloqueó la descarga en segundo plano. Usa "Abrir todos" y guárdalos manualmente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (availableDocs.length === 0) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const mergedPdf = await PDFDocument.create();
      
      for (const d of availableDocs) {
        const url = student[d.key];
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = await res.arrayBuffer();
        const contentType = res.headers.get('content-type') || '';

        try {
          if (contentType.includes('pdf') || url.toLowerCase().includes('.pdf')) {
            const pdfDoc = await PDFDocument.load(buffer);
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
          } else if (contentType.includes('image/jpeg') || url.toLowerCase().includes('.jpg')) {
            const image = await mergedPdf.embedJpg(buffer);
            const page = mergedPdf.addPage([image.width, image.height]);
            page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
          } else if (contentType.includes('image/png') || url.toLowerCase().includes('.png')) {
            const image = await mergedPdf.embedPng(buffer);
            const page = mergedPdf.addPage([image.width, image.height]);
            page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
          }
        } catch (e) {
          console.warn(`Could not merge ${d.label}`, e);
          // Just skip it if format is not supported for merge
        }
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, `Expediente_${student.curp || student.nombres}.pdf`);
    } catch (error) {
      console.error(error);
      setErrorMsg('Error de seguridad (CORS) bloqueó la descarga en segundo plano. Usa "Abrir todos" y guárdalos manualmente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Expediente Digital</h2>
            <p className="text-sm text-slate-500 mt-1 uppercase">
              {student.apellidoPaterno} {student.apellidoMaterno} {student.nombres}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {errorMsg && (
            <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-3 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}

          <div className="grid gap-3">
            {docs.map(doc => {
              const url = student[doc.key];
              return (
                <div key={doc.key} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                  <span className="font-medium text-slate-700">{doc.label}</span>
                  {url ? (
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 font-semibold rounded-md flex items-center gap-2 hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" /> Ver Archivo
                    </a>
                  ) : (
                    <span className="text-sm text-slate-400 italic">Pendiente</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-xl">
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={handleOpenAll}
              disabled={availableDocs.length === 0 || loading}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors disabled:opacity-50"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir Todos
            </button>
            <button 
              onClick={handleDownloadZip}
              disabled={availableDocs.length === 0 || loading}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {loading ? 'Procesando...' : 'Descargar ZIP'}
            </button>
            <button 
              onClick={handleDownloadPdf}
              disabled={availableDocs.length === 0 || loading}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {loading ? 'Procesando...' : 'Generar PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
