import { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { requestOtp, useAccount, verifyOtp } from '../src/account';
import { useI18n } from '../src/i18n';
import { usePalette, type Palette } from '../src/theme';

export default function LoginScreen() {
  const { t } = useI18n();
  const p = usePalette();
  const styles = useMemo(() => makeStyles(p), [p]);
  const insets = useSafeAreaInsets();
  const { signIn } = useAccount();
  const [phone, setPhone] = useState('+998 ');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const sendCode = async () => {
    setIsBusy(true);
    setError(null);
    const result = await requestOtp(phone).catch(() => ({ ok: false, error: t.signInError }));
    setIsBusy(false);
    if (!result.ok) return setError(result.error ?? t.signInError);
    setDevCode('devCode' in result && result.devCode ? result.devCode : null);
    setStep('code');
  };

  const confirm = async () => {
    setIsBusy(true);
    setError(null);
    const result = await verifyOtp(phone, code).catch(() => ({ reason: 'error' }));
    if ('token' in result) {
      await signIn(result.token);
      setIsBusy(false);
      return close();
    }
    setIsBusy(false);
    const messages: Record<string, string> = { invalid: t.codeInvalid, expired: t.codeExpired, locked: t.codeLocked };
    setError(messages[result.reason] ?? t.signInError);
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.head}>
        <Pressable onPress={close} accessibilityRole="button" accessibilityLabel={t.close} hitSlop={10}>
          <Ionicons name="close" size={26} color={p.ink} />
        </Pressable>
      </View>
      <View style={styles.body}>
        <View style={styles.badge}>
          <Ionicons name="person-circle-outline" size={40} color={p.accent} />
        </View>
        <Text style={styles.title} accessibilityRole="header">{t.signInTitle}</Text>
        <Text style={styles.lead}>{step === 'phone' ? t.signInBody : `${t.codeSentTo} ${phone}`}</Text>

        {step === 'phone' ? (
          <>
            <Text style={styles.label}>{t.phoneLabel}</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              placeholder="+998 90 123 45 67"
              placeholderTextColor={p.muted}
              accessibilityLabel={t.phoneLabel}
              autoFocus
            />
            <Pressable style={[styles.primary, isBusy && styles.disabled]} onPress={() => void sendCode()} disabled={isBusy} accessibilityRole="button">
              {isBusy ? <ActivityIndicator color={p.onInk} /> : <Text style={styles.primaryText}>{t.getCode}</Text>}
            </Pressable>
          </>
        ) : (
          <>
            {devCode && <Text style={styles.notice}>{t.devCode} {devCode}</Text>}
            <Text style={styles.label}>{t.codeLabel}</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={code}
              onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              autoComplete="sms-otp"
              textContentType="oneTimeCode"
              maxLength={6}
              accessibilityLabel={t.codeLabel}
              autoFocus
            />
            <Pressable
              style={[styles.primary, (isBusy || code.length !== 6) && styles.disabled]}
              onPress={() => void confirm()}
              disabled={isBusy || code.length !== 6}
              accessibilityRole="button"
            >
              {isBusy ? <ActivityIndicator color={p.onInk} /> : <Text style={styles.primaryText}>{t.confirm}</Text>}
            </Pressable>
            <Pressable onPress={() => setStep('phone')} accessibilityRole="button" style={styles.ghost}>
              <Text style={styles.ghostText}>{t.changeNumber}</Text>
            </Pressable>
          </>
        )}
        {error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (p: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: p.paper, paddingHorizontal: 20 },
    head: { alignItems: 'flex-end' },
    body: { flex: 1, justifyContent: 'center', gap: 12, maxWidth: 440, width: '100%', alignSelf: 'center' },
    badge: { width: 64, height: 64, borderRadius: 32, backgroundColor: p.wash, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    title: { fontSize: 30, fontWeight: '700', color: p.ink, letterSpacing: -0.8 },
    lead: { fontSize: 15, lineHeight: 22, color: p.body, marginBottom: 12 },
    label: { fontSize: 13, color: p.muted, fontWeight: '600' },
    input: { height: 54, borderRadius: 14, borderWidth: 1, borderColor: p.line, paddingHorizontal: 16, fontSize: 18, color: p.ink, backgroundColor: p.wash },
    codeInput: { fontSize: 26, letterSpacing: 10, textAlign: 'center', fontVariant: ['tabular-nums'] },
    primary: { height: 54, borderRadius: 14, backgroundColor: p.ink, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    primaryText: { color: p.onInk, fontSize: 16, fontWeight: '700' },
    disabled: { opacity: 0.45 },
    ghost: { height: 44, alignItems: 'center', justifyContent: 'center' },
    ghostText: { color: p.body, fontSize: 15, fontWeight: '600' },
    notice: { padding: 12, borderRadius: 12, backgroundColor: p.wash, color: p.body },
    error: { color: '#d64545', fontSize: 14 },
  });
