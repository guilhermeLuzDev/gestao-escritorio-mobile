import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";

export default function ProfileScreen() {
  const { usuario, logout, updateUsuario } = useAuth();
  const [modalSair, setModalSair] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [camposFocados, setCamposFocados] = useState({});
  const [toast, setToast] = useState({
    visivel: false,
    tipo: "info",
    mensagem: "",
  });

  const isAdm = usuario?.role === "ROLE_ADM";
  const usuarioIdAtual =
    usuario?.id ||
    usuario?.usuarioId ||
    usuario?.idUsuario ||
    usuario?.userId ||
    null;
  const mostrarToast = (mensagem, tipo = "erro") =>
    setToast({ visivel: true, tipo, mensagem });

  useEffect(() => {
    setNome(usuario?.nome || "");
    setEmail(usuario?.email || "");
    setTelefone(usuario?.telefone || "");
  }, [usuario]);

  const validar = () => {
    if (!nome.trim() || !email.trim()) {
      mostrarToast("Preencha nome e e-mail.", "aviso");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      mostrarToast("Digite um e-mail válido.", "aviso");
      return false;
    }

    const telefoneLimpo = telefone.replace(/\D/g, "");
    if (
      telefoneLimpo &&
      (telefoneLimpo.length < 10 || telefoneLimpo.length > 11)
    ) {
      mostrarToast("Digite um telefone válido com DDD.", "aviso");
      return false;
    }

    return true;
  };

  const handleSalvar = async () => {
    const idUsuario =
      usuario?.id ||
      usuario?.usuarioId ||
      usuario?.idUsuario ||
      usuario?.userId ||
      null;

    if (!idUsuario) {
      mostrarToast("Não foi possível identificar o usuário.", "erro");
      return;
    }

    if (!validar()) return;

    setLoading(true);
    try {
      const payload = {
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.replace(/\D/g, "") || null,
      };

      const response = await api.put(`/usuario/${idUsuario}`, payload);
      const usuarioAtualizado = response.data || { ...usuario, ...payload };

      if (updateUsuario) {
        await updateUsuario(usuarioAtualizado);
      }

      mostrarToast("Perfil atualizado com sucesso!", "sucesso");
    } catch (error) {
      const msg =
        error.response?.data?.message || "Não foi possível atualizar o perfil.";
      mostrarToast(msg, "erro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Toast
        visivel={toast.visivel}
        tipo={toast.tipo}
        mensagem={toast.mensagem}
        onFechar={() => setToast((t) => ({ ...t, visivel: false }))}
      />

      <Modal visible={modalSair} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Sair da conta</Text>
            <Text style={styles.modalMensagem}>
              Tem certeza que deseja sair?
            </Text>
            <View style={styles.modalBotoes}>
              <TouchableOpacity
                style={styles.btnCancelar}
                onPress={() => setModalSair(false)}
              >
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirmar} onPress={logout}>
                <Text style={styles.btnConfirmarText}>Sair</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {usuario?.nome?.charAt(0).toUpperCase() ?? "?"}
            </Text>
          </View>

          <Text style={styles.titulo}>{usuario?.nome || "Meu Perfil"}</Text>

          <View
            style={[
              styles.badge,
              isAdm ? styles.badgeAdm : styles.badgeCliente,
            ]}
          >
            <Text style={styles.badgeText}>
              {isAdm ? "Administrador" : "Colaborador"}
            </Text>
          </View>

          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={[styles.input, camposFocados.nome && styles.inputFocado]}
            value={nome}
            onChangeText={setNome}
            onFocus={() => setCamposFocados((f) => ({ ...f, nome: true }))}
            onBlur={() => setCamposFocados((f) => ({ ...f, nome: false }))}
            placeholder="Digite seu nome"
            placeholderTextColor="#9aa0a6"
          />

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={[styles.input, camposFocados.email && styles.inputFocado]}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setCamposFocados((f) => ({ ...f, email: true }))}
            onBlur={() => setCamposFocados((f) => ({ ...f, email: false }))}
            placeholder="Digite seu e-mail"
            placeholderTextColor="#9aa0a6"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={[styles.input, camposFocados.telefone && styles.inputFocado]}
            value={telefone}
            onChangeText={setTelefone}
            onFocus={() => setCamposFocados((f) => ({ ...f, telefone: true }))}
            onBlur={() => setCamposFocados((f) => ({ ...f, telefone: false }))}
            placeholder="(81) 90000-0000"
            placeholderTextColor="#9aa0a6"
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            style={[styles.btnSalvar, loading && styles.btnSalvarDisabled]}
            onPress={handleSalvar}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnSalvarText}>SALVAR ALTERAÇÕES</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.btnLogout}
            onPress={() => setModalSair(true)}
          >
            <Text style={styles.btnLogoutText}>SAIR DA CONTA</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dadce0",
    padding: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1a73e8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    alignSelf: "center",
  },
  avatarText: { fontSize: 34, color: "#fff", fontWeight: "bold" },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#202124",
    marginBottom: 10,
    textAlign: "center",
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 16,
    alignSelf: "center",
  },
  badgeAdm: {
    backgroundColor: "#e8f0fe",
    borderWidth: 1,
    borderColor: "#1a73e8",
  },
  badgeCliente: {
    backgroundColor: "#e6f4ea",
    borderWidth: 1,
    borderColor: "#34a853",
  },
  badgeText: { fontSize: 13, fontWeight: "600", color: "#202124" },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5f6368",
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dadce0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#202124",
  },
  inputFocado: {
    borderColor: "#1a73e8",
  },
  btnSalvar: {
    backgroundColor: "#1a73e8",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 18,
  },
  btnSalvarDisabled: {
    backgroundColor: "#90b4e8",
  },
  btnSalvarText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#f1f3f4",
    marginVertical: 24,
  },
  btnLogout: {
    width: "100%",
    backgroundColor: "#fce8e6",
    padding: 14,
    borderRadius: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d93025",
  },
  btnLogoutText: { color: "#d93025", fontWeight: "bold", fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 32,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  modalTitulo: {
    fontSize: 17,
    fontWeight: "700",
    color: "#202124",
    marginBottom: 8,
  },
  modalMensagem: {
    fontSize: 14,
    color: "#5f6368",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalBotoes: { flexDirection: "row", gap: 12 },
  btnCancelar: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dadce0",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  btnCancelarText: { color: "#5f6368", fontWeight: "600", fontSize: 14 },
  btnConfirmar: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#d93025",
    alignItems: "center",
  },
  btnConfirmarText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
