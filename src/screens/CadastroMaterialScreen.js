import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  Modal,
  FlatList,
  Platform, // <-- IMPORTANTE: Adicionado para diferenciar Web e Mobile
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import api from "../services/api";
import Toast from "../components/Toast";

export default function CadastroMaterialScreen({ route, navigation }) {
  const materialEdicao = route.params?.material || null;
  const modoEdicao = !!materialEdicao;

  const [nome, setNome] = useState(materialEdicao?.nome || "");
  const [imagemUri, setImagemUri] = useState(materialEdicao?.imagem || "");
  const [quantidade, setQuantidade] = useState(
    materialEdicao?.quantidade ? String(materialEdicao.quantidade) : "1"
  );

  const [loading, setLoading] = useState(false);
  const [camposFocados, setCamposFocados] = useState({});

  const [categorias, setCategorias] = useState([]);
  const [locais, setLocais] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(
    materialEdicao?.categoria || null,
  );
  const [localSelecionado, setLocalSelecionado] = useState(
    materialEdicao?.local || null,
  );

  const [modalCat, setModalCat] = useState(false);
  const [modalLoc, setModalLoc] = useState(false);

  const [toast, setToast] = useState({
    visivel: false,
    tipo: "info",
    mensagem: "",
  });
  const mostrarToast = (mensagem, tipo = "erro") =>
    setToast({ visivel: true, tipo, mensagem });

  const BASE_URL = api.defaults.baseURL.replace("/api", "");
  const imagemPreviewUri = imagemUri
    ? imagemUri.startsWith("http") ||
      imagemUri.startsWith("file:") ||
      imagemUri.startsWith("content:") ||
      imagemUri.startsWith("data:")
      ? imagemUri
      : `${BASE_URL}/imagens/${encodeURIComponent(imagemUri)}`
    : null;

  useEffect(() => {
    navigation.setOptions({
      title: modoEdicao ? "Editar Material" : "Novo Material",
    });
    carregarOpcoes();
  }, []);

  const carregarOpcoes = async () => {
    try {
      const [resCat, resLoc] = await Promise.all([
        api.get("/categoria"),
        api.get("/local"),
      ]);
      setCategorias(resCat.data);
      setLocais(resLoc.data);
    } catch (error) {
      mostrarToast("Não foi possível carregar categorias e locais.", "erro");
    }
  };

  const escolherImagem = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImagemUri(result.assets[0].uri);
    }
  };

  const validar = () => {
    if (!nome.trim()) {
      mostrarToast("Informe o nome do material.", "aviso");
      return false;
    }
    if (!categoriaSelecionada) {
      mostrarToast("Selecione uma categoria.", "aviso");
      return false;
    }
    if (!localSelecionado) {
      mostrarToast("Selecione um local.", "aviso");
      return false;
    }
    const qtdNum = parseInt(quantidade, 10);
    if (isNaN(qtdNum) || qtdNum <= 0) {
      mostrarToast("A quantidade deve ser um número maior que zero.", "aviso");
      return false;
    }
    return true;
  };

  const handleSalvar = async () => {
    if (!validar()) return;
    setLoading(true);

    const payload = {
      nome: nome.trim(),
      quantidade: parseInt(quantidade, 10),
      categoriaId: categoriaSelecionada.id,
      localId: localSelecionado.id,
    };

    // Verifica se a imagem é nova (não estava no banco)
    const isImagemNova = imagemUri && imagemUri !== materialEdicao?.imagem;

    // Preserva a imagem existente no payload de edição
    // para não sobrescrever com null no backend
    if (modoEdicao && materialEdicao?.imagem && !isImagemNova) {
      payload.imagem = materialEdicao.imagem;
    }

    try {
      let materialId;

      // ETAPA 1: Salva os dados de texto
      if (modoEdicao) {
        await api.put(`/material/${materialEdicao.id}`, payload);
        materialId = materialEdicao.id;
      } else {
        const response = await api.post("/material", payload);
        materialId = response.data.id;
      }

      // ETAPA 2: Upload da imagem (apenas se for nova)
      if (isImagemNova) {
        const formData = new FormData();

        // --- TRATAMENTO CRUZADO: WEB vs MOBILE ---
        if (Platform.OS === "web") {
          // Na Web: O navegador precisa converter o link do ficheiro num objeto Blob nativo
          const response = await fetch(imagemUri);
          const blob = await response.blob();
          formData.append("imagem", blob, "imagem_upload.jpg");
        } else {
          // No Mobile: O React Native usa um objeto com a URI local
          let filename = imagemUri.split("/").pop() || "imagem_upload.jpg";
          let match = /\.(\w+)$/.exec(filename);
          let type = match ? `image/${match[1]}` : `image/jpeg`;

          formData.append("imagem", {
            uri: imagemUri,
            name: filename,
            type,
          });
        }

        // Faz o upload no back-end
        await api.post(`/material/${materialId}/imagem`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      mostrarToast(
        modoEdicao
          ? "Material atualizado com sucesso!"
          : "Material cadastrado com sucesso!",
        "sucesso",
      );
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error) {
      const msg =
        error.response?.data?.message || "Erro ao salvar material ou imagem.";
      mostrarToast(msg, "erro");
    } finally {
      setLoading(false);
    }
  };

  const renderModal = (visivel, setVisivel, dados, setSelecionado, titulo) => (
    <Modal visible={visivel} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{titulo}</Text>
          <FlatList
            data={dados}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSelecionado(item);
                  setVisivel(false);
                }}
              >
                <Text style={styles.modalItemText}>
                  {item.nome || item.descricao}
                </Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => setVisivel(false)}
          >
            <Text style={styles.modalCloseText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <Toast
        visivel={toast.visivel}
        mensagem={toast.mensagem}
        tipo={toast.tipo}
        onClose={() => setToast({ ...toast, visivel: false })}
      />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Nome do Material</Text>
        <TextInput
          style={[styles.input, camposFocados.nome && styles.inputFocused]}
          value={nome}
          onChangeText={setNome}
          placeholder="Ex: Resma de Papel A4"
          onFocus={() => setCamposFocados({ ...camposFocados, nome: true })}
          onBlur={() => setCamposFocados({ ...camposFocados, nome: false })}
        />

        {!modoEdicao && (
          <>
            <Text style={styles.label}>Quantidade de Unidades</Text>
            <TextInput
              style={[styles.input, camposFocados.quantidade && styles.inputFocused]}
              value={quantidade}
              onChangeText={setQuantidade}
              placeholder="Ex: 4"
              keyboardType="numeric"
              onFocus={() => setCamposFocados({ ...camposFocados, quantidade: true })}
              onBlur={() => setCamposFocados({ ...camposFocados, quantidade: false })}
            />
          </>
        )}

        <Text style={styles.label}>Imagem do Material</Text>
        <TouchableOpacity
          style={styles.imagePickerBtn}
          onPress={escolherImagem}
        >
          <Ionicons name="camera-outline" size={24} color="#1a73e8" />
          <Text style={styles.imagePickerText}>
            {imagemUri ? "Trocar Imagem" : "Escolher Imagem"}
          </Text>
        </TouchableOpacity>

        {imagemPreviewUri ? (
          <Image
            source={{ uri: imagemPreviewUri }}
            style={styles.imagePreview}
          />
        ) : null}

        <Text style={styles.label}>Categoria</Text>
        <TouchableOpacity
          style={styles.selectorBtn}
          onPress={() => setModalCat(true)}
        >
          <Text
            style={
              categoriaSelecionada
                ? styles.selectorText
                : styles.selectorPlaceholder
            }
          >
            {categoriaSelecionada
              ? categoriaSelecionada.nome
              : "Selecione uma categoria"}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>

        <Text style={styles.label}>Local de Armazenamento</Text>
        <TouchableOpacity
          style={styles.selectorBtn}
          onPress={() => setModalLoc(true)}
        >
          <Text
            style={
              localSelecionado
                ? styles.selectorText
                : styles.selectorPlaceholder
            }
          >
            {localSelecionado ? localSelecionado.nome : "Selecione um local"}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSalvar}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Salvar Material</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {renderModal(
        modalCat,
        setModalCat,
        categorias,
        setCategoriaSelecionada,
        "Selecione a Categoria",
      )}
      {renderModal(
        modalLoc,
        setModalLoc,
        locais,
        setLocalSelecionado,
        "Selecione o Local",
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputFocused: {
    borderColor: "#1a73e8",
  },
  imagePickerBtn: {
    backgroundColor: "#e8f0fe",
    borderWidth: 1,
    borderColor: "#c5d8fa",
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  imagePickerText: {
    marginLeft: 8,
    color: "#1a73e8",
    fontSize: 15,
    fontWeight: "500",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: "cover",
  },
  selectorBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 14,
  },
  selectorText: {
    fontSize: 16,
    color: "#333",
  },
  selectorPlaceholder: {
    fontSize: 16,
    color: "#999",
  },
  saveBtn: {
    backgroundColor: "#1a73e8",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  saveBtnDisabled: {
    backgroundColor: "#90b4e8",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalItemText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  modalCloseBtn: {
    marginTop: 16,
    padding: 14,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    alignItems: "center",
  },
  modalCloseText: {
    color: "#ff4444",
    fontSize: 16,
    fontWeight: "bold",
  },
});
