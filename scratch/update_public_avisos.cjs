const fs = require('fs');

let c = fs.readFileSync('src/pages/public/PublicAvisos.jsx', 'utf8');

c = c.replace(
  "import { Megaphone, Calendar, ArrowLeft } from 'lucide-react';",
  "import { Megaphone, Calendar, ArrowLeft, FileText, Download } from 'lucide-react';"
);

const oldImgRendering = `{aviso.imageUrl && (
                  <div className="mb-6 rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex justify-center bg-slate-50">
                    <img src={aviso.imageUrl} alt="Comunicado Oficial" className="w-full max-w-3xl max-h-[600px] object-contain" />
                  </div>
                )}`;

const newImgRendering = `
                {/* Legacy image support */}
                {aviso.imageUrl && (!aviso.attachments || aviso.attachments.length === 0) && (
                  <div className="mb-6 rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex justify-center bg-slate-50">
                    <img src={aviso.imageUrl} alt="Comunicado Oficial" className="w-full max-w-3xl max-h-[600px] object-contain" />
                  </div>
                )}
                
                {/* New multiple attachments support */}
                {aviso.attachments && aviso.attachments.length > 0 && (
                  <div className="mb-6 space-y-4">
                    {/* Render images first */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {aviso.attachments.filter(a => a.type === 'image').map((img, idx) => (
                        <div key={idx} className="rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex justify-center bg-slate-50">
                           <img src={img.url} alt={\`Adjunto \${idx+1}\`} className="w-full max-h-[400px] object-contain cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(img.url, '_blank')} />
                        </div>
                      ))}
                    </div>
                    {/* Render PDFs */}
                    {aviso.attachments.filter(a => a.type === 'pdf').length > 0 && (
                      <div className="flex flex-col gap-2 mt-4">
                        <p className="text-sm font-bold text-slate-700">Archivos Adjuntos:</p>
                        {aviso.attachments.filter(a => a.type === 'pdf').map((pdf, idx) => (
                          <a key={idx} href={pdf.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-sky-300 hover:shadow-sm transition-all group">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center mr-3">
                                <FileText className="w-5 h-5 text-rose-500" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800 group-hover:text-sky-600 transition-colors">{pdf.name}</p>
                                <p className="text-xs text-slate-500">Documento PDF</p>
                              </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-sky-50 transition-colors">
                               <Download className="w-4 h-4 text-slate-400 group-hover:text-sky-500" />
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}`;

c = c.replace(oldImgRendering, newImgRendering);

fs.writeFileSync('src/pages/public/PublicAvisos.jsx', c);
console.log("Updated PublicAvisos.jsx");
