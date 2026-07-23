import React, { useState } from 'react';
import { StatusBar, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/presentation/context/AuthContext';
import { Header } from './src/presentation/components/Header';
import { LoginScreen } from './src/presentation/screens/auth/LoginScreen';
import { SmartCatalogScreen } from './src/presentation/screens/student/SmartCatalogScreen';
import { FinesAndPaymentsScreen } from './src/presentation/screens/student/FinesAndPaymentsScreen';
import { OperationsDashboardScreen } from './src/presentation/screens/librarian/OperationsDashboardScreen';
import { QRCheckoutScannerScreen } from './src/presentation/screens/librarian/QRCheckoutScannerScreen';
import { ReservationManagementScreen } from './src/presentation/screens/librarian/ReservationManagementScreen';
import { StrategicOverviewScreen } from './src/presentation/screens/admin/StrategicOverviewScreen';
import { InstitutionPoliciesScreen } from './src/presentation/screens/admin/InstitutionPoliciesScreen';
import { BookOpen, CreditCard, LayoutDashboard, QrCode, Clock, TrendingUp, Settings } from 'lucide-react-native';

interface TabBtnProps {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}

const TabBtn: React.FC<TabBtnProps> = ({ active, label, icon, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[s.tabBtn, active && s.tabBtnActive]}>
    {icon}
    <Text style={[s.tabLabel, active && s.tabLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

const MainApp: React.FC = () => {
  const { user, logout } = useAuth();
  const [studentTab, setStudentTab] = useState<'CATALOG' | 'FINES'>('CATALOG');
  const [librarianTab, setLibrarianTab] = useState<'DASHBOARD' | 'SCANNER' | 'RESERVATIONS'>('DASHBOARD');
  const [adminTab, setAdminTab] = useState<'OVERVIEW' | 'POLICIES'>('OVERVIEW');

  if (!user) {
    return <LoginScreen />;
  }

  const renderStudentContent = () => {
    switch (studentTab) {
      case 'FINES': return <FinesAndPaymentsScreen />;
      case 'CATALOG': default: return <SmartCatalogScreen />;
    }
  };

  const renderLibrarianContent = () => {
    switch (librarianTab) {
      case 'SCANNER': return <QRCheckoutScannerScreen />;
      case 'RESERVATIONS': return <ReservationManagementScreen />;
      case 'DASHBOARD': default: return (
        <OperationsDashboardScreen
          onNavigateScanner={() => setLibrarianTab('SCANNER')}
          onNavigateReservations={() => setLibrarianTab('RESERVATIONS')}
        />
      );
    }
  };

  const renderAdminContent = () => {
    switch (adminTab) {
      case 'POLICIES': return <InstitutionPoliciesScreen />;
      case 'OVERVIEW': default: return <StrategicOverviewScreen />;
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <Header
        title={
          user.role === 'STUDENT' ? 'Smart Catalog & Services'
            : user.role === 'LIBRARIAN' ? 'Operations Portal'
            : 'Strategic Command'
        }
        subtitle={`Welcome back, ${user.name}`}
        onRoleSwitchClick={logout}
      />

      <View style={{ flex: 1 }}>
        {user.role === 'STUDENT' && renderStudentContent()}
        {user.role === 'LIBRARIAN' && renderLibrarianContent()}
        {user.role === 'ADMIN' && renderAdminContent()}
      </View>

      <View style={s.navBar}>
        {user.role === 'STUDENT' && (
          <>
            <TabBtn active={studentTab === 'CATALOG'} label="Smart Catalog" onPress={() => setStudentTab('CATALOG')}
              icon={<BookOpen size={20} color={studentTab === 'CATALOG' ? '#14B8A6' : '#64748B'} />} />
            <TabBtn active={studentTab === 'FINES'} label="Fines & Payments" onPress={() => setStudentTab('FINES')}
              icon={<CreditCard size={20} color={studentTab === 'FINES' ? '#14B8A6' : '#64748B'} />} />
          </>
        )}

        {user.role === 'LIBRARIAN' && (
          <>
            <TabBtn active={librarianTab === 'DASHBOARD'} label="Dashboard" onPress={() => setLibrarianTab('DASHBOARD')}
              icon={<LayoutDashboard size={20} color={librarianTab === 'DASHBOARD' ? '#14B8A6' : '#64748B'} />} />
            <TabBtn active={librarianTab === 'SCANNER'} label="QR Scanner" onPress={() => setLibrarianTab('SCANNER')}
              icon={<QrCode size={20} color={librarianTab === 'SCANNER' ? '#14B8A6' : '#64748B'} />} />
            <TabBtn active={librarianTab === 'RESERVATIONS'} label="Hold Queue" onPress={() => setLibrarianTab('RESERVATIONS')}
              icon={<Clock size={20} color={librarianTab === 'RESERVATIONS' ? '#14B8A6' : '#64748B'} />} />
          </>
        )}

        {user.role === 'ADMIN' && (
          <>
            <TabBtn active={adminTab === 'OVERVIEW'} label="Strategic Overview" onPress={() => setAdminTab('OVERVIEW')}
              icon={<TrendingUp size={20} color={adminTab === 'OVERVIEW' ? '#14B8A6' : '#64748B'} />} />
            <TabBtn active={adminTab === 'POLICIES'} label="Policy Rules" onPress={() => setAdminTab('POLICIES')}
              icon={<Settings size={20} color={adminTab === 'POLICIES' ? '#14B8A6' : '#64748B'} />} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  navBar: { backgroundColor: '#0F172A', borderTopWidth: 1, borderTopColor: '#1E293B', paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  tabBtn: { alignItems: 'center', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 12 },
  tabBtnActive: { backgroundColor: 'rgba(20,184,166,0.2)' },
  tabLabel: { fontSize: 10, fontWeight: '700', marginTop: 4, color: '#64748B' },
  tabLabelActive: { color: '#14B8A6' },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
