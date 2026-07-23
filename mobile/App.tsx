import React, { useState } from 'react';
import { StatusBar, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/presentation/context/AuthContext';
import { Header } from './src/presentation/components/Header';
import { AuthContainer } from './src/presentation/screens/auth/AuthContainer';
import { SmartCatalogScreen } from './src/presentation/screens/student/SmartCatalogScreen';
import { FinesAndPaymentsScreen } from './src/presentation/screens/student/FinesAndPaymentsScreen';
import { OperationsDashboardScreen } from './src/presentation/screens/librarian/OperationsDashboardScreen';
import { QRCheckoutScannerScreen } from './src/presentation/screens/librarian/QRCheckoutScannerScreen';
import { ReservationManagementScreen } from './src/presentation/screens/librarian/ReservationManagementScreen';
import { StrategicOverviewScreen } from './src/presentation/screens/admin/StrategicOverviewScreen';
import { InstitutionPoliciesScreen } from './src/presentation/screens/admin/InstitutionPoliciesScreen';
import { BookOpen, CreditCard, LayoutDashboard, QrCode, Clock, TrendingUp, Settings, Search, Bell } from 'lucide-react-native';

interface TabBtnProps {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  isLight?: boolean;
}

const TabBtn: React.FC<TabBtnProps> = ({ active, label, icon, onPress, isLight }) => (
  <TouchableOpacity onPress={onPress} style={isLight ? s.tabBtnLight : [s.tabBtn, active && s.tabBtnActive]}>
    <View style={[isLight && s.iconWrapLight, active && isLight && s.iconWrapLightActive]}>
      {icon}
    </View>
    <Text style={isLight ? [s.tabLabelLight, active && s.tabLabelLightActive] : [s.tabLabel, active && s.tabLabelActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const MainApp: React.FC = () => {
  const { user, logout } = useAuth();
  const [studentTab, setStudentTab] = useState<'SEARCH' | 'BOOKS' | 'SCAN' | 'ALERTS' | 'SETTINGS'>('SEARCH');
  const [librarianTab, setLibrarianTab] = useState<'SEARCH' | 'BOOKS' | 'SCAN' | 'ALERTS' | 'SETTINGS'>('SEARCH');
  const [adminTab, setAdminTab] = useState<'OVERVIEW' | 'POLICIES'>('OVERVIEW');

  if (!user) {
    return <AuthContainer />;
  }

  const isLightMode = user.role === 'STUDENT' || user.role === 'LIBRARIAN';

  const renderStudentContent = () => {
    switch (studentTab) {
      case 'ALERTS': return <FinesAndPaymentsScreen />;
      case 'SEARCH': default: return <SmartCatalogScreen />;
      // Books, Scan, Settings are placeholders for now that just render the catalog
    }
  };

  const renderLibrarianContent = () => {
    switch (librarianTab) {
      case 'SCAN': return <QRCheckoutScannerScreen />;
      case 'ALERTS': return <ReservationManagementScreen />;
      case 'SEARCH': default: return (
        <OperationsDashboardScreen
          onNavigateScanner={() => setLibrarianTab('SCAN')}
          onNavigateReservations={() => setLibrarianTab('ALERTS')}
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

  const activeLightTab = user.role === 'STUDENT' ? studentTab : librarianTab;
  const setLightTab = user.role === 'STUDENT' ? setStudentTab : setLibrarianTab;

  return (
    <SafeAreaView style={[s.container, isLightMode && { backgroundColor: '#F8FAFC' }]}>
      <StatusBar barStyle={isLightMode ? 'dark-content' : 'light-content'} backgroundColor={isLightMode ? '#F8FAFC' : '#0F172A'} />

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

      <View style={isLightMode ? s.navBarLight : s.navBar}>
        {isLightMode && (
          <>
            <TabBtn isLight active={activeLightTab === 'SEARCH'} label="Search" onPress={() => setLightTab('SEARCH')}
              icon={<Search size={22} color={activeLightTab === 'SEARCH' ? '#0F172A' : '#94A3B8'} />} />
            <TabBtn isLight active={activeLightTab === 'BOOKS'} label="Books" onPress={() => setLightTab('BOOKS')}
              icon={<BookOpen size={22} color={activeLightTab === 'BOOKS' ? '#0F172A' : '#94A3B8'} />} />
            <TabBtn isLight active={activeLightTab === 'SCAN'} label="Scan" onPress={() => setLightTab('SCAN')}
              icon={<QrCode size={22} color={activeLightTab === 'SCAN' ? '#0F172A' : '#94A3B8'} />} />
            <TabBtn isLight active={activeLightTab === 'ALERTS'} label="Alerts" onPress={() => setLightTab('ALERTS')}
              icon={<Bell size={22} color={activeLightTab === 'ALERTS' ? '#0F172A' : '#94A3B8'} />} />
            <TabBtn isLight active={activeLightTab === 'SETTINGS'} label="Settings" onPress={() => setLightTab('SETTINGS')}
              icon={<Settings size={22} color={activeLightTab === 'SETTINGS' ? '#0F172A' : '#94A3B8'} />} />
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
  
  // Dark Theme Navbar
  navBar: { backgroundColor: '#0F172A', borderTopWidth: 1, borderTopColor: '#1E293B', paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  tabBtn: { alignItems: 'center', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 12 },
  tabBtnActive: { backgroundColor: 'rgba(20,184,166,0.2)' },
  tabLabel: { fontSize: 10, fontWeight: '700', marginTop: 4, color: '#64748B' },
  tabLabelActive: { color: '#14B8A6' },

  // Light Theme Navbar
  navBarLight: { backgroundColor: '#F8FAFC', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  tabBtnLight: { alignItems: 'center', justifyContent: 'center' },
  iconWrapLight: { padding: 12, borderRadius: 999 },
  iconWrapLightActive: { backgroundColor: '#A7F3D0' },
  tabLabelLight: { fontSize: 10, fontWeight: '600', marginTop: 2, color: '#64748B' },
  tabLabelLightActive: { color: '#0F172A', fontWeight: '800' },
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
