import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

export default function SpectateScreen() {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.icon}>👁️</Text>
                <Text style={styles.title}>Espectador</Text>
                <Text style={styles.subtitle}>Mira partidas en vivo</Text>
            </View>

            <View style={styles.placeholderCard}>
                <Text style={styles.placeholderIcon}>🎮</Text>
                <Text style={styles.placeholderTitle}>Próximamente</Text>
                <Text style={styles.placeholderDesc}>
                    El modo espectador en la app móvil está en desarrollo. 
                    Pronto podrás ver partidas en vivo desde tu teléfono.
                </Text>
                <View style={styles.featureList}>
                    <FeatureItem icon="📺" text="Ver partidas en tiempo real" />
                    <FeatureItem icon="📊" text="Estadísticas en vivo" />
                    <FeatureItem icon="🔔" text="Notificaciones de partidas" />
                </View>
            </View>
        </ScrollView>
    );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
    return (
        <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>{icon}</Text>
            <Text style={styles.featureText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        padding: Spacing.xl,
        paddingTop: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    icon: {
        fontSize: 48,
        marginBottom: Spacing.sm,
    },
    title: {
        fontSize: FontSize.xxl,
        fontWeight: '900',
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
    },
    placeholderCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xxl,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    placeholderIcon: {
        fontSize: 56,
        marginBottom: Spacing.lg,
    },
    placeholderTitle: {
        fontSize: FontSize.xl,
        fontWeight: '800',
        color: Colors.primary,
        marginBottom: Spacing.sm,
    },
    placeholderDesc: {
        fontSize: FontSize.md,
        color: Colors.textMuted,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: Spacing.xl,
    },
    featureList: {
        width: '100%',
        gap: Spacing.md,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        backgroundColor: Colors.surfaceLight,
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
    },
    featureIcon: {
        fontSize: 20,
    },
    featureText: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
});
