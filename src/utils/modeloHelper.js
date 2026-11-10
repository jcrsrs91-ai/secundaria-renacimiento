// Utilidad para resolver, sincronizar e inferir automáticamente el MODELO de cada artículo
// en Actas de Resguardo, Actas de Recepción, Cédula Censal e Inventario General.

const FORBIDDEN_AUTOFILL_GARBAGE = new Set([
  'ACAPULCO',
  'ACAPULCO DE JUAREZ',
  'ACAPULCO DE JUÁREZ',
  'CD. RENACIMIENTO',
  'CIUDAD RENACIMIENTO',
  'RENACIMIENTO',
  'GUERRERO',
  '39715'
]);

/**
 * Limpia únicamente valores que sean claramente basura de autocompletado de dirección/correo del navegador,
 * pero conserva cualquier modelo real, medida, código o especificación.
 */
export function limpiarModeloExplicito(rawModelo, parentDoc = {}) {
  const str = String(rawModelo || '').trim();
  if (!str) return '';
  const upper = str.toUpperCase();

  if ( ['NULL', 'UNDEFINED', '-', '--'].includes(upper) ) {
    return '';
  }
  if (FORBIDDEN_AUTOFILL_GARBAGE.has(upper)) return '';
  if (upper.includes('@')) return '';

  const nombreResp = String(parentDoc?.nombreResguardante || parentDoc?.resguardante || '').trim().toUpperCase();
  const areaResp = String(parentDoc?.areaResguardante || parentDoc?.area || parentDoc?.cargo || '').trim().toUpperCase();
  if (nombreResp && upper === nombreResp) return '';
  if (areaResp && upper === areaResp) return '';

  return str;
}

/**
 * Extrae o infiere automáticamente el modelo / medida / especificación técnica a partir
 * del concepto/descripción, marca o código del artículo cuando el campo modelo está vacío.
 */
export function inferirModeloAutomatico(art = {}, parentDoc = {}) {
  const explicito = limpiarModeloExplicito(art?.modelo, parentDoc);
  if (explicito && !['S/M', 'SIN MODELO', 'N/A', 'NA'].includes(explicito.toUpperCase())) {
    return explicito;
  }

  const rawDesc = String(art?.descripcion || art?.articulo || '').trim();
  const desc = rawDesc.toUpperCase().replace(/\s+/g, ' ');
  const marca = String(art?.marca || '').trim().toUpperCase();

  if (!desc) {
    return explicito || 'ESTÁNDAR';
  }

  // 1. Si la descripción incluye explícitamente "MOD. XXX" o "MODELO XXX"
  const explicitModMatch = desc.match(/\b(?:MOD(?:ELO)?\.?\s*[:#-]?\s*)([A-Z0-9./"-]+(?:\s+[A-Z0-9./"-]+)?)/i);
  if (explicitModMatch && explicitModMatch[1]) {
    return explicitModMatch[1].trim().toUpperCase();
  }

  // 2. Casos específicos de herramientas de taller (Mecánica Automotriz, Electricidad, etc.)
  // 2a. Gato hidráulico / Soporte para gato (ej. "GATO HIDRAULICO DE PATIN 3T", "SOPORTE PARA GATO 3T")
  if (desc.includes('GATO')) {
    const tonMatch = desc.match(/\b(\d+(?:\.\d+)?)\s*(?:TON(?:ELADAS?)?|T)\b/i);
    if (desc.includes('PATIN') || desc.includes('PATÍN')) {
      return tonMatch ? `PATÍN ${tonMatch[1]}T` : 'PATÍN';
    }
    if (desc.includes('BOTELLA')) {
      return tonMatch ? `BOTELLA ${tonMatch[1]}T` : 'BOTELLA';
    }
    if (tonMatch) {
      return `${tonMatch[1]} TON (${tonMatch[1]}T)`;
    }
  }

  // 2b. Dado hexagonal / Dado de impacto / Dado (ej. "DADO HEXAGONAL 14MM", "DADO HEXAGONAL 8MM")
  if (desc.includes('DADO')) {
    const medMatch = desc.match(/\b(\d+\s*\/\s*\d+\s*"?|\d+(?:\.\d+)?\s*(?:MM|PULG|"))\b/i);
    if (medMatch) {
      const med = medMatch[1].replace(/\s+/g, '').toUpperCase();
      const medFormatted = /^\d+\/\d+$/.test(med) ? `${med}"` : med;
      if (desc.includes('HEXAGONAL') || desc.includes('HEX')) {
        return `HEX ${medFormatted}`;
      }
      if (desc.includes('IMPACTO')) {
        return `IMP ${medFormatted}`;
      }
      return medFormatted;
    }
  }

  // 2c. Juego de puntas / llaves / dados (ej. "JUEGO DE PUNTAS T Y 30 MM MIKELS")
  if (desc.includes('JUEGO DE PUNTAS')) {
    const tMatch = desc.match(/\bT\s*(?:Y\s*)?(\d+\s*MM)\b/i);
    if (tMatch) {
      return `T-${tMatch[1].replace(/\s+/g, '').toUpperCase()}`;
    }
  }

  // 2d. Desarmadores (ej. 'DESARMADOR PH 1/4"', 'DESARMADOR PLANO 3/16 X 4')
  if (desc.includes('DESARMADOR')) {
    const phMatch = desc.match(/\b(PH(?:ILLIPS)?\s*[#0-9/\s."xX*-]+)/i);
    if (phMatch) {
      let val = phMatch[1].trim().toUpperCase();
      if (marca && val.endsWith(marca)) val = val.slice(0, -marca.length).trim();
      if (/\/\d+$/.test(val)) val += '"';
      return val;
    }
    const planoMatch = desc.match(/\b(PLANO\s*[#0-9/\s."xX*-]+)/i);
    if (planoMatch) {
      let val = planoMatch[1].trim().toUpperCase();
      if (marca && val.endsWith(marca)) val = val.slice(0, -marca.length).trim();
      if (/\/\d+$/.test(val)) val += '"';
      return val;
    }
  }

  // 2e. Llaves mixtas / españolas / allen / perico / estilson (ej. "LLAVE MIXTA 13MM", "LLAVE MIXTA 3/8")
  if (desc.includes('LLAVE')) {
    const fracMatch = desc.match(/\b(\d+\s*\/\s*\d+)\s*("?)/);
    if (fracMatch) {
      return `${fracMatch[1].replace(/\s+/g, '')}"`;
    }
    const mmMatch = desc.match(/\b(\d+(?:\.\d+)?\s*(?:MM|PULG|"))\b/i);
    if (mmMatch) {
      return mmMatch[1].replace(/\s+/g, '').toUpperCase();
    }
  }

  // 2f. Mazos / Martillos (ej. "MAZO DE HULE 16 OZ")
  if (desc.includes('MAZO') || desc.includes('MARTILLO')) {
    const ozMatch = desc.match(/\b(\d+(?:\.\d+)?\s*(?:OZ|ONZAS?|LBS?|KG))\b/i);
    if (ozMatch) {
      return ozMatch[1].trim().toUpperCase();
    }
  }

  // 3. Medidas compuestas o generales en la descripción (pulgadas, mm, cm, oz, toneladas, litros, watts, gavetas, etc.)
  // Fracciones de pulgada o medidas con X (ej. 1/4" X 4", 120X60CM)
  const dimMatch = desc.match(/\b(\d+(?:\/\d+)?\s*["']?\s*[X*]\s*\d+(?:\/\d+)?\s*(?:MM|CM|M|MTS|PULG|")?)\b/i);
  if (dimMatch) {
    return dimMatch[1].trim().toUpperCase();
  }

  // Medidas en MM, CM, PULG, OZ, TON, LTS, WATTS, HP, BTU
  const unitMatch = desc.match(/\b(\d+\s*\/\s*\d+\s*"?|\d+(?:\.\d+)?\s*(?:MM|CM|MTS?|PULG(?:ADAS)?|OZ|ONZAS?|TON(?:ELADAS)?|T|LTS?|LITROS?|WATTS?|W|HP|BTU|VOLTS?|V|AMP))\b/i);
  if (unitMatch) {
    const rawUnit = unitMatch[1].trim().toUpperCase();
    if (/^\d+\s*\/\s*\d+$/.test(rawUnit)) {
      return `${rawUnit.replace(/\s+/g, '')}"`;
    }
    return rawUnit;
  }

  // Número de gavetas, puertas, piezas o niveles (ej. "ARCHIVERO 4 GAVETAS", "JUEGO DE 12 PIEZAS")
  const countSpecMatch = desc.match(/\b(\d+\s*(?:GAVETAS?|PUERTAS?|ENTREPAÑOS?|NIVELES|PIEZAS|PZAS?))\b/i);
  if (countSpecMatch) {
    return countSpecMatch[1].trim().toUpperCase();
  }

  // Procesadores o especificaciones de cómputo comunes
  const cpuMatch = desc.match(/\b(CORE\s*I[3579](?:-[0-9A-Z]+)?|RYZEN\s*[3579]|CELERON|PENTIUM|ALL\s*IN\s*ONE)\b/i);
  if (cpuMatch) {
    return cpuMatch[1].trim().toUpperCase();
  }

  // Códigos alfanuméricos de modelo dentro de la descripción (ej. "L3250", "VPL-EX455", "M110", "G3110", "HP-240")
  const words = desc.split(/\s+/);
  const stopWords = new Set(['DE', 'DEL', 'LA', 'LAS', 'EL', 'LOS', 'CON', 'PARA', 'POR', 'EN', 'SIN', 'Y', 'O', marca]);
  for (let i = words.length - 1; i >= 1; i--) {
    const w = words[i].replace(/^[(["']+|[\])".,;:'"]+$/g, '');
    if (!w || stopWords.has(w)) continue;
    // Tiene letras y números mezclados (mínimo 2 caracteres) y no es solo un número de lote largo
    if (/[A-Z]/.test(w) && /\d/.test(w) && w.length >= 2 && w.length <= 14) {
      return w;
    }
  }

  // 4. Subtipos descriptivos de mobiliario/equipo escolar
  if (desc.includes('PALETA')) return 'PALETA';
  if (desc.includes('BINARIA') || desc.includes('BINARIO')) return 'BINARIA';
  if (desc.includes('SECRETARIAL')) return 'SECRETARIAL';
  if (desc.includes('EJECUTIVO') || desc.includes('EJECUTIVA')) return 'EJECUTIVO';
  if (desc.includes('PEDESTAL')) return 'PEDESTAL';
  if (desc.includes('TECHO')) return 'TECHO';
  if (desc.includes('PARED')) return 'PARED';
  if (desc.includes('MINISPLIT')) return 'MINISPLIT';
  if (desc.includes('PORTATIL') || desc.includes('PORTÁTIL')) return 'PORTÁTIL';
  if (desc.includes('ESCRITORIO') && desc.includes('COMPUTADORA')) return 'ESCRITORIO PC';
  if (desc.includes('DIGITAL')) return 'DIGITAL';
  if (desc.includes('HIDRAULICO') || desc.includes('HIDRÁULICO')) return 'HIDRÁULICO';
  if (desc.includes('NEUMATICO') || desc.includes('NEUMÁTICO')) return 'NEUMÁTICO';
  if (desc.includes('METALICO') || desc.includes('METÁLICO') || desc.includes('METALICA')) return 'METÁLICO';
  if (desc.includes('MADERA')) return 'MADERA';
  if (desc.includes('PLASTICO') || desc.includes('PLÁSTICO')) return 'PLÁSTICO';
  if (desc.includes('ACRILICO') || desc.includes('ACRÍLICO')) return 'ACRÍLICO';

  return explicito || 'ESTÁNDAR';
}

/**
 * Busca primero si el artículo tiene modelo propio, luego busca en el catálogo de inventario general
 * (por id, código o descripción+serie), y si sigue vacío lo infiere automáticamente.
 */
export function resolverModeloArticulo(art = {}, inventario = [], parentDoc = {}) {
  const propio = limpiarModeloExplicito(art?.modelo, parentDoc);
  if (propio && !['S/M', 'SIN MODELO', 'N/A', 'NA'].includes(propio.toUpperCase())) {
    return propio;
  }

  // Buscar en inventario general si está disponible
  if (Array.isArray(inventario) && inventario.length > 0) {
    const rawCode = String(art?.codigo || art?.inventario || '').trim();
    const firstCode = rawCode.includes(' al ') ? rawCode.split(' al ')[0].trim() : rawCode;
    const matchedInv = inventario.find(inv =>
      (art?.id && inv.id === art.id) ||
      (firstCode && inv.codigo === firstCode) ||
      (art?.serie && inv.serie && String(art.serie).trim() === String(inv.serie).trim() &&
       String(art.descripcion || art.articulo || '').trim().toUpperCase() === String(inv.descripcion || inv.articulo || '').trim().toUpperCase())
    );
    if (matchedInv) {
      const modInv = limpiarModeloExplicito(matchedInv.modelo, parentDoc);
      if (modInv && !['S/M', 'SIN MODELO', 'N/A', 'NA'].includes(modInv.toUpperCase())) {
        return modInv;
      }
    }
  }

  return inferirModeloAutomatico(art, parentDoc);
}
