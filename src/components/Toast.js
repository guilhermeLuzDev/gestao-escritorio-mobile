import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TIPOS = {
  sucesso: { cor: '#1e7e34', fundo: '#d4edda', borda: '#c3e6cb', icone: 'checkmark-circle' },
  erro:    { cor: '#721c24', fundo: '#f8d7da', borda: '#f5c6cb', icone: 'alert-circle'     },
  aviso:   { cor: '#856404', fundo: '#fff3cd', borda: '#ffeeba', icone: 'warning'           },
  info:    { cor: '#004085', fundo: '#cce5ff', borda: '#b8daff', icone: 'information-circle'},
};

export default function Toast({ visivel, tipo = 'info', mensagem, onFechar, duracao = 3500 , offsetTop = 56 }) {
  const opacidade  = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visivel) {
      Animated.parallel([
        Animated.spring(opacidade,    { toValue: 1, useNativeDriver: true, speed: 20 }),
        Animated.spring(translateY,   { toValue: 0, useNativeDriver: true, speed: 20 }),
      ]).start();
      const timer = setTimeout(() => fechar(), duracao);
      return () => clearTimeout(timer);
    }
  }, [visivel]);

  const fechar = () => {
    Animated.parallel([
      Animated.timing(opacidade,  { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -20, duration: 250, useNativeDriver: true }),
    ]).start(() => onFechar && onFechar());
  };

  if (!visivel) return null;
  const estilo = TIPOS[tipo] || TIPOS.info;

  return (
    <Animated.View style={[styles.container, { opacity: opacidade, transform: [{ translateY }] }]}>
      <View style={[styles.toast, { backgroundColor: estilo.fundo, borderColor: estilo.borda }]}>
        <Ionicons name={estilo.icone} size={20} color={estilo.cor} style={styles.icone} />
        <Text style={[styles.mensagem, { color: estilo.cor }]} numberOfLines={3}>
          {mensagem}
        </Text>
        <TouchableOpacity onPress={fechar} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={18} color={estilo.cor} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
  },
  icone:    { marginRight: 10 },
  mensagem: { flex: 1, fontSize: 14, fontWeight: '500', lineHeight: 20 },
});