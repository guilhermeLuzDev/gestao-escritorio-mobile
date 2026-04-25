import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  ActivityIndicator 
} from 'react-native';
import api from '../services/api';

export default function CadastroScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCadastro = async () => {
    // Validação dos campos que são @NotBlank e @NotNull no nosso backend
    if (!nome || !cpf || !email || !senha) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos com asterisco (*).');
      return;
    }

    setLoading(true);

    try {
      await api.post('/usuario', {
        nome,
        cpf,
        email,
        senha,
        telefone,
        tipo: 'CLIENTE' // Definimos o padrão para utilizadores comuns via mobile
      });

      Alert.alert('Sucesso', 'Conta criada com sucesso!', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Não foi possível realizar o registo. Verifique os dados.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Usamos ScrollView para a tela poder rolar quando o teclado abrir
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.titulo}>Nova Conta</Text>

        <Text style={styles.label}>Nome Completo *</Text>
        <TextInput 
          style={styles.input} 
          value={nome} 
          onChangeText={setNome} 
          placeholder="Digite o seu nome" 
        />

        <Text style={styles.label}>CPF *</Text>
        <TextInput 
          style={styles.input} 
          value={cpf} 
          onChangeText={setCpf} 
          keyboardType="numeric" 
          placeholder="Apenas números" 
          maxLength={11}
        />

        <Text style={styles.label}>E-mail *</Text>
        <TextInput 
          style={styles.input} 
          value={email} 
          onChangeText={setEmail} 
          keyboardType="email-address" 
          autoCapitalize="none" 
          placeholder="exemplo@email.com" 
        />

        <Text style={styles.label}>Senha *</Text>
        <TextInput 
          style={styles.input} 
          value={senha} 
          onChangeText={setSenha} 
          secureTextEntry 
          placeholder="Crie uma senha" 
        />

        <Text style={styles.label}>Telefone</Text>
        <TextInput 
          style={styles.input} 
          value={telefone} 
          onChangeText={setTelefone} 
          keyboardType="phone-pad" 
          placeholder="(81) 90000-0000" 
        />

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleCadastro} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>CRIAR CONTA</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.linkContainer}
        >
          <Text style={styles.linkText}>Já tem conta? Voltar ao Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#1a73e8',
    fontWeight: '500',
  }
});