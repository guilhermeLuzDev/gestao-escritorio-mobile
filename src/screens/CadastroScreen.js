import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator
} from 'react-native';
import api from '../services/api';
import Toast from '../components/Toast';

export default function CadastroScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState({ visivel: false, tipo: 'info', mensagem: '' });
  const mostrarToast = (mensagem, tipo = 'erro') => setToast({ visivel: true, tipo, mensagem });

  // Máscaras
  const mascaraCPF = (valor) => {
    return valor
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14);
  };

  const mascaraTelefone = (valor) => {
    return valor
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
      .slice(0, 15);
  };

  const validar = () => {
    if (!nome.trim() || !cpf || !email || !senha) {
      mostrarToast('Preencha todos os campos obrigatórios (*).', 'aviso');
      return false;
    }

    if (nome.trim().length < 3) {
      mostrarToast('O nome deve ter pelo menos 3 caracteres.', 'aviso');
      return false;
    }

    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      mostrarToast('CPF inválido. Digite os 11 dígitos.', 'aviso');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      mostrarToast('Digite um e-mail válido.', 'aviso');
      return false;
    }

    if (senha.length < 6) {
      mostrarToast('A senha deve ter pelo menos 6 caracteres.', 'aviso');
      return false;
    }

    if (!/[A-Z]/.test(senha)) {
      mostrarToast('A senha deve ter pelo menos uma letra maiúscula.', 'aviso');
      return false;
    }

    if (!/[0-9]/.test(senha)) {
      mostrarToast('A senha deve ter pelo menos um número.', 'aviso');
      return false;
    }

    if (telefone) {
      const telLimpo = telefone.replace(/\D/g, '');
      if (telLimpo.length < 10 || telLimpo.length > 11) {
        mostrarToast('Telefone inválido. Digite DDD + número.', 'aviso');
        return false;
      }
    }

    return true;
  };

  const handleCadastro = async () => {
    if (!validar()) return;

    setLoading(true);
    try {
      await api.post('/usuario', {
        nome: nome.trim(),
        cpf: cpf.replace(/\D/g, ''),
        email,
        senha,
        telefone: telefone.replace(/\D/g, '') || null,
        tipo: 'CLIENTE',
      });

      mostrarToast('Conta criada com sucesso!', 'sucesso');
      setTimeout(() => navigation.navigate('Login'), 1500);

    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Não foi possível criar a conta. Verifique os dados.';
      mostrarToast(msg, 'erro');
    } finally {
      setLoading(false);
    }
  };

  // Força visual nos inputs com erro
  const [camposFocados, setCamposFocados] = useState({});

  return (
    <View style={{ flex: 1 }}>

      <Toast
        visivel={toast.visivel}
        tipo={toast.tipo}
        mensagem={toast.mensagem}
        onFechar={() => setToast(t => ({ ...t, visivel: false }))}
        offsetTop={56}
      />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.titulo}>Nova Conta</Text>

          {/* Dica de senha */}
          <View style={styles.dicaContainer}>
            <Text style={styles.dicaText}>
              A senha deve ter no mínimo 6 caracteres, uma letra maiúscula e um número.
            </Text>
          </View>

          <Text style={styles.label}>Nome Completo *</Text>
          <TextInput
            style={[styles.input, camposFocados.nome && styles.inputFocado]}
            value={nome}
            onChangeText={setNome}
            onFocus={() => setCamposFocados(f => ({ ...f, nome: true }))}
            onBlur={() => setCamposFocados(f => ({ ...f, nome: false }))}
            placeholder="Digite o seu nome"
            placeholderTextColor="#9aa0a6"
          />

          <Text style={styles.label}>CPF *</Text>
          <TextInput
            style={[styles.input, camposFocados.cpf && styles.inputFocado]}
            value={cpf}
            onChangeText={(v) => setCpf(mascaraCPF(v))}
            onFocus={() => setCamposFocados(f => ({ ...f, cpf: true }))}
            onBlur={() => setCamposFocados(f => ({ ...f, cpf: false }))}
            keyboardType="numeric"
            placeholder="000.000.000-00"
            placeholderTextColor="#9aa0a6"
            maxLength={14}
          />

          <Text style={styles.label}>E-mail *</Text>
          <TextInput
            style={[styles.input, camposFocados.email && styles.inputFocado]}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setCamposFocados(f => ({ ...f, email: true }))}
            onBlur={() => setCamposFocados(f => ({ ...f, email: false }))}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="exemplo@email.com"
            placeholderTextColor="#9aa0a6"
          />

          <Text style={styles.label}>Senha *</Text>
          <TextInput
            style={[styles.input, camposFocados.senha && styles.inputFocado]}
            value={senha}
            onChangeText={setSenha}
            onFocus={() => setCamposFocados(f => ({ ...f, senha: true }))}
            onBlur={() => setCamposFocados(f => ({ ...f, senha: false }))}
            secureTextEntry
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#9aa0a6"
          />

          {/* Indicador de força da senha */}
          {senha.length > 0 && (
            <View style={styles.forca}>
              <View style={[
                styles.forcaBarra,
                senha.length >= 6 && /[A-Z]/.test(senha) && /[0-9]/.test(senha)
                  ? styles.forcaForte
                  : senha.length >= 6
                    ? styles.forcaMedia
                    : styles.forcaFraca
              ]} />
              <Text style={styles.forcaTexto}>
                {senha.length >= 6 && /[A-Z]/.test(senha) && /[0-9]/.test(senha)
                  ? '✓ Senha forte'
                  : senha.length >= 6
                    ? '⚠ Adicione maiúscula e número'
                    : '✗ Senha muito curta'}
              </Text>
            </View>
          )}

          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={[styles.input, camposFocados.telefone && styles.inputFocado]}
            value={telefone}
            onChangeText={(v) => setTelefone(mascaraTelefone(v))}
            onFocus={() => setCamposFocados(f => ({ ...f, telefone: true }))}
            onBlur={() => setCamposFocados(f => ({ ...f, telefone: false }))}
            keyboardType="phone-pad"
            placeholder="(81) 90000-0000"
            placeholderTextColor="#9aa0a6"
            maxLength={15}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleCadastro}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.buttonText}>CRIAR CONTA</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.linkContainer}
          >
            <Text style={styles.linkText}>Já tem conta? Voltar ao Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
    backgroundColor: '#fff',
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
    marginBottom: 16,
  },
  dicaContainer: {
    backgroundColor: '#e8f0fe',
    borderRadius: 6,
    padding: 10,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#1a73e8',
  },
  dicaText: {
    fontSize: 12,
    color: '#1a73e8',
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#5f6368',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#202124',
  },
  inputFocado: {
    borderColor: '#1a73e8',
    borderWidth: 1.5,
  },
  // Indicador de força da senha
  forca: {
    marginTop: -10,
    marginBottom: 16,
    gap: 4,
  },
  forcaBarra: {
    height: 3,
    borderRadius: 2,
    width: '100%',
  },
  forcaFraca:  { backgroundColor: '#d93025', width: '33%' },
  forcaMedia:  { backgroundColor: '#f9ab00', width: '66%' },
  forcaForte:  { backgroundColor: '#1e8e3e', width: '100%' },
  forcaTexto: {
    fontSize: 11,
    color: '#5f6368',
  },
  button: {
    backgroundColor: '#1a73e8',
    padding: 14,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { backgroundColor: '#9aa0a6' },
  buttonText: {
    color: '#fff',
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
  },
});