import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { auth } from "../config/firebaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setCarregandoAuth(false);
    });

    return () => unsubscribe();
  }, []);

  async function cadastrar(email, senha) {
    return createUserWithEmailAndPassword(auth, email, senha);
  }

  async function entrar(email, senha) {
    return signInWithEmailAndPassword(auth, email, senha);
  }

  async function sair() {
    return signOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        carregandoAuth,
        cadastrar,
        entrar,
        sair
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}