import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Image,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

export default function DetalhesMaterialScreen({ route, navigation }) {
  const { material } = route.params;
  const [historico, setHistorico] = useState([]);
  const [loadingHistorico, setLoadingHistorico] = useState(true);
  const { usuario } = useAuth();

  const [toast, setToast] = useState({ visivel: false, tipo: 'info', mensagem: '' });
  const mostrarToast = (mensagem, tipo = 'erro') => setToast({ visivel: true, tipo, mensagem });

  useEffect(() => {
    carregarHistorico();
  }, []);

  const carregarHistorico = async () => {
    try {
      const response = await api.get(`/movimentacao/material/${material.id}`);
      setHistorico(response.data);
    } catch {
      mostrarToast('Não foi possível carregar o histórico.', 'erro');
    } finally {
      setLoadingHistorico(false);
    }
  };

  const formatarData = (dataString) => {
    if (!dataString) return '—';
    return new Date(dataString).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <View style={{ flex: 1 }}>

      <Toast
        visivel={toast.visivel}
        tipo={toast.tipo}
        mensagem={toast.mensagem}
        onFechar={() => setToast(t => ({ ...t, visivel: false }))}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {material.imagemUrl ? (
          <Image source={{ uri: material.imagemUrl }} style={styles.imagem} resizeMode="cover" />
        ) : (
          <View style={styles.imagemPlaceholder}>
            <Ionicons name="cube-outline" size={48} color="#c5c8cc" />
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.nome}>{material.nome}</Text>
            {material.quantidade < 3 && (
              <View style={styles.badgeDanger}>
                <Text style={styles.badgeText}>CRÍTICO</Text>
              </View>
            )}
          </View>

          <Text style={styles.categoria}>{material.categoria?.nome || 'Sem categoria'}</Text>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoLabelRow}>
              <Ionicons name="location-outline" size={14} color="#9aa0a6" />
              <Text style={styles.infoLabel}>Local</Text>
            </View>
            <Text style={styles.infoValor}>{material.local?.nome || 'Não definido'}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabelRow}>
              <Ionicons name="layers-outline" size={14} color="#9aa0a6" />
              <Text style={styles.infoLabel}>Quantidade</Text>
            </View>
            <Text style={[styles.infoValor, material.quantidade < 3 && { color: '#d93025' }]}>
              {material.quantidade} unidades
            </Text>
          </View>

          {material.imagemUrl && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <Ionicons name="image-outline" size={14} color="#9aa0a6" />
                <Text style={styles.infoLabel}>Imagem</Text>
              </View>
              <Text style={styles.infoValorSmall} numberOfLines={1}>{material.imagemUrl}</Text>
            </View>
          )}
        </View>

        <View style={styles.acoesContainer}>

          {/* Botão visível para o CLIENTE — solicitar */}
          {usuario?.role !== 'ROLE_ADM' && (
            <TouchableOpacity
              style={styles.btnTransferir}
              onPress={() => navigation.navigate('Movimentacao', { material })}
            >
              <Ionicons name="swap-horizontal-outline" size={18} color="#fff" />
              <Text style={styles.btnTransferirText}>Solicitar Transferência</Text>
            </TouchableOpacity>
          )}

          {/* Botões visíveis apenas para o ADM */}
          {usuario?.role === 'ROLE_ADM' && (
            <>
              <TouchableOpacity
                style={styles.btnTransferir}
                onPress={() => navigation.navigate('Movimentacao', { material })}
              >
                <Ionicons name="swap-horizontal-outline" size={18} color="#fff" />
                <Text style={styles.btnTransferirText}>Transferir Material</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnEditar}
                onPress={() => navigation.navigate('CadastroMaterial', { material })}
              >
                <Ionicons name="create-outline" size={18} color="#1a73e8" />
                <Text style={styles.btnEditarText}>Editar Material</Text>
              </TouchableOpacity>
            </>
          )}

        </View>

        <Text style={styles.secaoTitulo}>Histórico de Movimentações</Text>

        {loadingHistorico ? (
          <ActivityIndicator color="#1a73e8" style={{ marginVertical: 20 }} />
        ) : historico.length === 0 ? (
          <View style={styles.vazioContainer}>
            <Ionicons name="swap-horizontal-outline" size={36} color="#dadce0" />
            <Text style={styles.vazioText}>Nenhuma movimentação registrada.</Text>
          </View>
        ) : (
          historico.map((item) => (
            <View key={item.id} style={styles.historicoCard}>
              <Text style={styles.historicoData}>{formatarData(item.dataMovimentacao || item.createdAt)}</Text>
              <View style={styles.rota}>
                <View style={styles.localBox}>
                  <Text style={styles.localLabel}>ORIGEM</Text>
                  <Text style={styles.localNome}>{item.localOrigem?.nome || '—'}</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color="#1a73e8" style={{ marginHorizontal: 8 }} />
                <View style={styles.localBox}>
                  <Text style={styles.localLabel}>DESTINO</Text>
                  <Text style={styles.localNome}>{item.localDestino?.nome || '—'}</Text>
                </View>
              </View>
              {item.observacao
                ? <Text style={styles.observacao}>"{item.observacao}"</Text>
                : null
              }
              <Text style={styles.responsavel}>
                Por: <Text style={styles.bold}>{item.usuario?.nome || '—'}</Text>
              </Text>
            </View>
          ))
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  content: { paddingBottom: 40 },
  imagem: { width: '100%', height: 220, backgroundColor: '#f1f3f4' },
  imagemPlaceholder: {
    width: '100%', height: 180, backgroundColor: '#f1f3f4',
    justifyContent: 'center', alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff', margin: 16, borderRadius: 12,
    padding: 16, elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  nome: { fontSize: 22, fontWeight: 'bold', color: '#202124', flex: 1, marginRight: 8 },
  badgeDanger: {
    backgroundColor: '#fce8e6', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, borderWidth: 1, borderColor: '#d93025',
  },
  badgeText: { color: '#d93025', fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  categoria: { fontSize: 11, color: '#1a73e8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#f1f3f4', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  infoLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoLabel: { fontSize: 13, color: '#9aa0a6', fontWeight: '500' },
  infoValor: { fontSize: 14, color: '#202124', fontWeight: '600' },
  infoValorSmall: { fontSize: 12, color: '#5f6368', flex: 1, textAlign: 'right' },
  acoesContainer: { marginHorizontal: 16, gap: 10, marginBottom: 8 },
  btnTransferir: {
    backgroundColor: '#1a73e8', padding: 14, borderRadius: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnTransferirText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  btnEditar: {
    backgroundColor: '#fff', padding: 14, borderRadius: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: '#c5d8fa',
  },
  btnEditarText: { color: '#1a73e8', fontWeight: 'bold', fontSize: 15 },
  secaoTitulo: { fontSize: 15, fontWeight: '700', color: '#202124', marginHorizontal: 16, marginTop: 8, marginBottom: 12 },
  vazioContainer: { alignItems: 'center', padding: 24, gap: 8 },
  vazioText: { color: '#9aa0a6', fontSize: 14 },
  historicoCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10,
    borderRadius: 12, padding: 14, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6,
  },
  historicoData: { fontSize: 12, color: '#9aa0a6', marginBottom: 10 },
  rota: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  localBox: { flex: 1, alignItems: 'center' },
  localLabel: { fontSize: 10, color: '#9aa0a6', fontWeight: '700', marginBottom: 2, letterSpacing: 0.4 },
  localNome: { fontSize: 13, fontWeight: '600', color: '#202124', textAlign: 'center' },
  observacao: { fontSize: 12, color: '#5f6368', fontStyle: 'italic', marginBottom: 6 },
  responsavel: { fontSize: 12, color: '#9aa0a6' },
  bold: { fontWeight: '600', color: '#5f6368' },
});