import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

const AuthContext = createContext({});

function normalizarUsuario(dadosUsuario) {
  if (!dadosUsuario) return null;

  const id =
    dadosUsuario.id ||
    dadosUsuario.usuarioId ||
    dadosUsuario.idUsuario ||
    dadosUsuario.userId ||
    null;

  return { ...dadosUsuario, id };
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ao abrir o app, verifica se já tem sessão salva
  useEffect(() => {
    async function carregarSessao() {
      try {
        const tokenSalvo = await AsyncStorage.getItem("@token");
        const usuarioSalvo = await AsyncStorage.getItem("@usuario");
        if (tokenSalvo && usuarioSalvo) {
          setUsuario(JSON.parse(usuarioSalvo));
        }
      } catch (e) {
        console.error("Erro ao carregar sessão:", e);
      } finally {
        setLoading(false);
      }
    }
    carregarSessao();
  }, []);

  async function login(email, senha) {
    const response = await api.post("/auth/login", { email, senha });
    const { token, ...dadosUsuario } = response.data;
    const usuarioNormalizado = normalizarUsuario(dadosUsuario);

    await AsyncStorage.setItem("@token", token);
    await AsyncStorage.setItem("@usuario", JSON.stringify(usuarioNormalizado));

    setUsuario(usuarioNormalizado);
    return usuarioNormalizado; // retorna para o caller saber o tipo (ADM/CLIENTE)
  }

  async function logout() {
    await AsyncStorage.multiRemove(["@token", "@usuario"]);
    setUsuario(null);
  }

  async function updateUsuario(dadosAtualizados) {
    const usuarioAtualizado = normalizarUsuario({
      ...usuario,
      ...dadosAtualizados,
    });
    await AsyncStorage.setItem("@usuario", JSON.stringify(usuarioAtualizado));
    setUsuario(usuarioAtualizado);
    return usuarioAtualizado;
  }

  return (
    <AuthContext.Provider
      value={{ usuario, loading, login, logout, updateUsuario }}
    >
      {children}
    </AuthContext.Provider>
  );
}
// Hook de atalho: useAuth()
export function useAuth() {
  return useContext(AuthContext);
}
