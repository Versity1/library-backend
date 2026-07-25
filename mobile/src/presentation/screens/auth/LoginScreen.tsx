import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { User, Lock, Eye, EyeOff, GraduationCap, ShieldAlert, BookOpen } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

interface LoginScreenProps {
  onNavigateRegister?: () => void;
  onNavigateForgotPassword?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateRegister, onNavigateForgotPassword }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <ScrollView style={s.bg} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 48, paddingBottom: 32 }}>
      {/* Top App Header / Centered Logo */}
      <View style={s.headerWrap}>
        <View style={s.logoRow}>
          <BookOpen size={28} color="#0A192F" />
          <Text style={s.topHeaderTitle}>Shelfie</Text>
        </View>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', marginVertical: 20 }}>
        {errorMsg ? (
          <View style={s.errorBox}>
            <ShieldAlert size={20} color="#DC2626" />
            <Text style={s.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Card Container */}
        <View style={s.card}>
          <Text style={s.welcomeTitle}>Welcome Back</Text>
          <Text style={s.welcomeSub}>Access your digital and physical collections.</Text>

          {/* Email or Student ID Field */}
          <Text style={s.fieldLabel}>Email or Student ID</Text>
          <View style={s.inputBox}>
            <User size={20} color="#64748B" style={s.inputIcon} />
            <TextInput 
              style={s.input} 
              placeholder="e.g. 12345678 or name@domain.edu" 
              placeholderTextColor="#94A3B8" 
              value={email} 
              onChangeText={setEmail} 
              autoCapitalize="none" 
              keyboardType="email-address" 
            />
          </View>

          {/* Password Field */}
          <View style={s.passwordLabelRow}>
            <Text style={s.fieldLabel}>Password</Text>
            <TouchableOpacity onPress={onNavigateForgotPassword}>
              <Text style={s.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
          <View style={s.inputBox}>
            <Lock size={20} color="#64748B" style={s.inputIcon} />
            <TextInput 
              style={s.input} 
              placeholder="••••••••" 
              placeholderTextColor="#94A3B8" 
              value={password} 
              onChangeText={setPassword} 
              secureTextEntry={!showPassword} 
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
              {showPassword ? <Eye size={20} color="#64748B" /> : <EyeOff size={20} color="#64748B" />}
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity onPress={() => handleLogin()} disabled={loading} style={s.signInBtn} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.signInBtnText}>Sign In</Text>}
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Register Button */}
          {onNavigateRegister && (
            <TouchableOpacity onPress={onNavigateRegister} style={s.registerBtn} activeOpacity={0.8}>
              <GraduationCap size={20} color="#0A192F" style={{ marginRight: 8 }} />
              <Text style={s.registerBtnText}>Register as Student</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Demo Section */}
        <View style={s.demoBorder}>
          <Text style={s.demoLabel}>⚡ QUICK DEMO LOGINS</Text>
          <View style={s.demoRow}>
            {(['student','librarian','admin'] as const).map(role => (
              <TouchableOpacity key={role} onPress={() => quickLogin(role)} style={s.demoBtn}>
                <Text style={[s.demoBtnText, { color: role === 'student' ? '#0A192F' : role === 'librarian' ? '#2563EB' : '#7C3AED' }]}>
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
  bg: { flex: 1, backgroundColor: '#F0F4F8' },
  headerWrap: { alignItems: 'center', justifyContent: 'center', width: '100%', paddingBottom: 16 },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  topHeaderTitle: { color: '#0A192F', fontSize: 26, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  
  errorBox: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', padding: 14, borderRadius: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  errorText: { color: '#991B1B', fontSize: 13, flex: 1 },

  card: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 24, paddingVertical: 32, shadowColor: '#0A192F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 },
  welcomeTitle: { color: '#0A192F', fontSize: 28, fontWeight: '700', textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 8 },
  welcomeSub: { color: '#475569', fontSize: 14, textAlign: 'center', marginBottom: 28 },

  fieldLabel: { color: '#0F172A', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  passwordLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 8 },
  forgotText: { color: '#475569', fontSize: 12, fontWeight: '600' },

  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, paddingHorizontal: 12, height: 46 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#0F172A', fontSize: 14, fontStyle: 'italic' },
  eyeBtn: { padding: 4 },

  signInBtn: { backgroundColor: '#0A192F', height: 48, borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  signInBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { marginHorizontal: 16, color: '#64748B', fontSize: 13 },

  registerBtn: { flexDirection: 'row', height: 48, borderWidth: 1, borderColor: '#0A192F', borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  registerBtnText: { color: '#0A192F', fontWeight: '700', fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  demoBorder: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  demoLabel: { color: '#64748B', fontSize: 10, fontWeight: '700', textAlign: 'center', marginBottom: 10, letterSpacing: 1 },
  demoRow: { flexDirection: 'row', gap: 8 },
  demoBtn: { flex: 1, backgroundColor: '#FFFFFF', paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1' },
  demoBtnText: { fontWeight: '700', fontSize: 12 },
});
