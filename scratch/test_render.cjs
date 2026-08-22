import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import Contraloria from './src/pages/dashboard/Contraloria.jsx';
import ControlEscolar from './src/pages/dashboard/ControlEscolar.jsx';

// Mock contexts and Firebase
jest.mock('./src/context/AuthContext', () => ({
  useAuth: () => ({ currentUser: { email: 'test@test.com' } })
}));
jest.mock('./src/hooks/useGlobalConfig', () => ({
  useGlobalConfig: () => ({ configuracion: {} })
}));
jest.mock('./src/firebase', () => ({
  db: {}, storage: {}
}));
jest.mock('firebase/firestore', () => ({
  collection: () => {}, query: () => {}, where: () => {}, onSnapshot: () => () => {}, doc: () => {}, updateDoc: () => {}, addDoc: () => {}, serverTimestamp: () => {}, getDocs: () => {}, deleteDoc: () => {}, writeBatch: () => {}, orderBy: () => {}
}));

try {
  console.log("Rendering Contraloria...");
  renderToString(<Contraloria />);
  console.log("Contraloria rendered successfully!");
} catch (e) {
  console.error("CONTRALORIA CRASH:", e);
}

try {
  console.log("Rendering ControlEscolar...");
  renderToString(<ControlEscolar />);
  console.log("ControlEscolar rendered successfully!");
} catch (e) {
  console.error("CONTROLESCOLAR CRASH:", e);
}
