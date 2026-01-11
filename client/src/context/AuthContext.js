import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Inicializar Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('admin'); // 'admin' o 'agente'

  // Función para cambiar el modo de vista (solo para admins)
  function switchViewMode(mode) {
    if (userProfile?.rol === 'admin') {
      setViewMode(mode);
    }
  }

  // Determina si está en modo admin activo
  function isAdminMode() {
    if (userProfile?.rol !== 'admin') return false;
    return viewMode === 'admin';
  }

  // Determina si está en modo agente (para admins que quieren ver como agente)
  function isAgenteMode() {
    return viewMode === 'agente';
  }

  // Registrar nuevo usuario (solo admin)
  async function signup(email, password, nombre, agenteId, rol = 'agente') {
    setError(null);
    try {
      // Crear usuario en Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Crear documento en Firestore
      await setDoc(doc(db, 'usuarios', uid), {
        email,
        nombre,
        agenteId,
        rol,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return { uid, email, nombre, agenteId, rol };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Iniciar sesión
  async function login(email, password) {
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Cerrar sesión
  async function logout() {
    setError(null);
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Obtener perfil del usuario
  async function fetchUserProfile(uid) {
    try {
      const docRef = doc(db, 'usuarios', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (err) {
      console.error('❌ Error al obtener perfil:', err);
      setError(err.message);
      return null;
    }
  }

  // Observar cambios de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Obtener perfil del usuario
        const profile = await fetchUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    viewMode,
    switchViewMode,
    isAdminMode,
    isAgenteMode,
    signup,
    login,
    logout,
    fetchUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
