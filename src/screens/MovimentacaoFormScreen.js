import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";

export default function MovimentacaoFormScreen({ route, navigation }) {
  const { material, patrimonio, patrimonios } = route.params;
  const { usuario } = useAuth();
  const isAdm = usuario?.role === "ROLE_ADM";
  const usuarioIdAtual =
    usuario?.id ||
    usuario?.usuarioId ||
    usuario?.idUsuario ||
    usuario?.userId ||
    null;

  const [locais, setLocais] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [localSelecionado, setLocalSelecionado] = useState(null);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(usuario || null);
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingLocais, setLoadingLocais] = useState(true);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalUsuarioVisible, setModalUsuarioVisible] = useState(false);

  const [toast, setToast] = useState({
    visivel: false,
    tipo: "info",
    mensagem: "",
  });
  const mostrarToast = (mensagem, tipo = "erro") =>
    setToast({ visivel: true, tipo, mensagem });

  useEffect(() => {
    carregarLocais();
    if (isAdm) {
      carregarUsuarios();
    } else {
      setLoadingUsuarios(false);
    }
  }, []);

  useEffect(() => {
    if (usuario) {
      setUsuarioSelecionado({ ...usuario, id: usuarioIdAtual || usuario.id });
    }
  }, [usuario, usuarioIdAtual]);

  const carregarUsuarios = async () => {
    try {
      const response = await api.get("/usuario");
      const usuariosDisponiveis = response.data
        .filter((item) => item.role !== "ROLE_ADM")
        .map((item) => ({
          ...item,
          id: item.id || item.usuarioId || item.idUsuario || item.userId,
        }));
      setUsuarios(usuariosDisponiveis);
    } catch (error) {
      mostrarToast("Não foi possível carregar os usuários.", "erro");
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const carregarLocais = async () => {
    try {
      const response = await api.get("/local");
      const refPat = patrimonio || (patrimonios && patrimonios[0]);
      const localAtualId = refPat ? refPat.local?.id : material.local?.id;
      const locaisDisponiveis = response.data.filter(
        (l) => l.id !== localAtualId,
      );
      setLocais(locaisDisponiveis);
    } catch (error) {
      mostrarToast("Não foi possível carregar os locais.", "erro");
    } finally {
      setLoadingLocais(false);
    }
  };

  const handleSolicitar = async () => {
    if (!localSelecionado) {
      mostrarToast("Selecione o local de destino.", "aviso");
      return;
    }

    if (isAdm && !usuarioSelecionado) {
      mostrarToast("Selecione o usuário responsável.", "aviso");
      return;
    }

    setLoading(true);
    try {
      if (patrimonios && patrimonios.length > 0) {
        // Envio em lote
        await Promise.all(
          patrimonios.map((pat) =>
            api.post("/solicitacao-movimentacao/solicitar", {
              patrimonioId: pat.id,
              localDestinoId: localSelecionado.id,
              usuarioId: (isAdm ? usuarioSelecionado?.id : usuarioIdAtual) || null,
              observacao: observacao || null,
            })
          )
        );
        mostrarToast(`${patrimonios.length} solicitações enviadas!`, "sucesso");
      } else {
        // Envio individual
        await api.post("/solicitacao-movimentacao/solicitar", {
          patrimonioId: patrimonio ? patrimonio.id : material.id,
          localDestinoId: localSelecionado.id,
          usuarioId: (isAdm ? usuarioSelecionado?.id : usuarioIdAtual) || null,
          observacao: observacao || null,
        });
        mostrarToast(`Solicitação de ${material.nome} enviada!`, "sucesso");
      }
      setTimeout(() => navigation.popToTop(), 1500);
    } catch (error) {
      const msg =
        error.response?.data?.message || "Erro ao realizar transferência.";
      mostrarToast(msg, "erro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Toast
        visivel={toast.visivel}
        tipo={toast.tipo}
        mensagem={toast.mensagem}
        onFechar={() => setToast((t) => ({ ...t, visivel: false }))}
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Card do material */}
        <View style={styles.materialCard}>
          <Text style={styles.materialLabel}>
            {patrimonios && patrimonios.length > 0 ? "TRANSFERÊNCIA EM LOTE" : "MATERIAL"}
          </Text>
          <Text style={styles.materialNome}>
            {material.nome}
          </Text>
          
          {patrimonios && patrimonios.length > 0 ? (
            <View style={{ marginTop: 8, gap: 4 }}>
              <Text style={{ fontSize: 13, color: "#5f6368", fontWeight: "600" }}>Itens selecionados:</Text>
              <Text style={{ fontSize: 13, color: "#1a73e8", fontWeight: "700" }}>
                {patrimonios.map(p => p.codigoPatrimonio).join(", ")}
              </Text>
            </View>
          ) : patrimonio ? (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 13, color: "#5f6368", fontWeight: "600" }}>Item selecionado:</Text>
              <Text style={{ fontSize: 13, color: "#1a73e8", fontWeight: "700" }}>
                {patrimonio.codigoPatrimonio}
              </Text>
            </View>
          ) : null}

          <View style={styles.materialInfoRow}>
            <Ionicons name="location-outline" size={13} color="#5f6368" />
            <Text style={styles.materialInfo}>
              Local de origem:{" "}
              <Text style={styles.bold}>
                {patrimonio ? (patrimonio.local?.nome || "Não definido") : 
                 (patrimonios && patrimonios.length > 0 ? (patrimonios[0].local?.nome || "Não definido") : 
                 (material.local?.nome || "Não definido"))}
              </Text>
            </Text>
          </View>
        </View>

        <Text style={styles.label}>Solicitar em nome de *</Text>

        {isAdm ? (
          loadingUsuarios ? (
            <ActivityIndicator color="#1a73e8" style={{ marginBottom: 16 }} />
          ) : (
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setModalUsuarioVisible(true)}
            >
              <Text
                style={
                  usuarioSelecionado
                    ? styles.selectorText
                    : styles.selectorPlaceholder
                }
              >
                {usuarioSelecionado
                  ? usuarioSelecionado.nome
                  : "Selecionar usuário..."}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#5f6368" />
            </TouchableOpacity>
          )
        ) : (
          <View style={styles.usuarioCard}>
            <Text style={styles.usuarioCardLabel}>Usuário</Text>
            <Text style={styles.usuarioCardNome}>{usuario?.nome || "—"}</Text>
          </View>
        )}

        {/* Seletor de local destino */}
        <Text style={styles.label}>Local de Destino *</Text>

        {loadingLocais ? (
          <ActivityIndicator color="#1a73e8" style={{ marginBottom: 16 }} />
        ) : (
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setModalVisible(true)}
          >
            <Text
              style={
                localSelecionado
                  ? styles.selectorText
                  : styles.selectorPlaceholder
              }
            >
              {localSelecionado ? localSelecionado.nome : "Selecionar local..."}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#5f6368" />
          </TouchableOpacity>
        )}

        {/* Observação */}
        <Text style={styles.label}>Observação (opcional)</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={observacao}
          onChangeText={setObservacao}
          placeholder="Ex: Transferência para manutenção"
          multiline
          numberOfLines={3}
        />

        {/* Botão confirmar */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSolicitar}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.buttonContent}>
              <Ionicons name="swap-horizontal-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>SOLICITAR TRANSFERÊNCIA</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de seleção de local */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitulo}>Selecionar Local</Text>
            <FlatList
              data={locais}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setLocalSelecionado(item);
                    setModalVisible(false);
                  }}
                >
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color="#1a73e8"
                    style={{ marginRight: 10 }}
                  />
                  <Text style={styles.modalItemText}>{item.nome}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.modalVazio}>Nenhum local disponível.</Text>
              }
            />
            <TouchableOpacity
              style={styles.modalFechar}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalFecharText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={modalUsuarioVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitulo}>Selecionar Usuário</Text>
            <FlatList
              data={usuarios}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setUsuarioSelecionado(item);
                    setModalUsuarioVisible(false);
                  }}
                >
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color="#1a73e8"
                    style={{ marginRight: 10 }}
                  />
                  <Text style={styles.modalItemText}>{item.nome}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.modalVazio}>
                  Nenhum usuário disponível.
                </Text>
              }
            />
            <TouchableOpacity
              style={styles.modalFechar}
              onPress={() => setModalUsuarioVisible(false)}
            >
              <Text style={styles.modalFecharText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f4f6f9",
    flexGrow: 1,
  },
  materialCard: {
    backgroundColor: "#e8f0fe",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#c5d8fa",
  },
  materialLabel: {
    fontSize: 11,
    color: "#1a73e8",
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },
  materialNome: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#202124",
    marginBottom: 10,
  },
  materialInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 3,
  },
  materialInfo: { fontSize: 13, color: "#5f6368" },
  bold: { fontWeight: "600", color: "#202124" },
  usuarioCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dadce0",
    borderRadius: 10,
    padding: 13,
    marginBottom: 20,
  },
  usuarioCardLabel: {
    fontSize: 11,
    color: "#1a73e8",
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },
  usuarioCardNome: { fontSize: 15, color: "#202124", fontWeight: "500" },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5f6368",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  selector: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dadce0",
    borderRadius: 10,
    padding: 13,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  selectorText: { fontSize: 15, color: "#202124", fontWeight: "500" },
  selectorPlaceholder: { fontSize: 15, color: "#9aa0a6" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dadce0",
    borderRadius: 10,
    padding: 13,
    marginBottom: 28,
    fontSize: 15,
    color: "#202124",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  inputMultiline: {
    height: 88,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#1a73e8",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: { backgroundColor: "#9aa0a6" },
  buttonContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 34,
    maxHeight: "60%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#dadce0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 14,
  },
  modalTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: "#202124",
    marginBottom: 12,
    textAlign: "center",
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f4",
  },
  modalItemText: { fontSize: 15, color: "#202124" },
  modalVazio: { textAlign: "center", color: "#9aa0a6", padding: 20 },
  modalFechar: {
    marginTop: 12,
    padding: 14,
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dadce0",
  },
  modalFecharText: { color: "#9aa0a6", fontWeight: "600", fontSize: 14 },
});
