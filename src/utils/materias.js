export const materiasPorGrado = {
  '1er Grado': [
    { id: 'espanol1', name: 'Español I' },
    { id: 'ingles1', name: 'Inglés I' },
    { id: 'artes1', name: 'Artes I' },
    { id: 'matematicas1', name: 'Matemáticas I' },
    { id: 'biologia', name: 'Ciencias I (Biología)' },
    { id: 'geografia', name: 'Geografía' },
    { id: 'historia1', name: 'Historia I' },
    { id: 'fce1', name: 'Formación Cívica y Ética I' },
    { id: 'tecnologia1', name: 'Tecnología I' },
    { id: 'educfisica1', name: 'Educación Física I' }
  ],
  '2do Grado': [
    { id: 'espanol2', name: 'Español II' },
    { id: 'ingles2', name: 'Inglés II' },
    { id: 'artes2', name: 'Artes II' },
    { id: 'matematicas2', name: 'Matemáticas II' },
    { id: 'fisica', name: 'Ciencias II (Física)' },
    { id: 'historia2', name: 'Historia II' },
    { id: 'fce2', name: 'Formación Cívica y Ética II' },
    { id: 'tecnologia2', name: 'Tecnología II' },
    { id: 'educfisica2', name: 'Educación Física II' }
  ],
  '3er Grado': [
    { id: 'espanol3', name: 'Español III' },
    { id: 'ingles3', name: 'Inglés III' },
    { id: 'artes3', name: 'Artes III' },
    { id: 'matematicas3', name: 'Matemáticas III' },
    { id: 'quimica', name: 'Ciencias III (Química)' },
    { id: 'historia3', name: 'Historia III' },
    { id: 'fce3', name: 'Formación Cívica y Ética III' },
    { id: 'tecnologia3', name: 'Tecnología III' },
    { id: 'educfisica3', name: 'Educación Física III' }
  ]
};

export const getTallerPorGrupo = (grupo) => {
  switch(grupo) {
    case 'A':
    case 'G': return 'Climatización y refrigeración';
    case 'B':
    case 'H': return 'Administración contable';
    case 'C':
    case 'I': return 'Diseño y circuitos eléctricos';
    case 'D':
    case 'J': return 'Administración contable';
    case 'E':
    case 'K': return 'Diseño y mecánica automotriz';
    case 'F':
    case 'L': return 'Ofimática';
    default: return 'Por asignar';
  }
};
