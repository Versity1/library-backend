import React, { useState } from 'react';
import { StatusBar, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/presentation/context/AuthContext';
import { Header } from './src/presentation/components/Header';
import { AuthContainer } from './src/presentation/screens/auth/AuthContainer';
import { SplashScreen } from './src/presentation/screens/auth/SplashScreen';
import { SmartCatalogScreen } from './src/presentation/screens/student/SmartCatalogScreen';
import { StudentBooksScreen } from './src/presentation/screens/student/StudentBooksScreen';
import { StudentProfileScreen } from './src/presentation/screens/student/StudentProfileScreen';
import { OperationsDashboardScreen } from './src/presentation/screens/librarian/OperationsDashboardScreen';
import { LibrarianInventoryScreen } from './src/presentation/screens/librarian/LibrarianInventoryScreen';
import { StudentManagementScreen } from './src/presentation/screens/librarian/StudentManagementScreen';
import { ReservationManagementScreen } from './src/presentation/screens/librarian/ReservationManagementScreen';
import { ScannerScreen } from './src/presentation/screens/shared/ScannerScreen';
import { StrategicOverviewScreen } from './src/presentation/screens/admin/StrategicOverviewScreen';
import { InstitutionPoliciesScreen } from './src/presentation/screens/admin/InstitutionPoliciesScreen';
import { AdminUserManagementScreen } from './src/presentation/screens/admin/AdminUserManagementScreen';
import { AdminSystemSettingsScreen } from './src/presentation/screens/admin/AdminSystemSettingsScreen';
import { BookOpen, Bookmark, QrCode, User, Search, Bell, Settings, TrendingUp, Users, ShieldCheck, LayoutGrid, Archive } from 'lucide-react-native';

interface TabBtnProps {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}

const TabBtn: React.FC<TabBtnProps> = ({ active, label, icon, onPress }) => (
  <TouchableOpacity onPress={onPress} style={s.tabBtnContainer} activeOpacity={0.7}>
    <View style={s.iconWrap}>
      {icon}
    </View>
    <Text style={[s.tabLabel, active && s.tabLabelActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const MainApp: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [studentTab, setStudentTab] = useState<'CATALOG' | 'MY_BOOKS' | 'SCAN' | 'PROFILE'>('MY_BOOKS');
  const [librarianTab, setLibrarianTab] = useState<'REQUESTS' | 'INVENTORY' | 'USERS' | 'PROFILE'>('REQUESTS');
  const [adminTab, setAdminTab] = useState<'OVERVIEW' | 'POLICIES' | 'USERS' | 'BOOKS' | 'SYSTEM'>('OVERVIEW');

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Still checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
        <BookOpen size={48} color="#14B8A6" />
      </View>
    );
  }

  // Show splash onboarding before login
  if (!user && showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (!user) {
    return <AuthContainer />;
  }

  const isLightMode = user.role === 'STUDENT' || user.role === 'LIBRARIAN';

  const renderStudentContent = () => {
    switch (studentTab) {
      case 'CATALOG': 
        return <SmartCatalogScreen onNavigateScan={() => setStudentTab('SCAN')} />;
      case 'MY_BOOKS': 
        return (
          <StudentBooksScreen 
            onNavigateScan={() => setStudentTab('SCAN')} 
            onNavigateCatalog={() => setStudentTab('CATALOG')} 
          />
        );
      case 'SCAN': 
        return <ScannerScreen />;
      case 'PROFILE': 
        return <StudentProfileScreen />;
      default: 
        return <StudentBooksScreen onNavigateScan={() => setStudentTab('SCAN')} onNavigateCatalog={() => setStudentTab('CATALOG')} />;
    }
  };

  const renderLibrarianContent = () => {
    switch (librarianTab) {
      case 'REQUESTS':
        return <ReservationManagementScreen />;
      case 'INVENTORY': 
        return <LibrarianInventoryScreen />;
      case 'USERS': 
        return <StudentManagementScreen />;
      case 'PROFILE': 
        return <StudentProfileScreen />;
      default: 
        return <ReservationManagementScreen />;
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

  const getHeaderTitle = () => {
    if (user.role === 'STUDENT') return 'Shelfie';
    if (user.role === 'LIBRARIAN') {
      if (librarianTab === 'REQUESTS') return 'Borrowing Requests';
      if (librarianTab === 'INVENTORY') return 'Inventory Management';
      if (librarianTab === 'USERS') return 'Student Management';
      return 'Librarian Profile';
    }
    if (adminTab === 'OVERVIEW') return 'Executive Overview';
    if (adminTab === 'POLICIES') return 'Institution Policies';
    if (adminTab === 'USERS') return 'User Accounts & Roles';
    if (adminTab === 'BOOKS') return 'Catalog Management';
    if (adminTab === 'SYSTEM') return 'System Settings & Logs';
    return 'Shelfie Admin';
  };

  return (
    <SafeAreaView style={[s.container, isLightMode && { backgroundColor: '#F8FAFC' }]}>
      <StatusBar barStyle={isLightMode ? 'dark-content' : 'light-content'} backgroundColor={isLightMode ? '#F8FAFC' : '#0F172A'} />

      <Header
        title={getHeaderTitle()}
        subtitle={`Welcome back, ${user.first_name}`}
        onRoleSwitchClick={logout}
      />

      <View style={{ flex: 1 }}>
        {user.role === 'STUDENT' && renderStudentContent()}
        {user.role === 'LIBRARIAN' && renderLibrarianContent()}
        {user.role === 'ADMIN' && renderAdminContent()}
      </View>

      {/* Student Bottom Navigation Bar */}
      {user.role === 'STUDENT' && (
        <View style={s.lightNavBar}>
          <TabBtn 
            active={studentTab === 'CATALOG'} 
            label="Catalog" 
            onPress={() => setStudentTab('CATALOG')}
            icon={<BookOpen size={22} color={studentTab === 'CATALOG' ? '#0A192F' : '#94A3B8'} />} 
          />
          <TabBtn 
            active={studentTab === 'MY_BOOKS'} 
            label="My Books" 
            onPress={() => setStudentTab('MY_BOOKS')}
            icon={<Bookmark size={22} color={studentTab === 'MY_BOOKS' ? '#0A192F' : '#94A3B8'} />} 
          />
          <TabBtn 
            active={studentTab === 'SCAN'} 
            label="Scan" 
            onPress={() => setStudentTab('SCAN')}
            icon={<QrCode size={22} color={studentTab === 'SCAN' ? '#0A192F' : '#94A3B8'} />} 
          />
          <TabBtn 
            active={studentTab === 'PROFILE'} 
            label="Profile" 
            onPress={() => setStudentTab('PROFILE')}
            icon={<User size={22} color={studentTab === 'PROFILE' ? '#0A192F' : '#94A3B8'} />} 
          />
        </View>
      )}

      {/* Librarian Bottom Navigation Bar matching Screenshots 1, 2, 3 */}
      {user.role === 'LIBRARIAN' && (
        <View style={s.lightNavBar}>
          <TabBtn 
            active={librarianTab === 'REQUESTS'} 
            label="Requests" 
            onPress={() => setLibrarianTab('REQUESTS')}
            icon={<Bookmark size={22} color={librarianTab === 'REQUESTS' ? '#0A192F' : '#94A3B8'} />} 
          />
          <TabBtn 
            active={librarianTab === 'INVENTORY'} 
            label="Inventory" 
            onPress={() => setLibrarianTab('INVENTORY')}
            icon={<Archive size={22} color={librarianTab === 'INVENTORY' ? '#0A192F' : '#94A3B8'} />} 
          />
          <TabBtn 
            active={librarianTab === 'USERS'} 
            label="Users" 
            onPress={() => setLibrarianTab('USERS')}
            icon={<Users size={22} color={librarianTab === 'USERS' ? '#0A192F' : '#94A3B8'} />} 
          />
          <TabBtn 
            active={librarianTab === 'PROFILE'} 
            label="Profile" 
            onPress={() => setLibrarianTab('PROFILE')}
            icon={<User size={22} color={librarianTab === 'PROFILE' ? '#0A192F' : '#94A3B8'} />} 
          />
        </View>
      )}

      {user.role === 'ADMIN' && (
        <View style={s.navBar}>
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <TabBtn active={adminTab === 'OVERVIEW'} label="Dashboard" onPress={() => setAdminTab('OVERVIEW')}
              icon={<TrendingUp size={22} color={adminTab === 'OVERVIEW' ? '#14B8A6' : '#94A3B8'} />} />
            <TabBtn active={adminTab === 'USERS'} label="Users" onPress={() => setAdminTab('USERS')}
              icon={<Users size={22} color={adminTab === 'USERS' ? '#14B8A6' : '#94A3B8'} />} />
            <TabBtn active={adminTab === 'BOOKS'} label="Books" onPress={() => setAdminTab('BOOKS')}
              icon={<BookOpen size={22} color={adminTab === 'BOOKS' ? '#14B8A6' : '#94A3B8'} />} />
            <TabBtn active={adminTab === 'POLICIES'} label="Policies" onPress={() => setAdminTab('POLICIES')}
              icon={<ShieldCheck size={22} color={adminTab === 'POLICIES' ? '#14B8A6' : '#94A3B8'} />} />
            <TabBtn active={adminTab === 'SYSTEM'} label="System" onPress={() => setAdminTab('SYSTEM')}
              icon={<Settings size={22} color={adminTab === 'SYSTEM' ? '#14B8A6' : '#94A3B8'} />} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },

  // Light Theme Navbar (Student & Librarian)
  lightNavBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#0A192F',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 4,
  },

  tabBtnContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconWrap: { marginBottom: 2 },
  tabLabel: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  tabLabelActive: { color: '#0A192F', fontWeight: '800' },

  // Dark Theme Navbar
  navBar: { backgroundColor: '#0F172A', borderTopWidth: 1, borderTopColor: '#1E293B', paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
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
