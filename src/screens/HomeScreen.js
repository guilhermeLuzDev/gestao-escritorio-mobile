import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  StatusBar
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
      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
          <Text style={styles.nomeText}>{item.nome}</Text>
          {item.quantidade < 3 && (
            <View style={styles.badgeDanger}>
              <Text style={styles.badgeText}>CRÍTICO</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.infoText}>
          Local: <Text style={styles.boldText}>{item.local || 'Não definido'}</Text>
        </Text>
        
        <View style={styles.footerRow}>
          <Text style={styles.quantidadeText}>
            Estoque: <Text style={styles.valorText}>{item.quantidade} unidades</Text>
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
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
    backgroundColor: '#f8f9fa', // Cor de fundo moderna (--bg-color)
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
    backgroundColor: '#ffffff', // Fundo do card (--card-bg)
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#dadce0', // Cor da borda (--border-color)
    // Sombra para Android
    elevation: 2,
    // Sombra para iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#202124', // Cor do texto principal (--text-main)
    flex: 1,
  },
  badgeDanger: {
    backgroundColor: '#fce8e6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d93025',
  },
  badgeText: {
    color: '#d93025', // Cor de perigo (--danger)
    fontSize: 10,
    fontWeight: '700',
  },
  infoText: {
    fontSize: 14,
    color: '#5f6368',
    marginBottom: 12,
  },
  boldText: {
    color: '#202124',
    fontWeight: '500',
  },
  footerRow: {
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
    paddingTop: 12,
    marginTop: 4,
  },
  quantidadeText: {
    fontSize: 14,
    color: '#5f6368',
  },
  valorText: {
    color: '#1a73e8', // Cor primária (--primary-color)
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