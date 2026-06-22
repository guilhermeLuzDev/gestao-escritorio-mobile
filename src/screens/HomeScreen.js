import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  StatusBar, Image, TouchableOpacity, TextInput,
  Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

export default function HomeScreen({ navigation }) {
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const debounceRef = useRef(null);

  const [categorias, setCategorias] = useState([]);
  const [locais, setLocais] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(null);
  const [localSelecionado, setLocalSelecionado] = useState(null);
  const [modalFiltro, setModalFiltro] = useState(false);

  const [toast, setToast] = useState({ visivel: false, tipo: 'info', mensagem: '' });

  const mostrarToast = useCallback((mensagem, tipo = 'erro') => {
    setToast({ visivel: true, tipo, mensagem });
  }, []);

  const { logout, usuario } = useAuth();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 12 }}>
          {usuario?.role === 'ROLE_ADM' && (
            <TouchableOpacity
              onPress={() => navigation.navigate('CadastroMaterial')}
              style={styles.headerBtn}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={logout} style={styles.headerBtn}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, usuario, logout]);

  useEffect(() => {
    carregarFiltros();
    carregarMateriais();
  }, []);

  const carregarFiltros = async () => {
    try {
      const [resCat, resLoc] = await Promise.all([
        api.get('/categoria'),
        api.get('/local'),
      ]);
      setCategorias(resCat.data);
      setLocais(resLoc.data);
    } catch (e) {
      console.error('Erro ao carregar filtros:', e);
    }
  };

  const carregarMateriais = useCallback(async (nome = '', idCategoria = null, idLocal = null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (nome) params.append('nome', nome);
      if (idCategoria) params.append('idCategoria', idCategoria);
      if (idLocal) params.append('idLocal', idLocal);

      const query = params.toString();
      const response = query
        ? await api.post(`/material/filtrar?${query}`)
        : await api.get('/material');

      setMateriais(response.data);
    } catch (error) {
      console.error('Erro na API:', error);
      mostrarToast('Não foi possível carregar os materiais. Verifique sua conexão.', 'erro');
    } finally {
      setLoading(false);
    }
  }, [mostrarToast]);

  const handleBusca = (texto) => {
    setBusca(texto);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      carregarMateriais(texto, categoriaSelecionada?.id, localSelecionado?.id);
    }, 500);
  };

  const aplicarFiltros = () => {
    setModalFiltro(false);
    carregarMateriais(busca, categoriaSelecionada?.id, localSelecionado?.id);
  };

  const limparFiltros = () => {
    setCategoriaSelecionada(null);
    setLocalSelecionado(null);
    setBusca('');
    setModalFiltro(false);
    carregarMateriais();
  };

  const filtrosAtivos = categoriaSelecionada || localSelecionado;

  const renderItem = ({ item }) => {
    const BASE_URL = api.defaults.baseURL.replace('/api', '');
    
    const uriImagem = item.imagem 
      ? (item.imagem.startsWith('http') ? item.imagem : `${BASE_URL}/imagens/${encodeURIComponent(item.imagem)}`)
      : null;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('DetalhesMaterial', { material: item })}
        activeOpacity={0.82}
      >
        {uriImagem ? (
          <Image source={{ uri: uriImagem }} style={styles.imagem} resizeMode="cover" />
        ) : (
          <View style={styles.imagemPlaceholder}>
            <Ionicons name="cube-outline" size={28} color="#c5c8cc" />
          </View>
        )}

        <View style={styles.cardContent}>
          <View style={styles.headerRow}>
            <Text style={styles.nomeText} numberOfLines={1}>{item.nome}</Text>
            {item.quantidade < 3 && (
              <View style={styles.badgeDanger}>
                <Text style={styles.badgeText}>CRÍTICO</Text>
              </View>
            )}
          </View>

          <Text style={styles.categoriaText}>
            {item.categoria?.nome || 'Sem categoria'}
          </Text>

          <View style={styles.localRow}>
            <Ionicons name="location-outline" size={13} color="#8a8f98" />
            <Text style={styles.localText} numberOfLines={1}>
              {item.local?.nome || 'Local não definido'}
            </Text>
          </View>

          <View style={styles.footerRow}>
            <View style={styles.estoqueContainer}>
              <Text style={styles.estoqueLabel}>ESTOQUE</Text>
              <Text style={[styles.estoqueValor, item.quantidade < 3 && { color: '#d93025' }]}>
                {item.quantidade} un.
              </Text>
            </View>

            {usuario?.role === 'ROLE_ADM' && (
              <TouchableOpacity
                style={styles.btnTransferir}
                onPress={() => navigation.navigate('Movimentacao', { material: item })}
              >
                <Ionicons name="swap-horizontal-outline" size={14} color="#1a73e8" />
                <Text style={styles.btnTransferirText}>Transferir</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a73e8" />

      <Toast
        visivel={toast.visivel}
        tipo={toast.tipo}
        mensagem={toast.mensagem}
        onFechar={() => setToast(t => ({ ...t, visivel: false }))}
      />

      <View style={styles.buscaContainer}>
        <View style={styles.buscaInputWrapper}>
          <Ionicons name="search-outline" size={16} color="#9aa0a6" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.buscaInput}
            value={busca}
            onChangeText={handleBusca}
            placeholder="Buscar material..."
            placeholderTextColor="#9aa0a6"
            clearButtonMode="while-editing"
          />
        </View>
        <TouchableOpacity
          style={[styles.btnFiltro, filtrosAtivos && styles.btnFiltroAtivo]}
          onPress={() => setModalFiltro(true)}
        >
          <Ionicons name="options-outline" size={18} color={filtrosAtivos ? '#1a73e8' : '#fff'} />
          {filtrosAtivos && <View style={styles.filtroPonto} />}
        </TouchableOpacity>
      </View>

      {filtrosAtivos && (
        <View style={styles.tagsContainer}>
          {categoriaSelecionada && (
            <TouchableOpacity
              style={styles.tag}
              onPress={() => { setCategoriaSelecionada(null); carregarMateriais(busca, null, localSelecionado?.id); }}
            >
              <Text style={styles.tagText}>{categoriaSelecionada.nome}</Text>
              <Ionicons name="close" size={12} color="#1a73e8" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}
          {localSelecionado && (
            <TouchableOpacity
              style={styles.tag}
              onPress={() => { setLocalSelecionado(null); carregarMateriais(busca, categoriaSelecionada?.id, null); }}
            >
              <Text style={styles.tagText}>{localSelecionado.nome}</Text>
              <Ionicons name="close" size={12} color="#1a73e8" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1a73e8" />
          <Text style={styles.loadingText}>Carregando materiais...</Text>
        </View>
      ) : (
        <FlatList
          data={materiais}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          onRefresh={() => carregarMateriais(busca, categoriaSelecionada?.id, localSelecionado?.id)}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="cube-outline" size={48} color="#dadce0" />
              <Text style={styles.vazioTitulo}>Nenhum material encontrado</Text>
              <Text style={styles.vazioSubtitulo}>Tente ajustar os filtros ou a busca.</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal visible={modalFiltro} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitulo}>Filtrar Materiais</Text>

            <Text style={styles.filtroLabel}>Categoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {categorias.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, categoriaSelecionada?.id === cat.id && styles.chipAtivo]}
                  onPress={() => setCategoriaSelecionada(
                    categoriaSelecionada?.id === cat.id ? null : cat
                  )}
                >
                  <Text style={[styles.chipText, categoriaSelecionada?.id === cat.id && styles.chipTextoAtivo]}>
                    {cat.nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.filtroLabel}>Local</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {locais.map((loc) => (
                <TouchableOpacity
                  key={loc.id}
                  style={[styles.chip, localSelecionado?.id === loc.id && styles.chipAtivo]}
                  onPress={() => setLocalSelecionado(
                    localSelecionado?.id === loc.id ? null : loc
                  )}
                >
                  <Text style={[styles.chipText, localSelecionado?.id === loc.id && styles.chipTextoAtivo]}>
                    {loc.nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalBotoes}>
              <TouchableOpacity style={styles.btnLimpar} onPress={limparFiltros}>
                <Text style={styles.btnLimparText}>Limpar tudo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnAplicar} onPress={aplicarFiltros}>
                <Text style={styles.btnAplicarText}>Aplicar</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalFechar} onPress={() => setModalFiltro(false)}>
              <Text style={styles.modalFecharText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  headerBtn: { padding: 6 },

  buscaContainer: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 8,
    flexDirection: 'row',
    gap: 10,
  },
  buscaInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  buscaInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 15,
    color: '#202124',
  },
  btnFiltro: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  btnFiltroAtivo: { backgroundColor: '#fff' },
  filtroPonto: {
    position: 'absolute',
    top: 7, right: 7,
    width: 7, height: 7,
    borderRadius: 4,
    backgroundColor: '#ea4335',
  },

  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#e8f0fe',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#1a73e8',
  },
  tagText: { color: '#1a73e8', fontSize: 12, fontWeight: '600' },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  loadingText: { marginTop: 12, color: '#5f6368', fontSize: 14 },
  vazioTitulo: { marginTop: 16, fontSize: 16, fontWeight: '600', color: '#5f6368', textAlign: 'center' },
  vazioSubtitulo: { marginTop: 6, fontSize: 13, color: '#9aa0a6', textAlign: 'center' },
  listContent: { padding: 16, paddingBottom: 32 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  imagem: { width: 96, backgroundColor: '#f1f3f4' },
  imagemPlaceholder: {
    width: 96,
    backgroundColor: '#f4f6f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f1f3f4',
  },
  cardContent: { flex: 1, padding: 13 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 },
  nomeText: { fontSize: 15, fontWeight: '700', color: '#202124', flex: 1, marginRight: 6 },
  badgeDanger: {
    backgroundColor: '#fce8e6',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1, borderColor: '#d93025',
  },
  badgeText: { color: '#d93025', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  categoriaText: {
    fontSize: 11, color: '#1a73e8', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7,
  },
  localRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 10 },
  localText: { fontSize: 12, color: '#8a8f98', flex: 1 },
  footerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#f1f3f4', paddingTop: 9, marginTop: 'auto',
  },
  estoqueContainer: { gap: 1 },
  estoqueLabel: { fontSize: 10, color: '#9aa0a6', textTransform: 'uppercase', letterSpacing: 0.4 },
  estoqueValor: { fontSize: 14, fontWeight: '700', color: '#1a73e8' },
  btnTransferir: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: '#c5d8fa',
  },
  btnTransferirText: { color: '#1a73e8', fontSize: 12, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 34,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: '#dadce0',
    borderRadius: 2, alignSelf: 'center', marginBottom: 16,
  },
  modalTitulo: { fontSize: 16, fontWeight: '700', color: '#202124', marginBottom: 18, textAlign: 'center' },
  filtroLabel: { fontSize: 11, fontWeight: '700', color: '#9aa0a6', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 },
  chipScroll: { marginBottom: 18 },
  chip: {
    borderWidth: 1, borderColor: '#e0e0e0',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    marginRight: 8, backgroundColor: '#f8f9fa',
  },
  chipAtivo: { backgroundColor: '#1a73e8', borderColor: '#1a73e8' },
  chipText: { fontSize: 13, color: '#5f6368', fontWeight: '500' },
  chipTextoAtivo: { color: '#fff', fontWeight: '700' },
  modalBotoes: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  btnLimpar: {
    flex: 1, padding: 13, borderRadius: 10,
    borderWidth: 1, borderColor: '#e0e0e0',
    alignItems: 'center', backgroundColor: '#f8f9fa',
  },
  btnLimparText: { color: '#5f6368', fontWeight: '600', fontSize: 14 },
  btnAplicar: { flex: 1, padding: 13, borderRadius: 10, backgroundColor: '#1a73e8', alignItems: 'center' },
  btnAplicarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalFechar: { padding: 12, alignItems: 'center' },
  modalFecharText: { color: '#9aa0a6', fontWeight: '600', fontSize: 14 },
});