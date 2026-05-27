import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  StatusBar,
  Image
} from 'react-native';
import api from '../services/api';

export default function HomeScreen() {
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregarMateriais = async () => {
    try {
      const response = await api.get('/material');
      setMateriais(response.data);
    } catch (error) {
      console.error("Erro na API:", error);
      Alert.alert(
        "Erro de Conexão", 
        "Não foi possível carregar os materiais. Verifique a ligação com o servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarMateriais();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      
      {/* Coluna Esquerda: Imagem do Produto */}
      {item.imagemUrl ? (
        <Image 
          source={{ uri: item.imagemUrl }} 
          style={styles.imagem}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagemPlaceholder}>
          <Text style={styles.placeholderText}>Sem Foto</Text>
        </View>
      )}

      {/* Coluna Direita: Informações */}
      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
          <Text style={styles.nomeText} numberOfLines={1}>
            {item.nome}
          </Text>
          {item.quantidade < 3 && (
            <View style={styles.badgeDanger}>
              <Text style={styles.badgeText}>CRÍTICO</Text>
            </View>
          )}
        </View>
        
        {/* Adicionamos também a categoria que vi no seu TabelaEstoque.jsx */}
        <Text style={styles.categoriaText}>
          {item.categoria?.nome || 'Sem categoria'}
        </Text>

        <Text style={styles.infoText}>
          Local: <Text style={styles.boldText}>{item.local || 'Não definido'}</Text>
        </Text>
        
        <View style={styles.footerRow}>
          <Text style={styles.quantidadeText}>
            Estoque: <Text style={styles.valorText}>{item.quantidade} un.</Text>
          </Text>
        </View>
      </View>
      
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a73e8" />
      
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1a73e8" />
          <Text style={styles.loadingText}>A atualizar inventário...</Text>
        </View>
      ) : (
        <FlatList
          data={materiais}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.vazioText}>Nenhum bem registado no sistema.</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa', 
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#dadce0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: 'row', // Coloca a imagem e o texto lado a lado
    overflow: 'hidden', // Faz a imagem respeitar as bordas arredondadas do card
  },
  imagem: {
    width: 100, // Largura fixa para a miniatura
    backgroundColor: '#f1f3f4',
  },
  imagemPlaceholder: {
    width: 100,
    backgroundColor: '#f1f3f4',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#dadce0',
  },
  placeholderText: {
    color: '#9aa0a6',
    fontSize: 12,
    fontWeight: '500',
  },
  cardContent: {
    flex: 1, // Ocupa todo o resto do espaço disponível no card
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202124', 
    flex: 1,
    marginRight: 8,
  },
  badgeDanger: {
    backgroundColor: '#fce8e6',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d93025',
  },
  badgeText: {
    color: '#d93025', 
    fontSize: 9,
    fontWeight: '700',
  },
  categoriaText: {
    fontSize: 12,
    color: '#1a73e8', // Cor primária para destacar a categoria
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#5f6368',
    marginBottom: 8,
  },
  boldText: {
    color: '#202124',
    fontWeight: '500',
  },
  footerRow: {
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
    paddingTop: 8,
    marginTop: 'auto', // Empurra a quantidade para o final do card
  },
  quantidadeText: {
    fontSize: 13,
    color: '#5f6368',
  },
  valorText: {
    color: '#1a73e8', 
    fontWeight: '700',
  },
  loadingText: {
    marginTop: 12,
    color: '#5f6368',
    fontSize: 15,
  },
  vazioText: {
    color: '#5f6368',
    fontSize: 16,
    textAlign: 'center',
  },
});