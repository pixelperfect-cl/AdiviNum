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
import { loginWithEmail } from '@/services/supabaseAuth';
import { api } from '@/services/apiClient';
import { useUserStore } from '@/stores/userStore';
import { connectSocket } from '@/services/socketService';

// Supabase is initialized on import

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Por favor ingresa tu email y contraseña');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 1. Supabase Auth login
            const sbUser = await loginWithEmail(email, password);

            // 2. Sync with backend (creates user + wallet if new)
            const { user, wallet } = await api.login();

            // 3. Update Zustand store
            useUserStore.getState().setUser(user);
            useUserStore.getState().setWallet(wallet);

            // 4. Connect WebSocket
            connectSocket(user.id);

            // 5. Navigate to main app
            router.replace('/(tabs)');
        } catch (err: any) {
            const errMsg = err?.message || 'Error al iniciar sesión';
            if (errMsg.includes('Invalid login credentials')) {
                setError('Credenciales inválidas');
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
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <Text style={styles.logoIcon}>🎲</Text>
                    <Text style={styles.logoText}>ADIVINUM</Text>
                    <Text style={styles.tagline}>El juego que no es para cualquiera</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
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
                            autoCorrect={false}
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

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleLogin}
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
                                <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => router.push('/(auth)/register')}
                    >
                        <Text style={styles.secondaryButtonText}>
                            ¿No tienes cuenta? <Text style={styles.linkText}>Regístrate</Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.footer}>Es para mentes despiertas.</Text>
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
    logoContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xxxl,
    },
    logoIcon: { fontSize: 64, marginBottom: Spacing.md },
    logoText: {
        fontSize: FontSize.display,
        fontWeight: '900',
        color: Colors.primary,
        letterSpacing: 4,
    },
    tagline: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginTop: Spacing.sm,
        fontStyle: 'italic',
    },
    form: { gap: Spacing.lg },
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
        paddingVertical: Spacing.md + 2,
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
    footer: {
        textAlign: 'center',
        fontSize: FontSize.xs,
        color: Colors.textMuted,
        marginTop: Spacing.xxxl,
        fontStyle: 'italic',
    },
});
