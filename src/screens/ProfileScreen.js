import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Modal
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { usuario, logout } = useAuth();
  const [modalSair, setModalSair] = useState(false);

  const isAdm = usuario?.role === 'ROLE_ADM';

  return (
    <View style={styles.container}>

      {/* Modal de confirmação de logout */}
      <Modal visible={modalSair} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Sair da conta</Text>
            <Text style={styles.modalMensagem}>Tem certeza que deseja sair?</Text>
            <View style={styles.modalBotoes}>
              <TouchableOpacity
                style={styles.btnCancelar}
                onPress={() => setModalSair(false)}
              >
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnConfirmar}
                onPress={logout}
              >
                <Text style={styles.btnConfirmarText}>Sair</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.card}>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {usuario?.nome?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>

        <Text style={styles.nome}>{usuario?.nome ?? '—'}</Text>

        <View style={[styles.badge, isAdm ? styles.badgeAdm : styles.badgeCliente]}>
          <Text style={styles.badgeText}>
            {isAdm ? 'Administrador' : 'Cliente'}
          </Text>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.btnLogout}
          onPress={() => setModalSair(true)}
        >
          <Text style={styles.btnLogoutText}>SAIR DA CONTA</Text>
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
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dadce0',
    padding: 32,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: { fontSize: 34, color: '#fff', fontWeight: 'bold' },
  nome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#202124',
    marginBottom: 10,
    textAlign: 'center',
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeAdm: { backgroundColor: '#e8f0fe', borderWidth: 1, borderColor: '#1a73e8' },
  badgeCliente: { backgroundColor: '#e6f4ea', borderWidth: 1, borderColor: '#34a853' },
  badgeText: { fontSize: 13, fontWeight: '600', color: '#202124' },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#f1f3f4',
    marginVertical: 24,
  },
  btnLogout: {
    width: '100%',
    backgroundColor: '#fce8e6',
    padding: 14,
    borderRadius: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d93025',
  },
  btnLogoutText: { color: '#d93025', fontWeight: 'bold', fontSize: 15 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 32,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  modalTitulo: {
    fontSize: 17,
    fontWeight: '700',
    color: '#202124',
    marginBottom: 8,
  },
  modalMensagem: {
    fontSize: 14,
    color: '#5f6368',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalBotoes: { flexDirection: 'row', gap: 12 },
  btnCancelar: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dadce0',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  btnCancelarText: { color: '#5f6368', fontWeight: '600', fontSize: 14 },
  btnConfirmar: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#d93025',
    alignItems: 'center',
  },
  btnConfirmarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});