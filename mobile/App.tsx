import React, { useState } from 'react';
import { StatusBar, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/presentation/context/AuthContext';
import { Header } from './src/presentation/components/Header';
import { AuthContainer } from './src/presentation/screens/auth/AuthContainer';
import { SmartCatalogScreen } from './src/presentation/screens/student/SmartCatalogScreen';
import { StudentBooksScreen } from './src/presentation/screens/student/StudentBooksScreen';
import { FinesAndPaymentsScreen } from './src/presentation/screens/student/FinesAndPaymentsScreen';
import { StudentProfileScreen } from './src/presentation/screens/student/StudentProfileScreen';
import { OperationsDashboardScreen } from './src/presentation/screens/librarian/OperationsDashboardScreen';
import { LibrarianInventoryScreen } from './src/presentation/screens/librarian/LibrarianInventoryScreen';
import { ScannerScreen } from './src/presentation/screens/shared/ScannerScreen';
import { ReservationManagementScreen } from './src/presentation/screens/librarian/ReservationManagementScreen';
import { StrategicOverviewScreen } from './src/presentation/screens/admin/StrategicOverviewScreen';
import { InstitutionPoliciesScreen } from './src/presentation/screens/admin/InstitutionPoliciesScreen';
import { AdminUserManagementScreen } from './src/presentation/screens/admin/AdminUserManagementScreen';
import { AdminSystemSettingsScreen } from './src/presentation/screens/admin/AdminSystemSettingsScreen';
import { BookOpen, CreditCard, LayoutDashboard, QrCode, Clock, TrendingUp, Settings, Search, Bell, User, Users, ShieldCheck } from 'lucide-react-native';

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
  const [studentTab, setStudentTab] = useState<'SEARCH' | 'BOOKS' | 'SCAN' | 'ALERTS' | 'PROFILE'>('SEARCH');
  const [librarianTab, setLibrarianTab] = useState<'SEARCH' | 'BOOKS' | 'SCAN' | 'ALERTS' | 'SETTINGS'>('SEARCH');
  const [adminTab, setAdminTab] = useState<'OVERVIEW' | 'POLICIES' | 'USERS' | 'BOOKS' | 'SYSTEM'>('OVERVIEW');

  if (!user) {
    return <AuthContainer />;
  }

  const isLightMode = true;

  const renderStudentContent = () => {
    switch (studentTab) {
      case 'BOOKS': return <StudentBooksScreen />;
      case 'SCAN': return <ScannerScreen />;
      case 'ALERTS': return <FinesAndPaymentsScreen />;
      case 'PROFILE': return <StudentProfileScreen />;
      case 'SEARCH': default: return <SmartCatalogScreen onNavigateScan={() => setStudentTab('SCAN')} />;
    }
  };

  const renderLibrarianContent = () => {
    switch (librarianTab) {
      case 'BOOKS': return <LibrarianInventoryScreen />;
      case 'SCAN': return <ScannerScreen />;
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
      case 'USERS': return <AdminUserManagementScreen />;
      case 'BOOKS': return <LibrarianInventoryScreen />;
      case 'SYSTEM': return <AdminSystemSettingsScreen />;
      case 'OVERVIEW': default: return <StrategicOverviewScreen />;
    }
  };

  const activeLightTab = user.role === 'STUDENT' ? studentTab : user.role === 'LIBRARIAN' ? librarianTab : adminTab;
  const setLightTab = user.role === 'STUDENT' ? setStudentTab : setLibrarianTab;

  return (
    <SafeAreaView style={[s.container, isLightMode && { backgroundColor: '#F8FAFC' }]}>
      <StatusBar barStyle={isLightMode ? 'dark-content' : 'light-content'} backgroundColor={isLightMode ? '#F8FAFC' : '#0F172A'} />

      <Header
        title={
          user.role === 'STUDENT' ? 'Smart Catalog & Services'
            : user.role === 'LIBRARIAN' ? 'Operations Portal'
            : 'Admin Dashboard'
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
        {isLightMode && user.role === 'LIBRARIAN' && (
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
        {isLightMode && user.role === 'STUDENT' && (
          <>
            <TabBtn isLight active={studentTab === 'SEARCH'} label="Search" onPress={() => setStudentTab('SEARCH')}
              icon={<Search size={22} color={studentTab === 'SEARCH' ? '#0F172A' : '#94A3B8'} />} />
            <TabBtn isLight active={studentTab === 'BOOKS'} label="Books" onPress={() => setStudentTab('BOOKS')}
              icon={<BookOpen size={22} color={studentTab === 'BOOKS' ? '#0F172A' : '#94A3B8'} />} />
            <TabBtn isLight active={studentTab === 'SCAN'} label="Scan" onPress={() => setStudentTab('SCAN')}
              icon={<QrCode size={22} color={studentTab === 'SCAN' ? '#0F172A' : '#94A3B8'} />} />
            <TabBtn isLight active={studentTab === 'ALERTS'} label="Alerts" onPress={() => setStudentTab('ALERTS')}
              icon={<Bell size={22} color={studentTab === 'ALERTS' ? '#0F172A' : '#94A3B8'} />} />
            <TabBtn isLight active={studentTab === 'PROFILE'} label="Profile" onPress={() => setStudentTab('PROFILE')}
              icon={<User size={22} color={studentTab === 'PROFILE' ? '#0F172A' : '#94A3B8'} />} />
          </>
        )}

        {isLightMode && user.role === 'ADMIN' && (
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <TabBtn isLight active={activeLightTab === 'OVERVIEW'} label="Dashboard" onPress={() => setAdminTab('OVERVIEW')}
              icon={<TrendingUp size={22} color={activeLightTab === 'OVERVIEW' ? '#0F172A' : '#94A3B8'} />} />
            <TabBtn isLight active={activeLightTab === 'USERS'} label="Users" onPress={() => setAdminTab('USERS')}
              icon={<Users size={22} color={activeLightTab === 'USERS' ? '#0F172A' : '#94A3B8'} />} />
            <TabBtn isLight active={activeLightTab === 'BOOKS'} label="Books" onPress={() => setAdminTab('BOOKS')}
              icon={<BookOpen size={22} color={activeLightTab === 'BOOKS' ? '#0F172A' : '#94A3B8'} />} />
            <TabBtn isLight active={activeLightTab === 'POLICIES'} label="Policies" onPress={() => setAdminTab('POLICIES')}
              icon={<ShieldCheck size={22} color={activeLightTab === 'POLICIES' ? '#0F172A' : '#94A3B8'} />} />
            <TabBtn isLight active={activeLightTab === 'SYSTEM'} label="System" onPress={() => setAdminTab('SYSTEM')}
              icon={<Settings size={22} color={activeLightTab === 'SYSTEM' ? '#0F172A' : '#94A3B8'} />} />
          </View>
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
