import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import Toast from '../components/Toast';

export default function SolicitacoesPendentesScreen() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(null);
  const [acao, setAcao] = useState(null); // 'aprovar' | 'reprovar'
  const [observacaoAdmin, setObservacaoAdmin] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState({ visivel: false, tipo: 'info', mensagem: '' });

  const mostrarToast = (mensagem, tipo = 'erro') =>
    setToast({ visivel: true, tipo, mensagem });

  useFocusEffect(
    useCallback(() => {
      carregarPendentes();
    }, [])
  );

  const carregarPendentes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/solicitacao-movimentacao/pendentes');
      setSolicitacoes(response.data);
    } catch {
      mostrarToast('Não foi possível carregar as solicitações.', 'erro');
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (solicitacao, tipoAcao) => {
    setSolicitacaoSelecionada(solicitacao);
    setAcao(tipoAcao);
    setObservacaoAdmin('');
    setModalVisible(true);
  };

  const confirmarAcao = async () => {
    setSalvando(true);
    try {
      const endpoint =
        acao === 'aprovar'
          ? `/solicitacao-movimentacao/${solicitacaoSelecionada.id}/aprovar`
          : `/solicitacao-movimentacao/${solicitacaoSelecionada.id}/reprovar`;

      await api.put(endpoint, { observacaoAdmin });

      setModalVisible(false);
      mostrarToast(
        acao === 'aprovar' ? 'Solicitação aprovada!' : 'Solicitação reprovada.',
        acao === 'aprovar' ? 'sucesso' : 'aviso'
      );
      carregarPendentes();
    } catch {
      mostrarToast('Erro ao processar solicitação.', 'erro');
    } finally {
      setSalvando(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardMaterial}>{item.material?.nome}</Text>
      <View style={styles.cardRow}>
        <Ionicons name="location-outline" size={13} color="#5f6368" />
        <Text style={styles.cardInfo}>
          {item.localOrigem?.nome} → {item.localDestino?.nome}
        </Text>
      </View>
      <View style={styles.cardRow}>
        <Ionicons name="person-outline" size={13} color="#5f6368" />
        <Text style={styles.cardInfo}>{item.solicitante?.nome}</Text>
      </View>
      {item.observacao ? (
        <Text style={styles.cardObs}>"{item.observacao}"</Text>
      ) : null}
      <View style={styles.cardAcoes}>
        <TouchableOpacity
          style={[styles.btnAcao, styles.btnReprovar]}
          onPress={() => abrirModal(item, 'reprovar')}
        >
          <Ionicons name="close-outline" size={16} color="#d93025" />
          <Text style={[styles.btnAcaoText, { color: '#d93025' }]}>Reprovar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnAcao, styles.btnAprovar]}
          onPress={() => abrirModal(item, 'aprovar')}
        >
          <Ionicons name="checkmark-outline" size={16} color="#fff" />
          <Text style={[styles.btnAcaoText, { color: '#fff' }]}>Aprovar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f6f9' }}>
      <Toast
        visivel={toast.visivel}
        tipo={toast.tipo}
        mensagem={toast.mensagem}
        onFechar={() => setToast(t => ({ ...t, visivel: false }))}
      />

      {loading ? (
        <ActivityIndicator color="#1a73e8" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={solicitacoes}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.vazio}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#dadce0" />
              <Text style={styles.vazioText}>Nenhuma solicitação pendente</Text>
            </View>
          }
        />
      )}

      {/* Modal de confirmação */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitulo}>
              {acao === 'aprovar' ? 'Aprovar solicitação' : 'Reprovar solicitação'}
            </Text>
            <Text style={styles.modalDesc}>
              {solicitacaoSelecionada?.material?.nome}:{' '}
              {solicitacaoSelecionada?.localOrigem?.nome} →{' '}
              {solicitacaoSelecionada?.localDestino?.nome}
            </Text>
            <Text style={styles.label}>Observação (opcional)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={observacaoAdmin}
              onChangeText={setObservacaoAdmin}
              placeholder="Motivo ou comentário..."
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalAcoes}>
              <TouchableOpacity
                style={styles.modalCancelar}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmar,
                  acao === 'aprovar' ? styles.btnAprovarFull : styles.btnReprovarFull,
                ]}
                onPress={confirmarAcao}
                disabled={salvando}
              >
                {salvando
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.modalConfirmarText}>
                      {acao === 'aprovar' ? 'Aprovar' : 'Reprovar'}
                    </Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dadce0',
    elevation: 1,
  },
  cardMaterial: { fontSize: 16, fontWeight: 'bold', color: '#202124', marginBottom: 8 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  cardInfo: { fontSize: 13, color: '#5f6368' },
  cardObs: { fontSize: 13, color: '#9aa0a6', fontStyle: 'italic', marginTop: 6 },
  cardAcoes: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btnAcao: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5,
    paddingVertical: 10, borderRadius: 8,
  },
  btnAprovar: { backgroundColor: '#1a73e8' },
  btnReprovar: { backgroundColor: '#fce8e6', borderWidth: 1, borderColor: '#f5c6c3' },
  btnAprovarFull: { backgroundColor: '#1a73e8' },
  btnReprovarFull: { backgroundColor: '#d93025' },
  btnAcaoText: { fontWeight: '600', fontSize: 14 },
  vazio: { alignItems: 'center', marginTop: 60 },
  vazioText: { color: '#9aa0a6', marginTop: 12, fontSize: 15 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 20,
    borderTopRightRadius: 20, padding: 16, paddingBottom: 34,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: '#dadce0',
    borderRadius: 2, alignSelf: 'center', marginBottom: 14,
  },
  modalTitulo: { fontSize: 16, fontWeight: '700', color: '#202124', marginBottom: 4 },
  modalDesc: { fontSize: 13, color: '#5f6368', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#5f6368', marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#dadce0',
    borderRadius: 10, padding: 13, marginBottom: 16, fontSize: 15, color: '#202124',
  },
  inputMultiline: { height: 80, textAlignVertical: 'top' },
  modalAcoes: { flexDirection: 'row', gap: 10 },
  modalCancelar: {
    flex: 1, padding: 14, alignItems: 'center',
    backgroundColor: '#f8f9fa', borderRadius: 10,
    borderWidth: 1, borderColor: '#dadce0',
  },
  modalCancelarText: { color: '#9aa0a6', fontWeight: '600' },
  modalConfirmar: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 10 },
  modalConfirmarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});