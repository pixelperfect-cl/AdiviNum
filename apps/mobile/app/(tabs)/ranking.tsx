import React from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { RANKS, getRankForElo } from '@adivinum/shared';

// Mock data for display
const mockLeaderboard = [
    { position: 1, username: 'MenteMaestra', eloRating: 2450, gamesWon: 342, country: '🇨🇱' },
    { position: 2, username: 'ElDeductor', eloRating: 2280, gamesWon: 298, country: '🇦🇷' },
    { position: 3, username: 'LoGiCo_X', eloRating: 2150, gamesWon: 275, country: '🇲🇽' },
    { position: 4, username: 'NumeroLetal', eloRating: 1980, gamesWon: 256, country: '🇨🇱' },
    { position: 5, username: 'FamaCazadora', eloRating: 1820, gamesWon: 231, country: '🇵🇪' },
    { position: 6, username: 'ToqueMaestro', eloRating: 1650, gamesWon: 198, country: '🇨🇴' },
    { position: 7, username: 'LaCalculadora', eloRating: 1490, gamesWon: 167, country: '🇧🇷' },
    { position: 8, username: 'CifrasX', eloRating: 1320, gamesWon: 145, country: '🇪🇸' },
    { position: 9, username: 'NúmeroVivo', eloRating: 1180, gamesWon: 120, country: '🇨🇱' },
    { position: 10, username: 'AdiviPro', eloRating: 1050, gamesWon: 98, country: '🇺🇾' },
];

export default function RankingScreen() {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>🏆 Ranking Global</Text>

            {/* Top 3 podium */}
            <View style={styles.podium}>
                {mockLeaderboard.slice(0, 3).map((player, idx) => {
                    const rank = getRankForElo(player.eloRating);
                    const medals = ['🥇', '🥈', '🥉'];
                    const sizes = [72, 60, 60];
                    return (
                        <View
                            key={player.position}
                            style={[
                                styles.podiumItem,
                                idx === 0 && styles.podiumFirst,
                            ]}
                        >
                            <Text style={{ fontSize: sizes[idx] / 2 }}>{medals[idx]}</Text>
                            <View style={[styles.avatar, { borderColor: rank.colorHex }]}>
                                <Text style={styles.avatarText}>{player.country}</Text>
                            </View>
                            <Text style={styles.podiumName}>{player.username}</Text>
                            <Text style={[styles.podiumRank, { color: rank.colorHex }]}>
                                {rank.name.split(' ').pop()}
                            </Text>
                            <Text style={styles.podiumElo}>{player.eloRating}</Text>
                        </View>
                    );
                })}
            </View>

            {/* Remaining players */}
            {mockLeaderboard.slice(3).map((player) => {
                const rank = getRankForElo(player.eloRating);
                return (
                    <View key={player.position} style={styles.row}>
                        <Text style={styles.rowPosition}>#{player.position}</Text>
                        <Text style={styles.rowFlag}>{player.country}</Text>
                        <View style={styles.rowInfo}>
                            <Text style={styles.rowName}>{player.username}</Text>
                            <Text style={[styles.rowRank, { color: rank.colorHex }]}>
                                {rank.name}
                            </Text>
                        </View>
                        <View style={styles.rowStats}>
                            <Text style={styles.rowElo}>{player.eloRating}</Text>
                            <Text style={styles.rowWins}>{player.gamesWon}W</Text>
                        </View>
                    </View>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { padding: Spacing.xl, paddingTop: 60, paddingBottom: 100 },
    title: {
        fontSize: FontSize.xxl,
        fontWeight: '900',
        color: Colors.textPrimary,
        marginBottom: Spacing.xl,
    },
    podium: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginBottom: Spacing.xxl,
        gap: Spacing.md,
    },
    podiumItem: {
        alignItems: 'center',
        flex: 1,
    },
    podiumFirst: {
        marginBottom: Spacing.lg,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.surface,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: Spacing.xs,
    },
    avatarText: { fontSize: 22 },
    podiumName: {
        fontSize: FontSize.sm,
        fontWeight: '700',
        color: Colors.textPrimary,
        textAlign: 'center',
    },
    podiumRank: {
        fontSize: FontSize.xs,
        fontWeight: '600',
    },
    podiumElo: {
        fontSize: FontSize.xs,
        color: Colors.textMuted,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    rowPosition: {
        fontSize: FontSize.md,
        fontWeight: '900',
        color: Colors.textMuted,
        width: 36,
    },
    rowFlag: { fontSize: 20, marginRight: Spacing.md },
    rowInfo: { flex: 1 },
    rowName: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    rowRank: {
        fontSize: FontSize.xs,
        fontWeight: '600',
    },
    rowStats: { alignItems: 'flex-end' },
    rowElo: {
        fontSize: FontSize.md,
        fontWeight: '900',
        color: Colors.primary,
    },
    rowWins: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
    },
});
