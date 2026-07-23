import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { BookOpen, KeyRound, Mail, ShieldAlert } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

export const LoginScreen: React.FC = () => {
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
          <ShieldAlert size={20} color="#FB7185" />
          <Text style={s.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      <View style={s.card}>
        <Text style={s.cardTitle}>Sign In to Your Account</Text>

        <Text style={s.label}>INSTITUTIONAL EMAIL</Text>
        <View style={s.inputRow}>
          <Mail size={18} color="#64748B" />
          <TextInput style={s.input} placeholder="e.g. alex@institution.edu" placeholderTextColor="#475569" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        </View>

        <Text style={[s.label, { marginTop: 16 }]}>PASSWORD</Text>
        <View style={s.inputRow}>
          <KeyRound size={18} color="#64748B" />
          <TextInput style={s.input} placeholder="••••••••" placeholderTextColor="#475569" value={password} onChangeText={setPassword} secureTextEntry />
        </View>

        <TouchableOpacity onPress={() => handleLogin()} disabled={loading} style={s.signInBtn}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.signInText}>Sign In</Text>}
        </TouchableOpacity>

        <View style={s.demoBorder}>
          <Text style={s.demoLabel}>⚡ Quick Demo Auto-Login</Text>
          <View style={s.demoRow}>
            {(['student','librarian','admin'] as const).map(role => (
              <TouchableOpacity key={role} onPress={() => quickLogin(role)} style={s.demoBtn}>
                <Text style={[s.demoBtnText, { color: role === 'student' ? '#2DD4BF' : role === 'librarian' ? '#60A5FA' : '#A78BFA' }]}>
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
  bg: { flex: 1, backgroundColor: '#020617' },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoBox: { width: 64, height: 64, backgroundColor: 'rgba(20,184,166,0.2)', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(20,184,166,0.4)', marginBottom: 12 },
  appTitle: { color: '#FFF', fontSize: 30, fontWeight: '900' },
  appSub: { color: '#94A3B8', fontSize: 13, marginTop: 4, textAlign: 'center' },
  errorBox: { backgroundColor: 'rgba(159,18,57,0.4)', borderWidth: 1, borderColor: 'rgba(251,113,133,0.5)', padding: 16, borderRadius: 16, marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 12 },
  errorText: { color: '#FECDD3', fontSize: 13, flex: 1 },
  card: { backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B', padding: 24, borderRadius: 24 },
  cardTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginBottom: 16 },
  label: { color: '#94A3B8', fontSize: 10, fontWeight: '700', marginBottom: 8, letterSpacing: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#020617', borderWidth: 1, borderColor: '#1E293B', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  input: { flex: 1, color: '#FFF', fontSize: 15 },
  signInBtn: { backgroundColor: '#0D9488', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  signInText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  demoBorder: { marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#1E293B' },
  demoLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '700', textAlign: 'center', marginBottom: 12, letterSpacing: 1 },
  demoRow: { flexDirection: 'row', gap: 8 },
  demoBtn: { flex: 1, backgroundColor: '#1E293B', paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  demoBtnText: { fontWeight: '800', fontSize: 12 },
});
