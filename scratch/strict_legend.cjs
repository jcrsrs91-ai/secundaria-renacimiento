const fs = require('fs');

let c = fs.readFileSync('src/pages/public/PreInscripcion.jsx', 'utf8');

c = c.replace(
    /<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left">([\s\S]*?)<\/div>/,
    `<div className="mt-4 p-4 bg-red-100 border-2 border-red-500 rounded-lg text-left shadow-sm">
                      <h4 className="text-red-700 font-black text-base mb-2 uppercase flex items-center"><AlertTriangle className="w-5 h-5 mr-2" /> ATENCIÓN: REQUISITOS DE FOTOGRAFÍA!!</h4>
                      <p className="text-sm text-red-800 font-bold mb-2">Esta fotografía se imprimirá directamente en la CREDENCIAL ESCOLAR OFICIAL. Si no cumple con los siguientes requisitos, el trámite será <span className="underline">RECHAZADO</span>:</p>
                      <ul className="list-disc pl-5 text-sm text-red-800 mt-2 space-y-1 font-semibold">
                        <li>Fondo COMPLETAMENTE BLANCO (sin sombras, sin texturas).</li>
                        <li>Vestir playera o camisa escolar (BLANCA), sin logotipos.</li>
                        <li>Cabello bien peinado y completamente RECOGIDO hacia atrás.</li>
                        <li>Rostro descubierto (orejas y frente visibles).</li>
                        <li>SIN maquillaje, SIN aretes, SIN collares, SIN lentes.</li>
                        <li>Rostro serio y mirando de frente.</li>
                        <li>Debe ser una foto RECIENTE.</li>
                      </ul>
                    </div>`
);

fs.writeFileSync('src/pages/public/PreInscripcion.jsx', c);
console.log("Updated legend");
