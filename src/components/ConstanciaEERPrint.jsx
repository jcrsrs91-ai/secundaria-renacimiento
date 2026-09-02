import React from 'react';
import { useGlobalConfig } from '../hooks/useGlobalConfig';

const numeroALetras = (num) => {
  const palabras = {
    1: 'UNA', 2: 'DOS', 3: 'TRES', 4: 'CUATRO', 5: 'CINCO',
    6: 'SEIS', 7: 'SIETE', 8: 'OCHO', 9: 'NUEVE', 10: 'DIEZ',
    11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE', 15: 'QUINCE',
    16: 'DIECISÉIS', 17: 'DIECISIETE', 18: 'DIECIOCHO', 19: 'DIECINUEVE', 20: 'VEINTE'
  };
  return palabras[parseInt(num, 10)] || num;
};

const diaALetras = (dia) => {
  const palabras = {
    1: 'UNO', 2: 'DOS', 3: 'TRES', 4: 'CUATRO', 5: 'CINCO',
    6: 'SEIS', 7: 'SIETE', 8: 'OCHO', 9: 'NUEVE', 10: 'DIEZ',
    11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE', 15: 'QUINCE',
    16: 'DIECISÉIS', 17: 'DIECISIETE', 18: 'DIECIOCHO', 19: 'DIECINUEVE', 20: 'VEINTE',
    21: 'VEINTIUNO', 22: 'VEINTIDÓS', 23: 'VEINTITRÉS', 24: 'VEINTICUATRO', 25: 'VEINTICINCO',
    26: 'VEINTISÉIS', 27: 'VEINTISIETE', 28: 'VEINTIOCHO', 29: 'VEINTINUEVE', 30: 'TREINTA',
    31: 'TREINTA Y UNO'
  };
  return palabras[parseInt(dia, 10)] || dia;
};

const mesALetras = (mes) => {
  const meses = [
    '', 'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];
  return meses[parseInt(mes, 10)] || mes;
};

const promedioALetras = (promedioNum) => {
  if (!promedioNum) return '';
  const num = parseFloat(promedioNum);
  if (isNaN(num)) return '';

  const enteros = Math.floor(num);
  const decimal = Math.round((num - enteros) * 10);

  const numWords = {
    5: 'CINCO',
    6: 'SEIS',
    7: 'SIETE',
    8: 'OCHO',
    9: 'NUEVE',
    10: 'DIEZ'
  };

  const decWords = {
    0: 'CERO',
    1: 'UNO',
    2: 'DOS',
    3: 'TRES',
    4: 'CUATRO',
    5: 'CINCO',
    6: 'SEIS',
    7: 'SIETE',
    8: 'OCHO',
    9: 'NUEVE'
  };

  let texto = numWords[enteros] || '';
  if (enteros !== 10) {
    texto += ' PUNTO ' + (decWords[decimal] || 'CERO');
  } else if (enteros === 10 && decimal === 0) {
    texto = 'DIEZ PUNTO CERO';
  }
  return texto;
};

const convertGradoToRoman = (gradoStr) => {
  if (!gradoStr) return '';
  if (gradoStr.includes('1') || gradoStr.toLowerCase().includes('primer')) return 'I';
  if (gradoStr.includes('2') || gradoStr.toLowerCase().includes('segund')) return 'II';
  if (gradoStr.includes('3') || gradoStr.toLowerCase().includes('tercer')) return 'III';
  return '';
};

const formatFecha = (fechaStr) => {
  if (!fechaStr) return '';
  const parts = fechaStr.split('-');
  if (parts.length === 3) {
    // Check if format is YYYY-MM-DD
    if (parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0].substring(2)}`;
    }
  }
  return fechaStr;
};

export default function ConstanciaEERPrint({ student, regularizadas = [], adeudos = [] }) {
  const { config } = useGlobalConfig();
  
  const today = new Date();
  const dia = diaALetras(today.getDate());
  const mes = mesALetras(today.getMonth() + 1);
  const anio = today.getFullYear() === 2025 ? 'DOS MIL VEINTICINCO' : 
               today.getFullYear() === 2026 ? 'DOS MIL VEINTISÉIS' : 
               today.getFullYear() === 2027 ? 'DOS MIL VEINTISIETE' : `DOS MIL VEINTIOCHO`;

  const totalAcreditadas = regularizadas.length;
  const totalNoAcreditadas = adeudos.length;
  
  const strAcreditadas = totalAcreditadas > 0 ? numeroALetras(totalAcreditadas) : '- - -';
  const strNoAcreditadas = totalNoAcreditadas > 0 ? numeroALetras(totalNoAcreditadas) : '- - -';

  // Fill up to 6 rows in the table
  const rows = [...regularizadas];
  while (rows.length < 6) {
    rows.push({ isEmpty: true });
  }

  return (
    <div className="bg-white text-black font-sans relative" style={{ width: '21.59cm', minHeight: '27.94cm', padding: '0.5cm 1.5cm' }}>
      <style>{`
        @media print {
          @page { size: letter portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-content { transform: scale(0.85); transform-origin: top center; }
        }
      `}</style>

      <div className="print-content">
        {/* Encabezado */}
        <div className="flex justify-between items-start mb-2">
          <div className="w-1/4">
            <img src="/transformando_guerrero.png" alt="Gobierno del Estado" className="w-48 object-contain" />
          </div>
          <div className="w-2/4 text-center">
            <h1 className="font-bold text-lg mb-1">SISTEMA EDUCATIVO NACIONAL</h1>
            <h2 className="font-bold text-lg mb-1 tracking-wide">CONSTANCIA DE EXÁMEN DE REGULARIZACIÓN</h2>
            <h3 className="font-bold text-base">SECRETARÍA DE EDUCACIÓN GUERRERO</h3>
          </div>
          <div className="w-1/4"></div>
        </div>

        {/* Tipos de Secundaria */}
        <div className="flex justify-between items-center text-xs font-bold mb-4 px-2">
          <div className="flex items-center gap-2">
            <span>SECUNDARIA GENERAL</span>
            <div className="w-4 h-4 border border-black rounded-full"></div>
          </div>
          <div className="flex items-center gap-2">
            <span>SECUNDARIA TÉCNICA</span>
            <div className="w-4 h-4 border border-black rounded-full flex items-center justify-center relative">
               <span className="absolute text-[18px] top-[-6px] left-[1px]">×</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span>TELESECUNDARIA</span>
            <div className="w-4 h-4 border border-black rounded-full"></div>
          </div>
        </div>

        <div className="text-[11px] mb-1">LA DIRECCIÓN DE LA ESCUELA</div>
        
        <div className="w-full border-2 border-black flex mb-4">
          <div className="w-2/3 border-r-2 border-black">
            <div className="text-[9px] px-1 border-b border-black">NOMBRE OFICIAL DE LA ESCUELA SEGÚN CATÁLOGOS DE CENTRO DE TRABAJO</div>
            <div className="text-center font-bold text-base py-1 uppercase">{config?.schoolName || 'RENACIMIENTO'}</div>
          </div>
          <div className="w-1/3">
            <div className="text-[9px] px-1 border-b border-black">CLAVE SEGÚN CCT</div>
            <div className="text-center font-bold text-base py-1">{config?.cct || '12DST0077B'}</div>
          </div>
        </div>

        <div className="text-[11px] mb-1 uppercase">
          HACE CONSTAR, SEGÚN ANTECEDENTES QUE OBRAN EN EL ARCHIVO DE ESTE PLANTEL, QUE:
        </div>

        <div className="w-full border-2 border-black flex mb-4">
          <div className="w-2/3 border-r-2 border-black">
            <div className="flex justify-between px-2 text-[9px] border-b border-black">
              <span>NOMBRES (S)</span>
              <span>PRIMER APELLIDO</span>
              <span>SEGUNDO APELLIDO</span>
            </div>
            <div className="text-center font-bold text-base py-1 uppercase">
              {student.nombres} {student.apellidoPaterno} {student.apellidoMaterno}
            </div>
          </div>
          <div className="w-1/3">
            <div className="text-[9px] px-1 border-b border-black text-center">CLAVE ÚNICA DE REGISTRO DE POBLACIÓN (CURP)</div>
            <div className="text-center font-bold text-base py-1 uppercase">{student.curp}</div>
          </div>
        </div>

        <div className="text-[11px] mb-2 uppercase leading-tight">
          SUSTENTÓ <span className="underline">EXÁMENES EXTRAORDINARIOS DE REGULARIZACIÓN</span> EN LA ÁREAS Y/O ASIGNATURAS CON LAS CALIFICACIONES QUE A CONTINUACIÓN SE EXPRESAN:
        </div>

        {/* Tabla */}
        <table className="w-full border-2 border-black text-[11px] mb-4 text-center font-bold">
          <thead>
            <tr>
              <th className="border-b-2 border-r-2 border-black p-2 w-[35%] uppercase" rowSpan={2}>ÁREA Y/O ASIGNATURA</th>
              <th className="border-b-2 border-r-2 border-black p-1 w-[5%]" rowSpan={2}>
                <div>G</div>
                <div>R</div>
                <div>A</div>
                <div>D</div>
                <div>O*</div>
              </th>
              <th className="border-b-2 border-r-2 border-black p-1 uppercase tracking-widest" colSpan={2}>C A L I F I C A C I Ó N</th>
              <th className="border-b-2 border-r-2 border-black p-1 w-[12%]" rowSpan={2}>FECHA<br/>DEL<br/>EXAMEN</th>
              <th className="border-b-2 border-black p-2 w-[18%] uppercase" rowSpan={2}>OBSERVACIONES</th>
            </tr>
            <tr>
              <th className="border-b-2 border-r-2 border-black p-1 w-[10%]">NUMERO</th>
              <th className="border-b-2 border-r-2 border-black p-1">LETRA</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="h-5">
                <td className="border-b border-r-2 border-black text-left px-2 uppercase">{row.isEmpty ? '' : row.name}</td>
                <td className="border-b border-r-2 border-black uppercase">{row.isEmpty ? '' : convertGradoToRoman(student.grado)}</td>
                <td className="border-b border-r-2 border-black text-sm">{row.isEmpty ? '' : parseFloat(row.finalGrade).toFixed(1)}</td>
                <td className="border-b border-r-2 border-black uppercase">{row.isEmpty ? '' : promedioALetras(row.finalGrade)}</td>
                <td className="border-b border-r-2 border-black">{row.isEmpty ? '' : formatFecha(row.fecha)}</td>
                <td className="border-b border-black"></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Texto de cierre */}
        <div className="text-[11px] leading-tight text-justify mb-4">
          EN CUMPLIMIENTO DE LAS DISPOSICIONES VIGENTES, ESTA CONSTANCIA AMPARA <span className="border-b border-black px-4">{strAcreditadas}</span> ÁREAS
          Y/O ASIGNATURAS ACREDITADAS Y <span className="border-b border-black px-4">{strNoAcreditadas}</span> ÁREAS Y/O ASIGNATURAS NO ACREDITADAS DE
          EDUCACIÓN SECUNDARIA Y SE EXPIDE EN <span className="border-b border-black px-2 uppercase">{config?.city || 'ACAPULCO DE JUÁREZ, GUERRERO'}</span> A LOS <span className="border-b border-black px-2 uppercase">{dia}</span> DIAS DEL MES DE <span className="border-b border-black px-2 uppercase">{mes}</span> DEL
          <span className="border-b border-black px-2 uppercase">{anio}</span>.
        </div>

        {/* Firmas */}
        <div className="flex justify-between text-center text-[10px] mb-4 font-bold mt-8">
          <div className="w-[45%]">
            <div className="mb-10">EL DIRECTOR DE LA ESCUELA</div>
            <div className="border-t border-black pt-1 px-4">{config?.directorName || 'Profr. Juan Carlos Taboada Barajas'}</div>
            <div className="font-normal">NOMBRE, FIRMA Y SELLO</div>
          </div>
          <div className="w-[45%]">
            <div className="mb-10">Vo. Bo.<br/>JEFE(A) DE CONTROL ESCOLAR</div>
            <div className="border-t border-black pt-1 px-4 uppercase">{config?.controlEscolar || 'Profr. Bernardo Hernández Gómez'}</div>
            <div className="font-normal">NOMBRE, FIRMA Y SELLO</div>
          </div>
        </div>

        {/* Notas */}
        <div className="border-t-2 border-black pt-2 text-[8px] font-bold pb-4">
          <div className="text-center tracking-widest text-[10px] mb-2">N O T A S :</div>
          <div className="flex">
            <div className="w-1/2 pr-4 space-y-2">
              <div className="flex"><span className="w-4">1.</span><p>*ANOTE CON NÚMEROS ROMANOS EL GRADO AL QUE CORRESPONDE EL ÁREA Y/O ASIGNATURA QUE PRESENTÓ.</p></div>
              <div className="flex"><span className="w-4">2.</span><p>LA ESCALA OFICIAL DE CALIFICACIONES ES NUMÉRICA DEL 5 AL 10.</p></div>
              <div className="flex"><span className="w-4">3.</span><p>LA CALIFICACIÓN DE CADA ÁREA Y/O ASIGNATURA SE DEBE REGISTRAR CON UN NÚMERO ENTERO Y UNA CIFRA DECIMAL.</p></div>
              <div className="flex"><span className="w-4">4.</span><p>EL ALUMNO APRUEBA UN ÁREA Y/O ASIGNATURA CUANDO OBTIENE UNA CALIFICACIÓN MAYOR O IGUAL A 6.0</p></div>
            </div>
            <div className="w-1/2 pl-4 space-y-2">
              <div className="flex"><span className="w-4">5.</span><p>ESTA CONSTANCIA SE EXPIDE PARA EL PLAN DE ESTUDIOS POR ASIGNATURAS VIGENTE Y PLAN 1975.</p></div>
              <div className="flex"><span className="w-4">6.</span><p>EL ORIGINAL DE ESTE DOCUMENTO ES PARA EL INTERESADO Y LA COPIA PARA EL PLANTEL.</p></div>
              <div className="flex"><span className="w-4">7.</span><p>ESTE DOCUMENTO NO ES VÁLIDO SI PRESENTA BORRADURAS O ENMENDADURAS.</p></div>
              <div className="flex"><span className="w-4">8.</span><p>ESTA CONSTANCIA DEBE SER LEGALIZADA POR EL ÁREA DE ADMINISTRACIÓN ESCOLAR PARA LOS ALUMNOS QUE SE TRASLADAN DE UNA ENTIDAD A OTRA O DE UN SUBSISTEMA A OTRO.</p></div>
            </div>
          </div>
        </div>
        <div className="text-[8px] mt-1">FC5083</div>

      </div>
    </div>
  );
}