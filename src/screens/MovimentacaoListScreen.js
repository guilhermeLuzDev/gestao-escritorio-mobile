import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList,
  StyleSheet, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import Toast from '../components/Toast';

export default function MovimentacaoListScreen({ route }) {
  const { materialId, materialNome } = route.params;
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState({ visivel: false, tipo: 'info', mensagem: '' });
  const mostrarToast = (mensagem, tipo = 'erro') => setToast({ visivel: true, tipo, mensagem });

  // Recarrega toda vez que a tela recebe foco (volta de outra tela)
  useFocusEffect(
    useCallback(() => {
      carregarHistorico();
    }, [materialId])
  );

  const carregarHistorico = async () => {
    setLoading(true);
    try {
      const response = materialId && materialId !== 0
        ? await api.get(`/movimentacao/material/${materialId}`)
        : await api.get('/movimentacao');
      setMovimentacoes(response.data);
    } catch {
      mostrarToast('Não foi possível carregar o histórico.', 'erro');
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataString) => {
    if (!dataString) return '—';
    return new Date(dataString).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.data}>{formatarData(item.dataMovimentacao || item.createdAt)}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>TRANSFERÊNCIA</Text>
        </View>
      </View>

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
  );

  return (
    <View style={{ flex: 1 }}>

      <Toast
        visivel={toast.visivel}
        tipo={toast.tipo}
        mensagem={toast.mensagem}
        onFechar={() => setToast(t => ({ ...t, visivel: false }))}
      />

      <FlatList
        data={movimentacoes}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.container}
        // Puxa para baixo para atualizar manualmente
        onRefresh={carregarHistorico}
        refreshing={loading}
        ListHeaderComponent={
          materialNome && materialNome !== 'Todas'
            ? <Text style={styles.materialNome}>{materialNome}</Text>
            : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.center}>
              <Ionicons name="swap-horizontal-outline" size={48} color="#dadce0" />
              <Text style={styles.vazioTitulo}>Nenhuma movimentação</Text>
              <Text style={styles.vazioSubtitulo}>As transferências registradas aparecerão aqui.</Text>
            </View>
          ) : null
        }
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f4f6f9', flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  materialNome: {
    fontSize: 14, fontWeight: '600',
    color: '#202124', marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  data: { fontSize: 12, color: '#9aa0a6' },
  badge: {
    backgroundColor: '#e8f0fe', paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 6,
  },
  badgeText: { fontSize: 10, color: '#1a73e8', fontWeight: '700', letterSpacing: 0.4 },
  rota: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  localBox: { flex: 1, alignItems: 'center' },
  localLabel: { fontSize: 10, color: '#9aa0a6', fontWeight: '700', marginBottom: 2, letterSpacing: 0.4 },
  localNome: { fontSize: 14, fontWeight: '600', color: '#202124', textAlign: 'center' },
  observacao: { fontSize: 13, color: '#5f6368', fontStyle: 'italic', marginBottom: 8 },
  responsavel: { fontSize: 12, color: '#9aa0a6' },
  bold: { fontWeight: '600', color: '#5f6368' },
  vazioTitulo: { marginTop: 16, fontSize: 16, fontWeight: '600', color: '#5f6368', textAlign: 'center' },
  vazioSubtitulo: { marginTop: 6, fontSize: 13, color: '#9aa0a6', textAlign: 'center' },
});