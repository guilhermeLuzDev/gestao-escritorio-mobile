import React from 'react';
import { ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './src/context/AuthContext';

import LoginScreen from './src/screens/LoginScreen';
import CadastroScreen from './src/screens/CadastroScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MovimentacaoFormScreen from './src/screens/MovimentacaoFormScreen';
import MovimentacaoListScreen from './src/screens/MovimentacaoListScreen';
import DetalhesMaterialScreen from './src/screens/DetalhesMaterialScreen';
import CadastroMaterialScreen from './src/screens/CadastroMaterialScreen';
import SolicitacoesPendentesScreen from './src/screens/SolicitacoesPendentesScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const headerPadrao = {
  headerStyle: { backgroundColor: '#1a73e8' },
  headerTintColor: '#ffffff',
  headerTitleAlign: 'center',
  headerTitleStyle: { fontWeight: 'bold' },
};

function SolicitacoesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SolicitacoesPendentes"
        component={SolicitacoesPendentesScreen}
        options={{ ...headerPadrao, title: 'Solicitações Pendentes' }}
      />
    </Stack.Navigator>
  );
}

function BotaoNovoMaterial({ navigation }) {
  const { usuario } = useAuth();

  if (!usuario) return null;
  if (usuario.role !== 'ROLE_ADM') return null;

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('CadastroMaterial')}
      style={{ marginRight: 12 }}
    >
      <Text style={{ color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 30 }}>+</Text>
    </TouchableOpacity>
  );
}

function MateriaisStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          ...headerPadrao,
          title: 'Materiais',
          headerBackVisible: false,
          headerRight: () => <BotaoNovoMaterial navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="Movimentacao"
        component={MovimentacaoFormScreen}
        options={{ ...headerPadrao, title: 'Transferir Material' }}
      />
      <Stack.Screen
        name="HistoricoMovimentacao"
        component={MovimentacaoListScreen}
        options={{ ...headerPadrao, title: 'Histórico' }}
      />
      <Stack.Screen
        name="DetalhesMaterial"
        component={DetalhesMaterialScreen}
        options={{ ...headerPadrao, title: 'Detalhes' }}
      />
      <Stack.Screen
        name="CadastroMaterial"
        component={CadastroMaterialScreen}
        options={{ ...headerPadrao, title: 'Novo Material' }}
      />
    </Stack.Navigator>
  );
}

function MovimentacoesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MovimentacaoList"
        component={MovimentacaoListScreen}
        options={{ ...headerPadrao, title: 'Movimentações' }}
        initialParams={{ materialId: 0, materialNome: 'Todas' }}
      />
    </Stack.Navigator>
  );
}

function PerfilStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="PerfilScreen"
        component={ProfileScreen}
        options={{ ...headerPadrao, title: 'Meu Perfil' }}
      />
    </Stack.Navigator>
  );
}

function ClienteTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1a73e8',
        tabBarInactiveTintColor: '#9aa0a6',
        tabBarStyle: { borderTopColor: '#dadce0' },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Materiais: 'cube-outline',
            Perfil: 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Materiais" component={MateriaisStack} />
      <Tab.Screen name="Perfil" component={PerfilStack} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1a73e8',
        tabBarInactiveTintColor: '#9aa0a6',
        tabBarStyle: { borderTopColor: '#dadce0' },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Materiais: 'cube-outline',
            'Movimentações': 'swap-horizontal-outline',
            Perfil: 'person-outline',
            'Solicitações': 'time-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Materiais" component={MateriaisStack} />
      <Tab.Screen name="Movimentações" component={MovimentacoesStack} />
      <Tab.Screen name="Solicitações" component={SolicitacoesStack} />
      <Tab.Screen name="Perfil" component={PerfilStack} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Cadastro" component={CadastroScreen} />
    </Stack.Navigator>
  );
}

function Routes() {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  if (!usuario) return <AuthStack />;
  if (usuario.role === 'ROLE_ADM') return <AdminTabs />;
  return <ClienteTabs />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Routes />
      </NavigationContainer>
    </AuthProvider>
  );
}