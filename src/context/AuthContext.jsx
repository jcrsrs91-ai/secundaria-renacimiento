import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [studentSession, setStudentSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escucha de Firebase Auth para personal administrativo y docente
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const emailKey = (user.email || '').toLowerCase().trim();
          const [userDoc, allowedDoc] = await Promise.all([
            getDoc(doc(db, 'users', user.uid)),
            emailKey ? getDoc(doc(db, 'allowed_emails', emailKey)) : Promise.resolve(null)
          ]);

          if (allowedDoc && allowedDoc.exists()) {
            const allowedData = allowedDoc.data();
            const userData = userDoc.exists() ? userDoc.data() : {};
            setUserPermissions(allowedData.permissions || userData.permissions || []);
            setUserRole(allowedData.role || userData.role || 'staff');
            setUserName(userData.nombre || allowedData.nombre || '');
          } else if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserPermissions(userData.permissions || []);
            setUserRole(userData.role || 'staff');
            setUserName(userData.nombre || '');
          } else {
            // Backwards compatibility for the original admin
            setUserPermissions(['all']);
            setUserRole('superadmin');
            setUserName('Administrador');
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserPermissions(null);
        setUserRole(null);
        setUserName('');
      }
      setCurrentUser(user);
      setLoading(false);
    });

    // Cargar sesión de estudiante desde LocalStorage si existe
    const savedStudent = localStorage.getItem('studentSession');
    if (savedStudent) {
      setStudentSession(JSON.parse(savedStudent));
    }

    return unsubscribe;
  }, []);

  const loginAsStudent = (studentData) => {
    setStudentSession(studentData);
    localStorage.setItem('studentSession', JSON.stringify(studentData));
  };

  const logout = async () => {
    await signOut(auth);
    setStudentSession(null);
    localStorage.removeItem('studentSession');
  };

  const value = {
    currentUser,
    userPermissions,
    userRole,
    userName,
    studentSession,
    loginAsStudent,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
