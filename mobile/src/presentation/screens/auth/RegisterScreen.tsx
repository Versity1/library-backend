import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Platform, Modal } from 'react-native';
import { Landmark, User, Mail, Lock, Eye, EyeOff, Building2, ChevronDown, ArrowRight, ArrowLeft, ShieldAlert, Check, CreditCard, BookOpen } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

interface RegisterScreenProps {
  onNavigateLogin: () => void;
}

const DEPARTMENTS = [
  'Computer Science',
  'Literature & Arts',
  'Mathematics & Statistics',
  'Engineering & Technology',
  'Business & Economics',
  'Medicine & Health Sciences',
];

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigateLogin }) => {
  const { register } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      setErrorMsg('Please fill in all required fields');
      return;
    }
    if (!agreed) {
      setErrorMsg('Please agree to the Terms of Service & Privacy Policy');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || 'Student';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    try {
      const generatedId = studentId || `2024-${Math.floor(100 + Math.random() * 900)}`;
      
      const payload = {
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase(),
        password,
        role: 'STUDENT',
        department: department || 'Computer Science',
        student_staff_id: generatedId,
      };
      await register(payload);
    } catch (err: any) {
      const serverError = err.response?.data;
      if (typeof serverError === 'object' && serverError !== null) {
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
    <ScrollView style={s.bg} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 40 }}>
      {errorMsg ? (
        <View style={s.errorBox}>
          <ShieldAlert size={20} color="#DC2626" />
          <Text style={s.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      <View style={s.card}>
        {/* Centered Logo Section */}
        <View style={s.logoRow}>
          <BookOpen size={30} color="#0A192F" />
          <Text style={s.logoTitle}>Shelfie</Text>
        </View>
        <Text style={s.regTitle}>Student Registration</Text>
        <Text style={s.regSub}>Create an account to access digital archives and physical collections.</Text>

        {/* Field 1: Full Name */}
        <Text style={s.fieldLabel}>Full Name</Text>
        <View style={s.inputBox}>
          <User size={18} color="#64748B" style={s.inputIcon} />
          <TextInput 
            style={s.input} 
            placeholder="Jane Doe" 
            placeholderTextColor="#94A3B8" 
            value={fullName} 
            onChangeText={setFullName} 
          />
        </View>

        {/* Field 2: Student ID */}
        <Text style={[s.fieldLabel, { marginTop: 16 }]}>Student ID</Text>
        <View style={s.inputBox}>
          <CreditCard size={18} color="#64748B" style={s.inputIcon} />
          <TextInput 
            style={s.input} 
            placeholder="e.g., 2024-001" 
            placeholderTextColor="#94A3B8" 
            value={studentId} 
            onChangeText={setStudentId} 
          />
        </View>

        {/* Field 3: University Email */}
        <Text style={[s.fieldLabel, { marginTop: 16 }]}>University Email</Text>
        <View style={s.inputBox}>
          <Mail size={18} color="#64748B" style={s.inputIcon} />
          <TextInput 
            style={s.input} 
            placeholder="jane.doe@university.edu" 
            placeholderTextColor="#94A3B8" 
            value={email} 
            onChangeText={setEmail} 
            autoCapitalize="none" 
            keyboardType="email-address" 
          />
        </View>

        {/* Field 4: Department */}
        <Text style={[s.fieldLabel, { marginTop: 16 }]}>Department</Text>
        <TouchableOpacity onPress={() => setShowDeptModal(true)} style={s.inputBox} activeOpacity={0.8}>
          <Building2 size={18} color="#64748B" style={s.inputIcon} />
          <Text style={[s.input, !department && { color: '#94A3B8' }]}>
            {department || 'Select Department'}
          </Text>
          <ChevronDown size={18} color="#64748B" />
        </TouchableOpacity>

        {/* Field 5: Password */}
        <Text style={[s.fieldLabel, { marginTop: 16 }]}>Password</Text>
        <View style={s.inputBox}>
          <Lock size={18} color="#64748B" style={s.inputIcon} />
          <TextInput 
            style={s.input} 
            placeholder="••••••••" 
            placeholderTextColor="#94A3B8" 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry={!showPassword} 
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? <Eye size={18} color="#64748B" /> : <EyeOff size={18} color="#64748B" />}
          </TouchableOpacity>
        </View>
        <Text style={s.helpText}>Must be at least 8 characters.</Text>

        {/* Checkbox */}
        <TouchableOpacity onPress={() => setAgreed(!agreed)} style={s.checkboxRow} activeOpacity={0.8}>
          <View style={[s.checkbox, agreed && s.checkboxChecked]}>
            {agreed && <Check size={14} color="#FFF" />}
          </View>
          <Text style={s.checkboxText}>
            I agree to the <Text style={s.linkText}>Library Terms of Service</Text> and <Text style={s.linkText}>Privacy Policy</Text>.
          </Text>
        </TouchableOpacity>

        {/* Primary Button */}
        <TouchableOpacity onPress={handleRegister} disabled={loading} style={s.primaryBtn} activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={s.primaryBtnText}>Register Account</Text>
              <ArrowRight size={18} color="#FFF" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>

        {/* Secondary Button */}
        <TouchableOpacity onPress={onNavigateLogin} style={s.secondaryBtn} activeOpacity={0.8}>
          <ArrowLeft size={18} color="#0A192F" style={{ marginRight: 8 }} />
          <Text style={s.secondaryBtnText}>Back to Login</Text>
        </TouchableOpacity>
      </View>

      {/* Department Selector Modal */}
      <Modal visible={showDeptModal} transparent animationType="fade">
        <TouchableOpacity style={s.deptModalOverlay} activeOpacity={1} onPress={() => setShowDeptModal(false)}>
          <View style={s.deptModalBox}>
            <Text style={s.deptModalTitle}>Select Department</Text>
            {DEPARTMENTS.map((dept) => (
              <TouchableOpacity key={dept} onPress={() => { setDepartment(dept); setShowDeptModal(false); }} style={s.deptItem}>
                <Text style={[s.deptItemText, department === dept && { color: '#0A192F', fontWeight: '700' }]}>{dept}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#F0F4F8' },

  errorBox: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', padding: 14, borderRadius: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  errorText: { color: '#991B1B', fontSize: 13, flex: 1 },

  card: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 24, paddingVertical: 32, shadowColor: '#0A192F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 },

  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 },
  logoTitle: { color: '#0A192F', fontSize: 26, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  regTitle: { color: '#0A192F', fontSize: 28, fontWeight: '700', textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginTop: 4, marginBottom: 12 },
  regSub: { color: '#475569', fontSize: 13, textAlign: 'center', marginBottom: 28, lineHeight: 18 },

  fieldLabel: { color: '#0F172A', fontSize: 13, fontWeight: '700', marginBottom: 8 },

  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, paddingHorizontal: 12, height: 44 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#0F172A', fontSize: 14 },
  helpText: { color: '#64748B', fontSize: 12, marginTop: 6 },

  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 20, gap: 10 },
  checkbox: { width: 18, height: 18, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkboxChecked: { backgroundColor: '#0A192F', borderColor: '#0A192F' },
  checkboxText: { flex: 1, color: '#475569', fontSize: 13, lineHeight: 18 },
  linkText: { color: '#0A192F', fontWeight: '700' },

  primaryBtn: { flexDirection: 'row', backgroundColor: '#0A192F', height: 48, borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  secondaryBtn: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#0A192F', height: 48, borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  secondaryBtnText: { color: '#0A192F', fontWeight: '700', fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  deptModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  deptModalBox: { backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
  deptModalTitle: { fontSize: 18, fontWeight: '700', color: '#0A192F', marginBottom: 16, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  deptItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  deptItemText: { fontSize: 15, color: '#475569' },
});
