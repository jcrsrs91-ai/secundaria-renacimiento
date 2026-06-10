import { useState, useRef, useEffect } from 'react';
import { Upload, X, Save, RefreshCw, AlertCircle, Plus, Trash2, KeyRound, ExternalLink } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Configurar el worker de PDF.js usando Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function ScannerInventarioModal({ onClose, onSaveSuccess }) {
  const [image, setImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState([]); // Array of { cantidad, descripcion, marca, serie, estado, inventario }
  const [isSaving, setIsSaving] = useState(false);
  
  // API Key Management
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(!localStorage.getItem('gemini_api_key'));
  const [tempKey, setTempKey] = useState('');

  const fileInputRef = useRef(null);

  const saveApiKey = () => {
    if (tempKey.trim().length > 10) {
      localStorage.setItem('gemini_api_key', tempKey.trim());
      setApiKey(tempKey.trim());
      setShowApiKeyPrompt(false);
    } else {
      alert("Por favor ingresa una API Key válida.");
    }
  };

  const clearApiKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setShowApiKeyPrompt(true);
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!apiKey) {
      alert("Primero necesitas configurar tu API Key.");
      return;
    }

    setIsProcessing(true);
    setExtractedData([]);

    try {
      let imagesArray = [];

      if (file.type === 'application/pdf') {
        setImage(null);
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;

        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 }); // Escala 2.0 + JPEG para ahorrar memoria en múltiples páginas
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          await page.render({ canvasContext: context, viewport: viewport }).promise;
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          imagesArray.push({ dataUrl, mimeType: 'image/jpeg' });
        }
        
        setImage(imagesArray[0].dataUrl); // Mostrar solo la primera como vista previa
      } else {
        const base64DataUrl = await fileToBase64(file);
        setImage(base64DataUrl);
        imagesArray.push({ dataUrl: base64DataUrl, mimeType: file.type });
      }

      await runGemini(imagesArray);
    } catch (error) {
      console.error("Parse Error:", error);
      alert("Hubo un error al procesar el archivo localmente.");
      setIsProcessing(false);
    }
  };

  const runGemini = async (imagesArray) => {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      
      const imageParts = imagesArray.map(img => ({
        inlineData: {
          data: img.dataUrl.split(',')[1],
          mimeType: img.mimeType
        }
      }));

      const prompt = `Analiza todas las páginas de este documento escaneado que contiene una lista o tabla de inventario de mobiliario escolar.
Extrae CADA UNA de las filas de TODAS las páginas de la tabla con precisión.
Devuelve EXCLUSIVAMENTE un único arreglo JSON válido donde cada objeto tenga estas propiedades exactas:
"cantidad" (string),
"inventario" (string, código o clave),
"descripcion" (string),
"marca" (string, vacío si no hay),
"serie" (string, vacío si no hay)

No incluyas texto fuera del JSON. Ni siquiera bloques de código markdown (\`\`\`json). SOLO el arreglo puro con los objetos combinados de todas las páginas.`;

      const modelsToTry = [
        "gemini-3.5-flash", 
        "gemini-3.0-flash", 
        "gemini-2.5-flash", 
        "gemini-1.5-flash-latest", 
        "gemini-1.5-pro"
      ];
      
      let result = null;
      let lastError = null;

      for (const modelName of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          result = await model.generateContent([prompt, ...imageParts]);
          break; // Si funciona, salir del bucle
        } catch (e) {
          lastError = e;
          const msg = e.message ? e.message.toLowerCase() : "";
          if (msg.includes("is not found") || msg.includes("503") || msg.includes("high demand") || msg.includes("429")) {
            console.warn(`Modelo ${modelName} no disponible o saturado, intentando con el siguiente...`);
            continue; // Intentar con el siguiente modelo en la lista
          }
          throw e; // Si es otro error grave, lanzar inmediatamente
        }
      }

      if (!result) {
        throw lastError;
      }

      const responseText = result.response.text();
      
      let cleanJson = responseText.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\s*/, '');
      }
      if (cleanJson.endsWith('```')) {
        cleanJson = cleanJson.replace(/\s*```$/, '');
      }

      const parsedItems = JSON.parse(cleanJson);
      
      const newItems = parsedItems.map(item => ({
        cantidad: item.cantidad?.toString() || '1',
        descripcion: item.descripcion || '',
        marca: item.marca || '',
        serie: item.serie || '',
        estado: 'Bueno',
        inventario: item.inventario || ''
      }));

      setExtractedData(newItems);
    } catch (error) {
      console.error("Gemini Error:", error);
      alert("Error al extraer con IA: " + (error.message || "Revisa tu API Key o conexión a internet."));
    } finally {
      setIsProcessing(false);
    }
  };

  const updateItem = (index, field, value) => {
    const updated = [...extractedData];
    updated[index][field] = value;
    setExtractedData(updated);
  };

  const removeItem = (index) => {
    const updated = extractedData.filter((_, i) => i !== index);
    setExtractedData(updated);
  };

  const handleSave = async () => {
    if (extractedData.length === 0) return alert("No hay artículos para guardar.");
    
    setIsSaving(true);
    try {
      const promises = extractedData.map((item, idx) => {
        return addDoc(collection(db, 'inventario'), {
          codigo: item.inventario || `INV-OCR-${Date.now().toString().slice(-4)}${idx}`,
          articulo: `${item.descripcion || ''} ${item.marca || ''}`.trim(),
          ubicacion: 'Bodega Contraloría',
          cantidad: Number(item.cantidad) || 1,
          estado: item.estado || 'Bueno',
          serie: item.serie || '',
          fechaIngreso: new Date().toISOString()
        });
      });
      await Promise.all(promises);
      
      alert(`¡${extractedData.length} bienes guardados exitosamente!`);
      if (onSaveSuccess) onSaveSuccess();
      onClose();
    } catch (error) {
      console.error("Error guardando bienes:", error);
      alert("Hubo un error al guardar en la base de datos.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full my-8 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="font-bold text-slate-800 flex items-center">
            <RefreshCw className="w-5 h-5 mr-2 text-indigo-600" />
            Escáner Avanzado de Inventario (Gemini AI)
          </h3>
          <div className="flex items-center gap-4">
            {!showApiKeyPrompt && apiKey && (
              <button onClick={clearApiKey} className="text-xs text-slate-500 hover:text-red-600 underline">
                Cambiar API Key
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          {/* API Key Configurator */}
          {showApiKeyPrompt && (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Configuración por primera vez</h3>
              <p className="text-slate-600 mb-6">
                Para usar el escáner avanzado y garantizar precisión del 100% en las tablas, usamos la Inteligencia Artificial en la nube de Google. Necesitas una Llave de Acceso gratuita.
              </p>
              
              <div className="bg-slate-50 p-4 rounded-lg mb-6 text-sm border border-slate-200">
                <p className="font-semibold text-slate-700 mb-2">Pasos para obtener tu llave en 1 minuto:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600">
                  <li>Inicia sesión con tu cuenta de Google.</li>
                  <li>Ve a Google AI Studio: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline inline-flex items-center">aistudio.google.com <ExternalLink className="w-3 h-3 ml-1" /></a></li>
                  <li>Haz clic en el botón azul "Create API key".</li>
                  <li>Copia la llave generada (una cadena larga de letras y números).</li>
                </ol>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">Pega tu API Key aquí:</label>
                <input 
                  type="password" 
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="AIzaSy..."
                  value={tempKey}
                  onChange={e => setTempKey(e.target.value)}
                />
                <button 
                  onClick={saveApiKey}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                >
                  Guardar y Continuar
                </button>
              </div>
            </div>
          )}

          {!showApiKeyPrompt && !image && !isProcessing && extractedData.length === 0 && (
            <div 
              className="border-2 border-dashed border-indigo-200 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-white cursor-pointer hover:bg-indigo-50 transition-colors group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-indigo-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-700 mb-2">Sube tu Resguardo o Nota de Salida</h4>
              <p className="text-sm text-slate-500 max-w-md">
                Soporta archivos <strong>PDF, JPG, PNG</strong>. El cerebro de Gemini extraerá automáticamente las tablas.
              </p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*,application/pdf" 
                className="hidden" 
              />
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="mt-6 px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold shadow hover:bg-indigo-700 transition-colors"
              >
                Escanear Documento
              </button>
            </div>
          )}

          {isProcessing && (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-indigo-600 animate-pulse" />
                </div>
              </div>
              <h4 className="text-xl font-bold text-slate-800 mt-6 mb-2">Inteligencia Artificial Leyendo...</h4>
              <p className="text-slate-500">Analizando columnas, descripciones y números de serie.</p>
            </div>
          )}

          {extractedData.length > 0 && !isProcessing && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-emerald-50 text-emerald-800 p-4 rounded-lg border border-emerald-200">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold">Extracción Exitosa</h4>
                    <p className="text-sm opacity-90">Por favor, verifica rápidamente que los números de inventario y descripciones estén correctos antes de mandarlos a la base de datos.</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setImage(null); setExtractedData([]); }}
                  className="text-sm font-medium bg-white px-3 py-1.5 rounded border border-emerald-200 hover:bg-emerald-100 flex-shrink-0 ml-4"
                >
                  Escanear otro archivo
                </button>
              </div>

              <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase w-16">Cant.</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase w-32">Clave / Inv</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Descripción</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase w-28">Marca</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase w-32">Serie</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase w-16">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {extractedData.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-2 py-2">
                            <input 
                              type="number" min="1" 
                              className="w-full p-2 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 bg-white" 
                              value={item.cantidad} onChange={e => updateItem(i, 'cantidad', e.target.value)}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input 
                              type="text" 
                              className="w-full p-2 text-sm font-medium border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 bg-white" 
                              value={item.inventario} onChange={e => updateItem(i, 'inventario', e.target.value)}
                              placeholder="Ej. 12345"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <textarea 
                              rows="1"
                              className="w-full p-2 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 bg-white resize-y min-h-[38px]" 
                              value={item.descripcion} onChange={e => updateItem(i, 'descripcion', e.target.value)}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input 
                              type="text" 
                              className="w-full p-2 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 bg-white" 
                              value={item.marca} onChange={e => updateItem(i, 'marca', e.target.value)}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input 
                              type="text" 
                              className="w-full p-2 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 bg-white font-mono" 
                              value={item.serie} onChange={e => updateItem(i, 'serie', e.target.value)}
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button onClick={() => removeItem(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 bg-slate-50 border-t flex justify-center">
                  <button 
                    onClick={() => setExtractedData([...extractedData, { cantidad: '1', descripcion: '', marca: '', serie: '', estado: 'Bueno', inventario: '' }])}
                    className="flex items-center px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Añadir Fila Manual
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {extractedData.length > 0 && !isProcessing && (
          <div className="px-6 py-4 border-t border-slate-200 bg-white rounded-b-xl flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
            <button 
              onClick={onClose}
              className="px-6 py-2 border rounded-lg font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave} disabled={isSaving}
              className="px-8 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow-sm hover:bg-emerald-700 transition-colors flex items-center disabled:opacity-50"
            >
              <Save className="w-5 h-5 mr-2" />
              {isSaving ? 'Guardando...' : `Guardar ${extractedData.length} Artículos`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
