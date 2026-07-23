import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

const variantStyles: Record<string, { bg: string; text: string; border: string }> = {
  success: { bg: '#064E3B', text: '#6EE7B7', border: '#065F46' },
  warning: { bg: '#78350F', text: '#FCD34D', border: '#92400E' },
  danger: { bg: '#4C0519', text: '#FDA4AF', border: '#9F1239' },
  info: { bg: '#042F2E', text: '#5EEAD4', border: '#115E59' },
  neutral: { bg: '#1E293B', text: '#CBD5E1', border: '#334155' },
};

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'info' }) => {
  const v = variantStyles[variant] || variantStyles.info;
  return (
    <View style={[s.badge, { backgroundColor: v.bg, borderColor: v.border }]}>
      <Text style={[s.badgeText, { color: v.text }]}>{label}</Text>
    </View>
  );
};

const s = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
