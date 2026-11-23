import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  Image
} from 'react-native';
import { useAuth, friendlyError } from '../context/AuthContext';
import { ALLOWED_DOMAIN, isAllowedEmail } from '../config/domain';

const INK = '#000';
const PAPER = '#fff';
const MUTED = '#666';
const LINE = '#cfcfcf';

function Field({ label, error, secure, ...props }) {
  const [hidden, setHidden] = useState(!!secure);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, !!error && styles.inputError]}>
        <TextInput
          style={styles.input}
          placeholderTextColor="#9a9a9a"
          secureTextEntry={hidden}
          autoCapitalize="none"
          {...props}
        />
        {secure && (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
            <Text style={styles.toggle}>{hidden ? 'Show' : 'Hide'}</Text>
          </Pressable>
        )}
      </View>
      {!!error && <Text style={styles.fieldError}>! {error}</Text>}
    </View>
  );
}

export default function AuthScreen() {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, authError } = useAuth();
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const isRegister = mode === 'register';

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setInfo('');
    setFieldErrors({});
  };

  const validate = () => {
    const e = {};
    if (isRegister && name.trim().length < 2) e.name = 'Enter your full name.';
    if (!email.trim()) e.email = 'Enter your email.';
    else if (!isAllowedEmail(email)) e.email = `Use your @${ALLOWED_DOMAIN} email.`;
    if (password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (isRegister && confirm !== password) e.confirm = 'Passwords do not match.';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const run = async (fn) => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      const msg = friendlyError(err);
      if (msg) setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const submit = () => {
    if (!validate()) return;
    run(async () => {
      if (isRegister) {
        const { needsVerification } = await registerWithEmail(name, email, password);
        if (needsVerification) {
          setInfo(`Account created. We sent a verification link to ${email.trim()}. Verify it, then log in.`);
          setPassword('');
          setConfirm('');
          setMode('login');
        }
      } else {
        await loginWithEmail(email, password);
      }
    });
  };

  const google = () => run(loginWithGoogle);

  return (
    <View style={[styles.root, wide && styles.rootWide]}>
      {wide && (
        <View style={styles.brandPanel}>
          <Text style={styles.brandName}>Fruit Shop</Text>
          <Text style={styles.brandSub}>Sign in with your @{ALLOWED_DOMAIN} account.</Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.formPanel}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            {!wide && <Text style={styles.mobileBrand}>Fruit Shop</Text>}
            <Text style={styles.title}>{isRegister ? 'Create account' : 'Log in'}</Text>
            <Text style={styles.subtitle}>
              {isRegister
                ? `You are what you Eat.`
                : 'Log in to continue.'}
            </Text>

            {!!(error || authError) && (
              <View style={styles.errorBox} accessibilityRole="alert">
                <Text style={styles.errorText}>{error || authError}</Text>
              </View>
            )}
            {!!info && (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>{info}</Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [styles.googleBtn, pressed && styles.pressed, loading && styles.disabled]}
              onPress={google}
              disabled={loading}
            >
              <View style={styles.gBadge}>
                <Image
                  source={require('../../assets/logo-google.png')}
                  style={styles.googleIcon}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.googleText}>Continue with Google</Text>
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.or}>or</Text>
              <View style={styles.line} />
            </View>

            {isRegister && (
              <Field
                label="Full name"
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                autoCapitalize="words"
                error={fieldErrors.name}
              />
            )}
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder={`you@${ALLOWED_DOMAIN}`}
              keyboardType="email-address"
              autoComplete="email"
              error={fieldErrors.email}
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              secure
              error={fieldErrors.password}
              onSubmitEditing={isRegister ? undefined : submit}
            />
            {isRegister && (
              <Field
                label="Confirm password"
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Repeat your password"
                secure
                error={fieldErrors.confirm}
                onSubmitEditing={submit}
              />
            )}

            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed, loading && styles.disabled]}
              onPress={submit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={PAPER} />
              ) : (
                <Text style={styles.primaryText}>{isRegister ? 'Create account' : 'Log in'}</Text>
              )}
            </Pressable>

            <View style={styles.switchRow}>
              <Text style={styles.switchText}>
                {isRegister ? 'Already have an account?' : 'New here?'}
              </Text>
              <Pressable onPress={() => switchMode(isRegister ? 'login' : 'register')} disabled={loading}>
                <Text style={styles.switchLink}>{isRegister ? 'Log in' : 'Create an account'}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PAPER },
  rootWide: { flexDirection: 'row' },

  brandPanel: { flex: 1, backgroundColor: INK, justifyContent: 'flex-end', padding: 64 },
  brandName: { color: PAPER, fontSize: 56, fontWeight: '800', letterSpacing: -1.5 },
  brandSub: { color: '#bdbdbd', fontSize: 15, marginTop: 12 },

  formPanel: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 400 },

  mobileBrand: { color: INK, fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 28 },
  title: { fontSize: 28, fontWeight: '700', color: INK },
  subtitle: { fontSize: 15, color: MUTED, marginTop: 6, marginBottom: 24, lineHeight: 21 },

  errorBox: { borderWidth: 1, borderColor: INK, borderLeftWidth: 4, padding: 12, borderRadius: 4, marginBottom: 16, backgroundColor: PAPER },
  errorText: { color: INK, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  infoBox: { borderWidth: 1, borderColor: LINE, padding: 12, borderRadius: 4, marginBottom: 16, backgroundColor: '#f4f4f4' },
  infoText: { color: INK, fontSize: 14, lineHeight: 20 },

  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 48, borderRadius: 6, borderWidth: 1, borderColor: INK, backgroundColor: PAPER },
  gBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: PAPER, alignItems: 'center', justifyContent: 'center' },
  googleIcon: { width: 16, height: 16 },
  googleText: { fontSize: 15, fontWeight: '600', color: INK },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: LINE },
  or: { color: MUTED, fontSize: 13 },

  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: INK, marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: PAPER, borderWidth: 1, borderColor: LINE, borderRadius: 6, paddingHorizontal: 14, height: 48 },
  inputError: { borderColor: INK, borderWidth: 2 },
  input: { flex: 1, fontSize: 15, color: INK, height: '100%', ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null) },
  toggle: { color: INK, fontSize: 13, fontWeight: '600', marginLeft: 8 },
  fieldError: { color: INK, fontSize: 12, fontWeight: '600', marginTop: 5 },

  primaryBtn: { height: 48, borderRadius: 6, backgroundColor: INK, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryText: { color: PAPER, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },

  switchRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 24 },
  switchText: { color: MUTED, fontSize: 14 },
  switchLink: { color: INK, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
});