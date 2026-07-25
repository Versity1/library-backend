import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Platform, Alert } from 'react-native';
import { BookOpen, Mail, Lock, Eye, EyeOff, ArrowLeft, ShieldAlert, KeyRound, CheckCircle2 } from 'lucide-react-native';
import { apiClient } from '../../../core/utils/http';
import { API_ENDPOINTS } from '../../../core/constants/api';

interface ForgotPasswordScreenProps {
  onNavigateLogin: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onNavigateLogin }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Step 1: Request Password Reset OTP
  const handleRequestOtp = async () => {
    if (!identifier.trim()) {
      setErrorMsg('Please enter your email or Student/Staff ID');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await apiClient.post(API_ENDPOINTS.AUTH.PASSWORD_RESET_REQUEST, {
        identifier: identifier.trim(),
      });
      setSuccessMsg(res.data?.message || 'Verification code sent to your email.');
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm Password Reset with OTP & New Password
  const handleConfirmReset = async () => {
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit OTP verification code');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await apiClient.post(API_ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM, {
        identifier: identifier.trim(),
        otp_code: otpCode.trim(),
        new_password: newPassword,
      });

      Alert.alert(
        'Password Reset Complete! 🎉',
        res.data?.message || 'Your password has been successfully reset. You can now log in.',
        [{ text: 'Go to Login', onPress: onNavigateLogin }]
      );
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Invalid or expired OTP code. Please check and try again.');
    } finally {
      setLoading(false);
    }
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
        {/* Error Alert */}
        {errorMsg ? (
          <View style={s.errorBox}>
            <ShieldAlert size={20} color="#DC2626" />
            <Text style={s.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Success Alert */}
        {successMsg ? (
          <View style={s.successBox}>
            <CheckCircle2 size={20} color="#16A34A" />
            <Text style={s.successText}>{successMsg}</Text>
          </View>
        ) : null}

        {/* Main Card */}
        <View style={s.card}>
          <View style={s.iconBadge}>
            <KeyRound size={28} color="#0A192F" />
          </View>

          <Text style={s.title}>{step === 1 ? 'Reset Password' : 'Enter Verification Code'}</Text>
          <Text style={s.sub}>
            {step === 1
              ? 'Enter your registered email address or Student ID to receive a 6-digit verification code.'
              : `Enter the 6-digit code sent for "${identifier}" and create your new password.`}
          </Text>

          {/* STEP 1 FORM */}
          {step === 1 ? (
            <>
              <Text style={s.fieldLabel}>Email or Student / Staff ID</Text>
              <View style={s.inputBox}>
                <Mail size={20} color="#64748B" style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="e.g. alex@institution.edu or 2024-042"
                  placeholderTextColor="#94A3B8"
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity onPress={handleRequestOtp} disabled={loading} style={s.actionBtn} activeOpacity={0.8}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.actionBtnText}>Send Verification Code</Text>}
              </TouchableOpacity>
            </>
          ) : (
            /* STEP 2 FORM */
            <>
              <Text style={s.fieldLabel}>6-Digit OTP Code</Text>
              <View style={s.inputBox}>
                <KeyRound size={20} color="#64748B" style={s.inputIcon} />
                <TextInput
                  style={[s.input, { letterSpacing: 4, fontWeight: '700' }]}
                  placeholder="123456"
                  placeholderTextColor="#94A3B8"
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              <Text style={[s.fieldLabel, { marginTop: 16 }]}>New Password</Text>
              <View style={s.inputBox}>
                <Lock size={20} color="#64748B" style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                  {showPassword ? <Eye size={20} color="#64748B" /> : <EyeOff size={20} color="#64748B" />}
                </TouchableOpacity>
              </View>

              <Text style={[s.fieldLabel, { marginTop: 16 }]}>Confirm New Password</Text>
              <View style={s.inputBox}>
                <Lock size={20} color="#64748B" style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>

              <TouchableOpacity onPress={handleConfirmReset} disabled={loading} style={s.actionBtn} activeOpacity={0.8}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.actionBtnText}>Reset Password</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setStep(1)} style={{ alignSelf: 'center', marginTop: 16 }}>
                <Text style={{ color: '#2563EB', fontSize: 13, fontWeight: '600' }}>Resend Code / Change Identifier</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Back to Login Button */}
          <TouchableOpacity onPress={onNavigateLogin} style={s.backBtn} activeOpacity={0.8}>
            <ArrowLeft size={18} color="#0A192F" style={{ marginRight: 8 }} />
            <Text style={s.backBtnText}>Back to Login</Text>
          </TouchableOpacity>
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

  successBox: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0', padding: 14, borderRadius: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  successText: { color: '#166534', fontSize: 13, flex: 1 },

  card: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 24, paddingVertical: 32, shadowColor: '#0A192F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 },
  iconBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
  title: { color: '#0A192F', fontSize: 24, fontWeight: '700', textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 8 },
  sub: { color: '#475569', fontSize: 13, textAlign: 'center', marginBottom: 28, lineHeight: 18 },

  fieldLabel: { color: '#0F172A', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, paddingHorizontal: 12, height: 46 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#0F172A', fontSize: 14 },
  eyeBtn: { padding: 4 },

  actionBtn: { backgroundColor: '#0A192F', height: 48, borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  actionBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  backBtn: { flexDirection: 'row', height: 48, borderWidth: 1, borderColor: '#0A192F', borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', marginTop: 24 },
  backBtnText: { color: '#0A192F', fontWeight: '700', fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
});
