import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";

export default function DetalhesMaterialScreen({ route, navigation }) {
  const materialParam = route.params?.material || null;
  const materialId = route.params?.materialId || materialParam?.id || null;
  const [materialAtual, setMaterialAtual] = useState(materialParam);
  const [historico, setHistorico] = useState([]);
  const [loadingMaterial, setLoadingMaterial] = useState(
    !materialParam && !!materialId,
  );
  const [loadingHistorico, setLoadingHistorico] = useState(true);
  const [patrimoniosSelecionados, setPatrimoniosSelecionados] = useState([]);
  const { usuario } = useAuth();

  const toggleSelecionar = (pat) => {
    if (patrimoniosSelecionados.some((p) => p.id === pat.id)) {
      setPatrimoniosSelecionados(patrimoniosSelecionados.filter((p) => p.id !== pat.id));
    } else {
      setPatrimoniosSelecionados([...patrimoniosSelecionados, pat]);
    }
  };

  const [toast, setToast] = useState({
    visivel: false,
    tipo: "info",
    mensagem: "",
  });
  const mostrarToast = (mensagem, tipo = "erro") =>
    setToast({ visivel: true, tipo, mensagem });

  useFocusEffect(
    useCallback(() => {
      setPatrimoniosSelecionados([]);
      carregarDados();
    }, [materialId]),
  );

  const carregarDados = async () => {
    if (!materialId) {
      mostrarToast("Não foi possível identificar o material.", "erro");
      setLoadingMaterial(false);
      setLoadingHistorico(false);
      return;
    }

    try {
      setLoadingMaterial(true);
      const responseMaterial = await api.get(`/material/${materialId}`);
      setMaterialAtual(responseMaterial.data);

      setLoadingHistorico(true);
      const responseHistorico = await api.get("/movimentacao");
      
      // Filtra as movimentações que pertencem aos patrimônios do material atual
      const listPatrimonioIds = responseMaterial.data.patrimonios?.map(p => p.id) || [];
      const historicoFiltrado = responseHistorico.data.filter(mov => 
        mov.patrimonio?.id && listPatrimonioIds.includes(mov.patrimonio.id)
      );
      
      setHistorico(historicoFiltrado);
    } catch {
      mostrarToast("Não foi possível carregar os dados do material.", "erro");
    } finally {
      setLoadingMaterial(false);
      setLoadingHistorico(false);
    }
  };

  const handleExcluir = () => {
    Alert.alert(
      "Excluir material",
      "Tem certeza que deseja excluir este patrimônio? Essa ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/material/${materialAtual.id}`);
              mostrarToast("Material excluído com sucesso!", "sucesso");
              navigation.goBack();
            } catch {
              mostrarToast("Não foi possível excluir o material.", "erro");
            }
          },
        },
      ],
    );
  };

  const formatarData = (dataString) => {
    if (!dataString) return "—";
    return new Date(dataString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Pega o IP dinamicamente e corrige caracteres especiais na URL
  const BASE_URL = api.defaults.baseURL.replace("/api", "");

  const uriImagem = materialAtual?.imagem
    ? materialAtual.imagem.startsWith("http")
      ? materialAtual.imagem
      : `${BASE_URL}/imagens/${encodeURIComponent(materialAtual.imagem)}`
    : null;

  if (loadingMaterial) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#1a73e8" />
      </View>
    );
  }

  if (!materialAtual) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.erroTitulo}>Material não encontrado.</Text>
        <TouchableOpacity
          style={styles.btnEditar}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.btnEditarText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Toast
        visivel={toast.visivel}
        tipo={toast.tipo}
        mensagem={toast.mensagem}
        onFechar={() => setToast((t) => ({ ...t, visivel: false }))}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {uriImagem ? (
          <Image
            source={{ uri: uriImagem }}
            style={styles.imagem}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagemPlaceholder}>
            <Ionicons name="cube-outline" size={48} color="#c5c8cc" />
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.nome}>{materialAtual.nome}</Text>
          </View>

          <Text style={styles.categoria}>
            {materialAtual.categoria?.nome || "Sem categoria"}
          </Text>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoLabelRow}>
              <Ionicons name="location-outline" size={14} color="#9aa0a6" />
              <Text style={styles.infoLabel}>Local</Text>
            </View>
            <Text style={styles.infoValor}>
              {materialAtual.local?.nome || "Não definido"}
            </Text>
          </View>
        </View>

        {/* Listagem das unidades físicas do patrimônio */}
        {materialAtual.patrimonios && materialAtual.patrimonios.length > 0 && (
          <View style={styles.card}>
            <Text style={[styles.infoLabel, { marginBottom: 10, fontWeight: "700" }]}>
              UNIDADES VINCULADAS ({materialAtual.patrimonios.length})
            </Text>
            {materialAtual.patrimonios.map((pat) => {
              const isSelected = patrimoniosSelecionados.some((p) => p.id === pat.id);
              return (
                <TouchableOpacity
                  key={pat.id}
                  style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f1f3f4" }}
                  onPress={() => toggleSelecionar(pat)}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Ionicons
                      name={isSelected ? "checkbox" : "square-outline"}
                      size={20}
                      color={isSelected ? "#1a73e8" : "#9aa0a6"}
                    />
                    <View style={{ gap: 2 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <Ionicons name="barcode-outline" size={14} color="#1a73e8" />
                        <Text style={{ fontWeight: "600", color: "#202124" }}>{pat.codigoPatrimonio}</Text>
                      </View>
                      <Text style={{ fontSize: 11, color: "#9aa0a6" }}>Local: {pat.local?.nome || "Sem local"}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={{ backgroundColor: "#e8f0fe", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: "#c5d8fa" }}
                    onPress={() =>
                      navigation.navigate("Movimentacao", { material: materialAtual, patrimonio: pat })
                    }
                  >
                    <Text style={{ color: "#1a73e8", fontSize: 12, fontWeight: "700" }}>Transferir</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.acoesContainer}>
          {usuario?.role === "ROLE_ADM" && (
            <>

              <TouchableOpacity
                style={styles.btnEditar}
                onPress={() =>
                  navigation.navigate("CadastroMaterial", {
                    material: materialAtual,
                  })
                }
              >
                <Ionicons name="create-outline" size={18} color="#1a73e8" />
                <Text style={styles.btnEditarText}>Editar Material</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnExcluir}
                onPress={handleExcluir}
              >
                <Ionicons name="trash-outline" size={18} color="#d93025" />
                <Text style={styles.btnExcluirText}>Excluir Material</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={styles.secaoTitulo}>Histórico de Movimentações</Text>

        {loadingHistorico ? (
          <ActivityIndicator color="#1a73e8" style={{ marginVertical: 20 }} />
        ) : historico.length === 0 ? (
          <View style={styles.vazioContainer}>
            <Ionicons
              name="swap-horizontal-outline"
              size={36}
              color="#dadce0"
            />
            <Text style={styles.vazioText}>
              Nenhuma movimentação registrada.
            </Text>
          </View>
        ) : (
          historico.map((item) => (
            <View key={item.id} style={styles.historicoCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="barcode-outline" size={13} color="#1a73e8" />
                  <Text style={{ fontWeight: "700", color: "#202124", fontSize: 13 }}>
                    {item.patrimonio?.codigoPatrimonio || "Patrimônio Geral"}
                  </Text>
                </View>
                <Text style={styles.historicoData}>
                  {formatarData(item.dataMovimentacao || item.createdAt)}
                </Text>
              </View>
              <View style={styles.rota}>
                <View style={styles.localBox}>
                  <Text style={styles.localLabel}>ORIGEM</Text>
                  <Text style={styles.localNome}>
                    {item.localOrigem?.nome || "—"}
                  </Text>
                </View>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color="#1a73e8"
                  style={{ marginHorizontal: 8 }}
                />
                <View style={styles.localBox}>
                  <Text style={styles.localLabel}>DESTINO</Text>
                  <Text style={styles.localNome}>
                    {item.localDestino?.nome || "—"}
                  </Text>
                </View>
              </View>
              {item.observacao ? (
                <Text style={styles.observacao}>"{item.observacao}"</Text>
              ) : null}
              <Text style={styles.responsavel}>
                Por:{" "}
                <Text style={styles.bold}>{item.usuario?.nome || "—"}</Text>
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {patrimoniosSelecionados.length > 0 && (
        <View style={{ padding: 16, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#dadce0" }}>
          <TouchableOpacity
            style={{ backgroundColor: "#1a73e8", padding: 14, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}
            onPress={() =>
              navigation.navigate("Movimentacao", {
                material: materialAtual,
                patrimonios: patrimoniosSelecionados, // Enviando a lista de patrimônios
              })
            }
          >
            <Ionicons name="swap-horizontal-outline" size={18} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 15 }}>
              Transferir Selecionados ({patrimoniosSelecionados.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f9" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  erroTitulo: {
    fontSize: 16,
    color: "#202124",
    fontWeight: "600",
    marginBottom: 12,
  },
  content: { paddingBottom: 40 },
  imagem: { width: "100%", height: 220, backgroundColor: "#f1f3f4" },
  imagemPlaceholder: {
    width: "100%",
    height: 180,
    backgroundColor: "#f1f3f4",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  nome: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#202124",
    flex: 1,
    marginRight: 8,
  },
  categoria: {
    fontSize: 11,
    color: "#1a73e8",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  divider: { height: 1, backgroundColor: "#f1f3f4", marginBottom: 12 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  infoLabelRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  infoLabel: { fontSize: 13, color: "#9aa0a6", fontWeight: "500" },
  infoValor: { fontSize: 14, color: "#202124", fontWeight: "600" },
  infoValorSmall: {
    fontSize: 12,
    color: "#5f6368",
    flex: 1,
    textAlign: "right",
  },
  acoesContainer: { marginHorizontal: 16, gap: 10, marginBottom: 8 },
  btnTransferir: {
    backgroundColor: "#1a73e8",
    padding: 14,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnTransferirText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  btnEditar: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#c5d8fa",
  },
  btnEditarText: { color: "#1a73e8", fontWeight: "bold", fontSize: 15 },
  btnExcluir: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#f4c7c3",
  },
  btnExcluirText: { color: "#d93025", fontWeight: "bold", fontSize: 15 },
  secaoTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: "#202124",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  vazioContainer: { alignItems: "center", padding: 24, gap: 8 },
  vazioText: { color: "#9aa0a6", fontSize: 14 },
  historicoCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    padding: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  historicoData: { fontSize: 12, color: "#9aa0a6", marginBottom: 10 },
  rota: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  localBox: { flex: 1, alignItems: "center" },
  localLabel: {
    fontSize: 10,
    color: "#9aa0a6",
    fontWeight: "700",
    marginBottom: 2,
    letterSpacing: 0.4,
  },
  localNome: {
    fontSize: 13,
    fontWeight: "600",
    color: "#202124",
    textAlign: "center",
  },
  observacao: {
    fontSize: 12,
    color: "#5f6368",
    fontStyle: "italic",
    marginBottom: 6,
  },
  responsavel: { fontSize: 12, color: "#9aa0a6" },
  bold: { fontWeight: "600", color: "#5f6368" },
});
