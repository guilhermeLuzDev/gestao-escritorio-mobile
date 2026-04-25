import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import api from '../services/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    setLoading(true);
    // INÍCIO DO MOCK
    setTimeout(() => {
      setLoading(false);

      // Simulamos a regra de negócio do Spring Boot: verificar se a credencial bate
      if (email === 'admin@email.com' && senha === '123') {
        const fakeResponse = {
          data: {
            id: 1,
            nome: 'Admin teste',
            email: 'admin@email.com',
            cpf: '12345678901',
            tipo: 'ADM'
          }
        };

        Alert.alert('Sucesso', `Login simulado com sucesso. Bem-vindo, ${fakeResponse.data.nome}!`);
        // Redireciona para a lista de materiais
        navigation.replace('Home'); 

      } else {
        // Simulamos a exceção do Spring Boot (Código 401/403)
        Alert.alert('Falha no Login', 'E-mail ou senha inválidos no mock.');
      }
    }, 1500); 

    // FIM DO MOCK
    /* CÓDIGO REAL PARA CONEXÃO COM O BACKEND (DESCOMENTAR QUANDO O BACKEND ESTIVER PRONTO):
    try {
      const response = await api.post('/usuario/login', { email, senha });
      if (response.data) {
        Alert.alert('Sucesso', `Bem-vindo, ${response.data.nome}!`);
        navigation.replace('Home');
      }
    } catch (error) {
      console.error(error);
      const mensagem = error.response?.data?.message || 'E-mail ou senha inválidos.';
      Alert.alert('Falha no Login', mensagem);
    } finally {
      setLoading(false);
    }
    */
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.titulo}>Sistema de Gestão</Text>
        
        <Text style={styles.label}>E-mail:</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Digite o e-mail (admin@email.com)"
        />

        <Text style={styles.label}>Senha:</Text>
        <TextInput
          style={styles.input}
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          placeholder="Digite a senha (123)"
        />

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>ENTRAR</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa', 
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff', 
    padding: 24,
    borderRadius: 8, 
    borderWidth: 1,
    borderColor: '#dadce0', 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#202124', 
    textAlign: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#5f6368', 
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#202124',
  },
  button: {
    backgroundColor: '#1a73e8', 
    padding: 14,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});