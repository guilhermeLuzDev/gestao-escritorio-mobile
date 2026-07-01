import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Animated,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focado, setFocado] = useState({ email: false, senha: false });

  const [toast, setToast] = useState({ visivel: false, tipo: 'info', mensagem: '' });
  const mostrarToast = (mensagem, tipo = 'erro') => setToast({ visivel: true, tipo, mensagem });

  // Animação de shake no botão quando falha
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !senha) {
      mostrarToast('Preencha todos os campos.', 'aviso');
      shake();
      return;
    }

    setLoading(true);
    try {
      await login(email, senha);
    } catch (error) {
      let mensagem = "E-mail ou senha inválidos.";
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        mensagem = "E-mail ou senha incorretos. Tente novamente.";
      } else if (error.response?.data?.message) {
        mensagem = error.response.data.message;
      } else if (error.message && error.message.includes("Network Error")) {
        mensagem = "Erro de conexão. Verifique se o servidor está rodando.";
      }

      mostrarToast(mensagem, 'erro');
      shake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Toast
        visivel={toast.visivel}
        tipo={toast.tipo}
        mensagem={toast.mensagem}
        onFechar={() => setToast(t => ({ ...t, visivel: false }))}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Cabeçalho azul com ícone */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="cube-outline" size={38} color="#fff" />
          </View>
          <Text style={styles.appNome}>Gestão de Materiais</Text>
          <Text style={styles.appSubtitulo}>Faça login para continuar</Text>
        </View>

        {/* Card do formulário */}
        <View style={styles.card}>

          {/* Campo e-mail */}
          <Text style={styles.label}>E-mail</Text>
          <View style={[styles.inputWrapper, focado.email && styles.inputWrapperFocado]}>
            <Ionicons
              name="mail-outline"
              size={18}
              color={focado.email ? '#1a73e8' : '#9aa0a6'}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocado(f => ({ ...f, email: true }))}
              onBlur={() => setFocado(f => ({ ...f, email: false }))}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="exemplo@email.com"
              placeholderTextColor="#9aa0a6"
              returnKeyType="next"
            />
          </View>

          {/* Campo senha */}
          <Text style={styles.label}>Senha</Text>
          <View style={[styles.inputWrapper, focado.senha && styles.inputWrapperFocado]}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={focado.senha ? '#1a73e8' : '#9aa0a6'}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={senha}
              onChangeText={setSenha}
              onFocus={() => setFocado(f => ({ ...f, senha: true }))}
              onBlur={() => setFocado(f => ({ ...f, senha: false }))}
              secureTextEntry={!senhaVisivel}
              placeholder="Digite a senha"
              placeholderTextColor="#9aa0a6"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              onPress={() => setSenhaVisivel(v => !v)}
              style={styles.olhoBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={senhaVisivel ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#9aa0a6"
              />
            </TouchableOpacity>
          </View>

          {/* Botão com shake */}
          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonInner}>
                  <Ionicons name="log-in-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.buttonText}>ENTRAR</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Cadastro')}
            style={styles.linkContainer}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>Não tem conta? </Text>
            <Text style={styles.linkDestaque}>Criar conta</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
  },

  // Cabeçalho
  header: {
    backgroundColor: '#1a73e8',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 48,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: -28,          // sobrepõe levemente o card
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  appNome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.3,
  },
  appSubtitulo: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    elevation: 6,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    zIndex: 1,
    marginBottom: 32,
  },

  // Labels e inputs
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5f6368',
    marginBottom: 6,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1.5,
    borderColor: '#dadce0',
    borderRadius: 10,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  inputWrapperFocado: {
    borderColor: '#1a73e8',
    backgroundColor: '#f0f6ff',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: '#202124',
  },
  olhoBtn: {
    padding: 4,
  },

  // Botão
  button: {
    backgroundColor: '#1a73e8',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
    elevation: 2,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonDisabled: {
    backgroundColor: '#9aa0a6',
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 1,
  },

  // Divisor
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#dadce0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#9aa0a6',
    fontSize: 13,
  },

  // Link
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    color: '#5f6368',
    fontSize: 14,
  },
  linkDestaque: {
    color: '#1a73e8',
    fontWeight: '700',
    fontSize: 14,
  },
});