import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { BookOpen, KeyRound, Mail, ShieldAlert } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

interface LoginScreenProps {
  onNavigateRegister?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (loginEmail?: string, loginPassword?: string) => {
    const targetEmail = loginEmail || email;
    const targetPassword = loginPassword || password;
    if (!targetEmail || !targetPassword) { setErrorMsg('Please enter email and password'); return; }
    setLoading(true); setErrorMsg('');
    try { await login(targetEmail, targetPassword); }
    catch (err: any) { setErrorMsg(err.response?.data?.detail || 'Invalid login credentials.'); }
    finally { setLoading(false); }
  };

  const quickLogin = (role: 'student' | 'librarian' | 'admin') => {
    const creds = { student: ['student@institution.edu','student123'], librarian: ['librarian@institution.edu','librarian123'], admin: ['admin@institution.edu','admin123'] };
    const [e, p] = creds[role];
    setEmail(e); setPassword(p); handleLogin(e, p);
  };

  return (
    <ScrollView style={s.bg} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
      <View style={s.logoWrap}>
        <View style={s.logoBox}><BookOpen size={36} color="#14B8A6" /></View>
        <Text style={s.appTitle}>Smart LMS</Text>
        <Text style={s.appSub}>Higher Education Mobile Library Management System</Text>
      </View>

      {errorMsg ? (
        <View style={s.errorBox}>
          <ShieldAlert size={20} color="#DC2626" />
          <Text style={s.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      <View style={s.card}>
        <Text style={s.cardTitle}>Sign In to Your Account</Text>

        <Text style={s.label}>INSTITUTIONAL EMAIL</Text>
        <View style={s.inputRow}>
          <Mail size={18} color="#64748B" />
          <TextInput style={s.input} placeholder="e.g. alex@institution.edu" placeholderTextColor="#94A3B8" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        </View>

        <Text style={[s.label, { marginTop: 16 }]}>PASSWORD</Text>
        <View style={s.inputRow}>
          <KeyRound size={18} color="#64748B" />
          <TextInput style={s.input} placeholder="••••••••" placeholderTextColor="#94A3B8" value={password} onChangeText={setPassword} secureTextEntry />
        </View>

        <TouchableOpacity onPress={() => handleLogin()} disabled={loading} style={s.signInBtn}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.signInText}>Sign In</Text>}
        </TouchableOpacity>

        {onNavigateRegister && (
          <TouchableOpacity onPress={onNavigateRegister} style={s.switchBtn}>
            <Text style={s.switchText}>Don't have an account? Sign up</Text>
          </TouchableOpacity>
        )}

        <View style={s.demoBorder}>
          <Text style={s.demoLabel}>⚡ Quick Demo Auto-Login</Text>
          <View style={s.demoRow}>
            {(['student','librarian','admin'] as const).map(role => (
              <TouchableOpacity key={role} onPress={() => quickLogin(role)} style={s.demoBtn}>
                <Text style={[s.demoBtnText, { color: role === 'student' ? '#0D9488' : role === 'librarian' ? '#2563EB' : '#7C3AED' }]}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#F8FAFC' },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoBox: { width: 64, height: 64, backgroundColor: 'rgba(20,184,166,0.15)', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(20,184,166,0.3)', marginBottom: 12 },
  appTitle: { color: '#0F172A', fontSize: 30, fontWeight: '900' },
  appSub: { color: '#64748B', fontSize: 13, marginTop: 4, textAlign: 'center' },
  errorBox: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', padding: 16, borderRadius: 16, marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 12 },
  errorText: { color: '#991B1B', fontSize: 13, flex: 1 },
  card: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', padding: 24, borderRadius: 24, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 },
  cardTitle: { color: '#0F172A', fontSize: 18, fontWeight: '800', marginBottom: 16 },
  label: { color: '#64748B', fontSize: 10, fontWeight: '700', marginBottom: 8, letterSpacing: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  input: { flex: 1, color: '#0F172A', fontSize: 15 },
  signInBtn: { backgroundColor: '#0D9488', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  signInText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  switchBtn: { marginTop: 24, alignItems: 'center' },
  switchText: { color: '#0D9488', fontSize: 14, fontWeight: '600' },
  demoBorder: { marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  demoLabel: { color: '#64748B', fontSize: 10, fontWeight: '700', textAlign: 'center', marginBottom: 12, letterSpacing: 1 },
  demoRow: { flexDirection: 'row', gap: 8 },
  demoBtn: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1' },
  demoBtnText: { fontWeight: '800', fontSize: 12 },
});
