import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";
import Toast from "../components/Toast";

export default function QrCodeScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [toast, setToast] = useState({
    visivel: false,
    tipo: "info",
    mensagem: "",
  });

  const mostrarToast = (mensagem, tipo = "erro") =>
    setToast({ visivel: true, tipo, mensagem });

  const abrirDetalhes = async (valorLido) => {
    if (scanned) return;

    // Extrai o formato de código PAT-XXXXXX ou apenas o código puro lido
    const texto = String(valorLido).trim();
    const match = texto.match(/PAT-\d+/i);
    const codigo = match ? match[0].toUpperCase() : texto;

    if (!codigo) {
      mostrarToast("QR Code inválido.", "aviso");
      return;
    }

    setScanned(true);
    try {
      // Faz requisição buscando o patrimônio pelo código no backend
      const response = await api.get(`/patrimonio/codigo/${codigo}`);
      const materialId = response.data?.material?.id;

      if (materialId) {
        navigation.replace("DetalhesMaterial", { materialId });
      } else {
        mostrarToast("Material associado a este patrimônio não foi encontrado.", "erro");
        setScanned(false);
      }
    } catch (error) {
      const msg = error.response?.status === 404 
        ? `Patrimônio ${codigo} não cadastrado no sistema.` 
        : "Erro ao ler o código de patrimônio.";
      mostrarToast(msg, "erro");
      setScanned(false);
    }
  };

  const solicitarPermissao = async () => {
    await requestPermission();
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#1a73e8" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Toast
          visivel={toast.visivel}
          tipo={toast.tipo}
          mensagem={toast.mensagem}
          onFechar={() => setToast((t) => ({ ...t, visivel: false }))}
        />
        <Ionicons name="camera-outline" size={52} color="#1a73e8" />
        <Text style={styles.permissionTitle}>Precisamos da câmera</Text>
        <Text style={styles.permissionText}>
          Autorize o acesso para ler o QR Code e abrir o patrimônio
          automaticamente.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={solicitarPermissao}
        >
          <Text style={styles.permissionButtonText}>Permitir câmera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryButtonText}>Voltar</Text>
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

      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={
          scanned ? undefined : ({ data }) => abrirDetalhes(data)
        }
      />

      <View style={styles.overlay}>
        <View style={styles.frame} />
        <Text style={styles.title}>Aponte para o QR Code</Text>
        <Text style={styles.subtitle}>
          O app abrirá o patrimônio identificado automaticamente.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="close" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  frame: {
    width: 220,
    height: 220,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "transparent",
    marginBottom: 24,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 280,
  },
  closeButton: {
    position: "absolute",
    top: 48,
    right: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f8f9fa",
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#202124",
    marginTop: 16,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 14,
    color: "#5f6368",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: "#1a73e8",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  permissionButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#e8f0fe",
  },
  secondaryButtonText: { color: "#1a73e8", fontWeight: "700", fontSize: 15 },
});
