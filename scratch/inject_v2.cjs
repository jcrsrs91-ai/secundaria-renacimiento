const fs = require('fs');
let c = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

// 1. ADD useMemos FOR V2, V5, V6, V7
const v1HookRegex = /(const calculosV1 = useMemo\(\(\) => \{[\s\S]*?\}, \[activos\]\);)/;

const vOthersHooks = `
  const calculosV2 = useMemo(() => {
    let h = 0, m = 0;
    activos.forEach(a => {
      if (a.lenguaIndigena === 'SÍ' || a.lenguaIndigena === 'SÃ ') {
        if (a.genero === 'Hombre') h++; else m++;
      }
    });
    return { h, m, t: h + m };
  }, [activos]);

  const calculosV5 = useMemo(() => {
    let h = 0, m = 0;
    activos.forEach(a => {
      if (a.usaer === 'SÍ' || a.usaer === 'SÃ ') {
        if (a.genero === 'Hombre') h++; else m++;
      }
    });
    return { h, m, t: h + m };
  }, [activos]);

  const calculosV7 = useMemo(() => {
    let h = 0, m = 0;
    activos.forEach(a => {
      if (a.nacionalidad === 'EXTRANJERA') {
        if (a.genero === 'Hombre') h++; else m++;
      }
    });
    return { h, m, t: h + m };
  }, [activos]);

  const calculosV6 = useMemo(() => {
    const keys = [
      'Ceguera', 'Baja visión', 'Sordera', 'Hipoacusia', 'Sordoceguera',
      'Discapacidad motriz', 'Discapacidad intelectual', 'Discapacidad psicosocial',
      'Trastorno del espectro autista', 'Discapacidad múltiple', 'TDAH*',
      'Aptitudes sobresalientes', 'Otras condiciones'
    ];
    const map = {};
    keys.forEach(k => {
      map[k] = { '1': { h: 0, m: 0 }, '2': { h: 0, m: 0 }, '3': { h: 0, m: 0 } };
    });

    activos.forEach(a => {
      let d = a.discapacidad;
      if (!d || d === 'Ninguna' || d === 'NO') return;
      
      let k = null;
      if (d === 'Ceguera') k = 'Ceguera';
      if (d.includes('Baja')) k = 'Baja visión';
      if (d === 'Sordera') k = 'Sordera';
      if (d === 'Hipoacusia') k = 'Hipoacusia';
      if (d === 'Sordoceguera') k = 'Sordoceguera';
      if (d === 'Discapacidad motriz') k = 'Discapacidad motriz';
      if (d === 'Discapacidad intelectual' || d === 'SÍ' || d === 'SÃ ') k = 'Discapacidad intelectual';
      if (d === 'Discapacidad psicosocial') k = 'Discapacidad psicosocial';
      if (d.includes('TEA') || d.includes('Autista')) k = 'Trastorno del espectro autista';
      if (d.includes('TDAH') || d.includes('Déficit')) k = 'TDAH*';
      if (d.includes('Aptitudes')) k = 'Aptitudes sobresalientes';
      if (d.includes('múltiple') || d.includes('mÃºltiple') || d.includes('mǧltiple')) k = 'Discapacidad múltiple';

      if (!k) k = 'Otras condiciones';

      let g = '1';
      if (a.grado?.includes('2do') || a.grado === '2') g = '2';
      if (a.grado?.includes('3er') || a.grado?.includes('3ro') || a.grado === '3ero' || a.grado === '3') g = '3';

      if (a.genero === 'Hombre') map[k][g].h++;
      else map[k][g].m++;
    });

    return { map, keys };
  }, [activos]);
`;

c = c.replace(v1HookRegex, "$1\n" + vOthersHooks);

// 2. INJECT TABLE V2 (Pregunta 2)
const p2TargetRegex = /(<p className="text-sm font-semibold mb-2">2\. Escriba por sexo, la cantidad de alumnas y alumnos indígenas o hablantes de lengua indígena\.<\/p>\s*<table[\s\S]*?<tbody>)[\s\S]*?(<\/tbody>\s*<\/table>)/;

const p2TableBody = `
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold">{calculosV2.h}</td>
                    <td className="border border-slate-300 p-2 font-bold">{calculosV2.m}</td>
                    <td className="border border-slate-300 p-2 bg-slate-100 font-bold">{calculosV2.t}</td>
                  </tr>
`;
c = c.replace(p2TargetRegex, "$1\n" + p2TableBody + "$2");

// 3. INJECT TABLE V5 (Pregunta 5)
const p5TargetRegex = /(<p className="text-sm font-semibold mb-2">5\. Escriba la cantidad de alumnas y alumnos que son atendidos por la Unidad de Servicios de Apoyo a la Educación Regular \(USAER\), desglosándola por sexo\.<\/p>\s*<table[\s\S]*?<tbody>)[\s\S]*?(<\/tbody>\s*<\/table>)/;

const p5TableBody = `
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold">{calculosV5.h}</td>
                    <td className="border border-slate-300 p-2 font-bold">{calculosV5.m}</td>
                    <td className="border border-slate-300 p-2 bg-slate-100 font-bold">{calculosV5.t}</td>
                  </tr>
`;
c = c.replace(p5TargetRegex, "$1\n" + p5TableBody + "$2");


// 4. INJECT TABLE V7 (Pregunta 7)
const p7TargetRegex = /(<p className="text-sm font-semibold mb-2">7\. Escriba el níºmero de alumnas y alumnos nacidos fuera de México, desglosándolos por sexo\.<\/p>\s*<table[\s\S]*?<tbody>)[\s\S]*?(<\/tbody>\s*<\/table>)/;

const p7TableBody = `
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold">{calculosV7.h}</td>
                    <td className="border border-slate-300 p-2 font-bold">{calculosV7.m}</td>
                    <td className="border border-slate-300 p-2 bg-slate-100 font-bold">{calculosV7.t}</td>
                  </tr>
`;
c = c.replace(p7TargetRegex, "$1\n" + p7TableBody + "$2");

fs.writeFileSync('src/components/Formato911.jsx', c, 'utf8');
