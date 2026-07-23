import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { BookOpen, KeyRound, Mail, ShieldAlert, User, Briefcase, Hash } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

interface RegisterScreenProps {
  onNavigateLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigateLogin }) => {
  const { register } = useAuth();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password) {
      setErrorMsg('Please fill in all required fields');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      // Auto-generate student_staff_id as requested
      const generatedId = `STU${Math.floor(100000 + Math.random() * 900000)}`;
      
      const payload = {
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase(),
        password,
        role: 'STUDENT',
        department,
        student_staff_id: generatedId,
      };
      await register(payload);
    } catch (err: any) {
      const serverError = err.response?.data;
      if (typeof serverError === 'object' && serverError !== null) {
        // Extract first error message from dict if exists
        const firstKey = Object.keys(serverError)[0];
        const msg = serverError[firstKey];
        setErrorMsg(Array.isArray(msg) ? msg[0] : (msg || 'Registration failed.'));
      } else {
        setErrorMsg('An error occurred during registration.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.bg} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 48 }}>
      <View style={s.logoWrap}>
        <View style={s.logoBox}><BookOpen size={36} color="#14B8A6" /></View>
        <Text style={s.appTitle}>Create Account</Text>
        <Text style={s.appSub}>Join the Smart LMS platform</Text>
      </View>

      {errorMsg ? (
        <View style={s.errorBox}>
          <ShieldAlert size={20} color="#DC2626" />
          <Text style={s.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      <View style={s.card}>
        <Text style={s.label}>FIRST NAME</Text>
        <View style={s.inputRow}>
          <User size={18} color="#64748B" />
          <TextInput style={s.input} placeholder="e.g. Alex" placeholderTextColor="#94A3B8" value={firstName} onChangeText={setFirstName} />
        </View>

        <Text style={[s.label, { marginTop: 16 }]}>LAST NAME</Text>
        <View style={s.inputRow}>
          <User size={18} color="#64748B" />
          <TextInput style={s.input} placeholder="e.g. Smith" placeholderTextColor="#94A3B8" value={lastName} onChangeText={setLastName} />
        </View>

        <Text style={[s.label, { marginTop: 16 }]}>INSTITUTIONAL EMAIL</Text>
        <View style={s.inputRow}>
          <Mail size={18} color="#64748B" />
          <TextInput style={s.input} placeholder="e.g. alex@institution.edu" placeholderTextColor="#94A3B8" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        </View>

        <Text style={[s.label, { marginTop: 16 }]}>PASSWORD</Text>
        <View style={s.inputRow}>
          <KeyRound size={18} color="#64748B" />
          <TextInput style={s.input} placeholder="••••••••" placeholderTextColor="#94A3B8" value={password} onChangeText={setPassword} secureTextEntry />
        </View>
        
        <Text style={[s.label, { marginTop: 16 }]}>DEPARTMENT (OPTIONAL)</Text>
        <View style={s.inputRow}>
          <Briefcase size={18} color="#64748B" />
          <TextInput style={s.input} placeholder="e.g. Computer Science" placeholderTextColor="#94A3B8" value={department} onChangeText={setDepartment} />
        </View>

        <TouchableOpacity onPress={handleRegister} disabled={loading} style={s.signInBtn}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.signInText}>Register</Text>}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onNavigateLogin} style={s.switchBtn}>
          <Text style={s.switchText}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#F8FAFC' },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoBox: { width: 64, height: 64, backgroundColor: 'rgba(20,184,166,0.15)', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(20,184,166,0.3)', marginBottom: 12 },
  appTitle: { color: '#0F172A', fontSize: 26, fontWeight: '900' },
  appSub: { color: '#64748B', fontSize: 13, marginTop: 4, textAlign: 'center' },
  errorBox: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', padding: 16, borderRadius: 16, marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 12 },
  errorText: { color: '#991B1B', fontSize: 13, flex: 1 },
  card: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', padding: 24, borderRadius: 24, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 },
  label: { color: '#64748B', fontSize: 10, fontWeight: '700', marginBottom: 8, letterSpacing: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  input: { flex: 1, color: '#0F172A', fontSize: 15 },
  signInBtn: { backgroundColor: '#0D9488', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 28 },
  signInText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  switchBtn: { marginTop: 24, alignItems: 'center' },
  switchText: { color: '#0D9488', fontSize: 14, fontWeight: '600' },
});
