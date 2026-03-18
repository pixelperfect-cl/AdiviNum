import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { registerWithEmail } from '@/services/supabaseAuth';
import { api } from '@/services/apiClient';
import { useUserStore } from '@/stores/userStore';
import { connectSocket } from '@/services/socketService';

export default function RegisterScreen() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async () => {
        if (!username || !email || !password) {
            setError('Todos los campos son obligatorios');
            return;
        }
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        if (username.length < 3) {
            setError('El nombre de usuario debe tener al menos 3 caracteres');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 1. Create Supabase account
            const sbUser = await registerWithEmail(email, password);

            // 2. Register with backend (creates user + wallet)
            await api.register({ email, username });

            // 3. Sync with backend
            const { user, wallet } = await api.login();

            // 4. Apply referral code if provided
            if (referralCode.trim()) {
                try {
                    await api.applyReferralCode(user.id, referralCode.trim());
                } catch (refErr) {
                    // Non-blocking — continue even if referral fails
                    console.warn('Referral code failed:', refErr);
                }
            }

            // 5. Update store + connect socket
            useUserStore.getState().setUser(user);
            useUserStore.getState().setWallet(wallet);
            connectSocket(user.id);

            // 6. Navigate
            router.replace('/(tabs)');
        } catch (err: any) {
            const errMsg = err?.message || 'Error al registrarse';
            if (errMsg.includes('already registered')) {
                setError('Ya existe una cuenta con este email');
            } else if (errMsg.includes('Password should be')) {
                setError('La contraseña es muy débil');
            } else {
                setError(errMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#0A0E1A', '#111827', '#1A1040']}
            style={styles.container}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.inner}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Crear Cuenta</Text>
                    <Text style={styles.subtitle}>Únete a la batalla de mentes</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Nombre de usuario</Text>
                        <TextInput
                            style={styles.input}
                            value={username}
                            onChangeText={setUsername}
                            placeholder="MenteMaestra_99"
                            placeholderTextColor={Colors.textMuted}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="tu@email.com"
                            placeholderTextColor={Colors.textMuted}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Contraseña</Text>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            placeholderTextColor={Colors.textMuted}
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Confirmar contraseña</Text>
                        <TextInput
                            style={styles.input}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="••••••••"
                            placeholderTextColor={Colors.textMuted}
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Código de referido (opcional)</Text>
                        <TextInput
                            style={styles.input}
                            value={referralCode}
                            onChangeText={setReferralCode}
                            placeholder="ADIV1234"
                            placeholderTextColor={Colors.textMuted}
                            autoCapitalize="characters"
                        />
                    </View>

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleRegister}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#FFD700', '#F59E0B']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            {loading ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Text style={styles.primaryButtonText}>Crear Cuenta</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.secondaryButtonText}>
                            ¿Ya tienes cuenta? <Text style={styles.linkText}>Inicia sesión</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    inner: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
    },
    header: { alignItems: 'center', marginBottom: Spacing.xxl },
    title: {
        fontSize: FontSize.xxl,
        fontWeight: '900',
        color: Colors.primary,
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
    form: { gap: Spacing.md },
    inputContainer: { gap: Spacing.xs },
    label: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        fontSize: FontSize.md,
        color: Colors.textPrimary,
    },
    error: {
        color: Colors.error,
        fontSize: FontSize.sm,
        textAlign: 'center',
    },
    primaryButton: {
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        marginTop: Spacing.sm,
    },
    gradientButton: {
        paddingVertical: Spacing.lg,
        alignItems: 'center',
        borderRadius: BorderRadius.md,
    },
    primaryButtonText: {
        fontSize: FontSize.lg,
        fontWeight: '800',
        color: '#000',
        letterSpacing: 1,
    },
    secondaryButton: {
        alignItems: 'center',
        paddingVertical: Spacing.md,
    },
    secondaryButtonText: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
    },
    linkText: {
        color: Colors.primary,
        fontWeight: '700',
    },
});
