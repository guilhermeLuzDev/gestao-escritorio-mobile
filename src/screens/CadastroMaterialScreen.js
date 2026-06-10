import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
  ScrollView, Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import Toast from '../components/Toast';

export default function CadastroMaterialScreen({ route, navigation }) {
  const materialEdicao = route.params?.material || null;
  const modoEdicao = !!materialEdicao;

  const [nome, setNome] = useState(materialEdicao?.nome || '');
  const [quantidade, setQuantidade] = useState(String(materialEdicao?.quantidade ?? ''));
  const [imagemUrl, setImagemUrl] = useState(materialEdicao?.imagemUrl || '');
  const [loading, setLoading] = useState(false);
  const [camposFocados, setCamposFocados] = useState({});

  const [categorias, setCategorias] = useState([]);
  const [locais, setLocais] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(materialEdicao?.categoria || null);
  const [localSelecionado, setLocalSelecionado] = useState(materialEdicao?.local || null);

  const [modalCat, setModalCat] = useState(false);
  const [modalLoc, setModalLoc] = useState(false);

  const [toast, setToast] = useState({ visivel: false, tipo: 'info', mensagem: '' });
  const mostrarToast = (mensagem, tipo = 'erro') => setToast({ visivel: true, tipo, mensagem });

  useEffect(() => {
    navigation.setOptions({ title: modoEdicao ? 'Editar Material' : 'Novo Material' });
    carregarOpcoes();
  }, []);

  const carregarOpcoes = async () => {
    try {
      const [resCat, resLoc] = await Promise.all([
        api.get('/categoria'),
        api.get('/local'),
      ]);
      setCategorias(resCat.data);
      setLocais(resLoc.data);
    } catch {
      mostrarToast('Não foi possível carregar categorias e locais.', 'erro');
    }
  };

  const validar = () => {
    if (!nome.trim()) {
      mostrarToast('Informe o nome do material.', 'aviso'); return false;
    }
    if (nome.trim().length < 2) {
      mostrarToast('O nome deve ter pelo menos 2 caracteres.', 'aviso'); return false;
    }
    if (!quantidade || isNaN(Number(quantidade)) || Number(quantidade) < 0) {
      mostrarToast('Informe uma quantidade válida (0 ou mais).', 'aviso'); return false;
    }
    if (!Number.isInteger(Number(quantidade))) {
      mostrarToast('A quantidade deve ser um número inteiro.', 'aviso'); return false;
    }
    if (imagemUrl.trim() && !/^https?:\/\/.+/.test(imagemUrl.trim())) {
      mostrarToast('A URL da imagem deve começar com http:// ou https://', 'aviso'); return false;
    }
    if (!categoriaSelecionada) {
      mostrarToast('Selecione uma categoria.', 'aviso'); return false;
    }
    if (!localSelecionado) {
      mostrarToast('Selecione um local.', 'aviso'); return false;
    }
    return true;
  };

  const handleSalvar = async () => {
    if (!validar()) return;
    setLoading(true);

    const payload = {
      nome: nome.trim(),
      quantidade: Number(quantidade),
      imagemUrl: imagemUrl.trim() || null,
      categoriaId: categoriaSelecionada.id,
      localId: localSelecionado.id,
    };

    try {
      if (modoEdicao) {
        await api.put(`/material/${materialEdicao.id}`, payload);
        mostrarToast('Material atualizado com sucesso!', 'sucesso');
      } else {
        await api.post('/material', payload);
        mostrarToast('Material cadastrado com sucesso!', 'sucesso');
      }
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error) {
      const msg = error.response?.data?.message || 'Erro ao salvar material.';
      mostrarToast(msg, 'erro');
    } finally {
      setLoading(false);
    }
  };

  const SeletorModal = ({ visible, onClose, dados, onSelect, selecionado, titulo }) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitulo}>{titulo}</Text>
          <FlatList
            data={dados}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => {
              const ativo = selecionado?.id === item.id;
              return (
                <TouchableOpacity
                  style={[styles.modalItem, ativo && styles.modalItemAtivo]}
                  onPress={() => { onSelect(item); onClose(); }}
                >
                  <Text style={[styles.modalItemText, ativo && styles.modalItemTextoAtivo]}>
                    {item.nome}
                  </Text>
                  {ativo && (
                    <Ionicons name="checkmark" size={18} color="#1a73e8" />
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.modalVazio}>Nenhum item disponível.</Text>
            }
          />
          <TouchableOpacity style={styles.modalFechar} onPress={onClose}>
            <Text style={styles.modalFecharText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={{ flex: 1 }}>

      <Toast
        visivel={toast.visivel}
        tipo={toast.tipo}
        mensagem={toast.mensagem}
        onFechar={() => setToast(t => ({ ...t, visivel: false }))}
      />

      <ScrollView contentContainerStyle={styles.container}>

        <Text style={styles.label}>Nome do Material *</Text>
        <TextInput
          style={[styles.input, camposFocados.nome && styles.inputFocado]}
          value={nome}
          onChangeText={setNome}
          onFocus={() => setCamposFocados(f => ({ ...f, nome: true }))}
          onBlur={() => setCamposFocados(f => ({ ...f, nome: false }))}
          placeholder="Ex: Notebook Dell"
          placeholderTextColor="#9aa0a6"
        />

        <Text style={styles.label}>Quantidade *</Text>
        <TextInput
          style={[styles.input, camposFocados.qtd && styles.inputFocado]}
          value={quantidade}
          onChangeText={(v) => setQuantidade(v.replace(/[^0-9]/g, ''))} // apenas inteiros
          onFocus={() => setCamposFocados(f => ({ ...f, qtd: true }))}
          onBlur={() => setCamposFocados(f => ({ ...f, qtd: false }))}
          placeholder="Ex: 5"
          keyboardType="numeric"
          placeholderTextColor="#9aa0a6"
        />

        <Text style={styles.label}>URL da Imagem (opcional)</Text>
        <TextInput
          style={[styles.input, camposFocados.url && styles.inputFocado]}
          value={imagemUrl}
          onChangeText={setImagemUrl}
          onFocus={() => setCamposFocados(f => ({ ...f, url: true }))}
          onBlur={() => setCamposFocados(f => ({ ...f, url: false }))}
          placeholder="https://..."
          placeholderTextColor="#9aa0a6"
          autoCapitalize="none"
          keyboardType="url"
        />

        <Text style={styles.label}>Categoria *</Text>
        <TouchableOpacity
          style={[styles.selector, categoriaSelecionada && styles.selectorPreenchido]}
          onPress={() => setModalCat(true)}
        >
          <Text style={categoriaSelecionada ? styles.selectorText : styles.selectorPlaceholder}>
            {categoriaSelecionada?.nome || 'Selecionar categoria...'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#5f6368" />
        </TouchableOpacity>

        <Text style={styles.label}>Local *</Text>
        <TouchableOpacity
          style={[styles.selector, localSelecionado && styles.selectorPreenchido]}
          onPress={() => setModalLoc(true)}
        >
          <Text style={localSelecionado ? styles.selectorText : styles.selectorPlaceholder}>
            {localSelecionado?.nome || 'Selecionar local...'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#5f6368" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnSalvar, loading && styles.btnDisabled]}
          onPress={handleSalvar}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnSalvarText}>
                {modoEdicao ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR MATERIAL'}
              </Text>
          }
        </TouchableOpacity>

        <SeletorModal
          visible={modalCat}
          onClose={() => setModalCat(false)}
          dados={categorias}
          onSelect={setCategoriaSelecionada}
          selecionado={categoriaSelecionada}
          titulo="Selecionar Categoria"
        />
        <SeletorModal
          visible={modalLoc}
          onClose={() => setModalLoc(false)}
          dados={locais}
          onSelect={setLocalSelecionado}
          selecionado={localSelecionado}
          titulo="Selecionar Local"
        />

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f8f9fa', flexGrow: 1 },
  label: { fontSize: 14, fontWeight: '500', color: '#5f6368', marginBottom: 6 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#dadce0',
    borderRadius: 4, padding: 12, marginBottom: 16, fontSize: 16, color: '#202124',
  },
  inputFocado: { borderColor: '#1a73e8', borderWidth: 1.5 },
  selector: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#dadce0', borderRadius: 4,
    padding: 12, marginBottom: 16, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  selectorPreenchido: { borderColor: '#1a73e8' },
  selectorText: { fontSize: 16, color: '#202124' },
  selectorPlaceholder: { fontSize: 16, color: '#9aa0a6' },
  btnSalvar: {
    backgroundColor: '#1a73e8', padding: 14,
    borderRadius: 4, alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { backgroundColor: '#9aa0a6' },
  btnSalvarText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 16, maxHeight: '60%',
  },
  modalTitulo: {
    fontSize: 16, fontWeight: 'bold', color: '#202124',
    marginBottom: 12, textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f3f4',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 4,
  },
  modalItemAtivo: { backgroundColor: '#e8f0fe' },
  modalItemText: { fontSize: 16, color: '#202124' },
  modalItemTextoAtivo: { color: '#1a73e8', fontWeight: '600' },
  modalVazio: { textAlign: 'center', color: '#9aa0a6', padding: 20 },
  modalFechar: {
    marginTop: 12, padding: 14, alignItems: 'center',
    backgroundColor: '#fce8e6', borderRadius: 4,
  },
  modalFecharText: { color: '#d93025', fontWeight: '600' },
});