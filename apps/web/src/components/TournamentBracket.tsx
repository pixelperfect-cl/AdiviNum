import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface BracketMatch {
    roundNumber: number;
    matchIndex: number;
    playerA: { id: string; username: string } | null;
    playerB: { id: string; username: string } | null;
    winnerId: string | null;
    completedAt: string | null;
}

interface TournamentBracketProps {
    tournamentId: string;
}

export function TournamentBracket({ tournamentId }: TournamentBracketProps) {
    const [matches, setMatches] = useState<BracketMatch[]>([]);
    const [tournamentName, setTournamentName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBracket();
    }, [tournamentId]);

    const loadBracket = async () => {
        try {
            const data = await api.get<any>(`/tournaments/${tournamentId}`);
            setMatches(data.matches || []);
            setTournamentName(data.name || '');
        } catch (err) {
            console.error('Failed to load bracket:', err);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <div className="spinner" />
                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Cargando bracket...</p>
            </div>
        );
    }

    // Group matches by round
    const rounds = new Map<number, BracketMatch[]>();
    matches.forEach(m => {
        const existing = rounds.get(m.roundNumber) || [];
        existing.push(m);
        rounds.set(m.roundNumber, existing);
    });

    const totalRounds = Math.max(...Array.from(rounds.keys()), 0);
    const roundNames = getRoundNames(totalRounds);

    return (
        <div className="bracket-container">
            {tournamentName && (
                <h3 className="bracket-title">🏆 {tournamentName}</h3>
            )}
            <div className="bracket-scroll">
                <div className="bracket">
                    {Array.from(rounds.entries())
                        .sort(([a], [b]) => a - b)
                        .map(([roundNum, roundMatches]) => (
                            <div key={roundNum} className="bracket-round">
                                <div className="bracket-round__title">
                                    {roundNames[roundNum - 1] || `Ronda ${roundNum}`}
                                </div>
                                <div className="bracket-round__matches">
                                    {roundMatches
                                        .sort((a, b) => a.matchIndex - b.matchIndex)
                                        .map((match) => (
                                            <BracketMatchCard
                                                key={`${match.roundNumber}-${match.matchIndex}`}
                                                match={match}
                                            />
                                        ))}
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}

function BracketMatchCard({ match }: { match: BracketMatch }) {
    const isComplete = !!match.winnerId;
    const playerAWon = match.winnerId === match.playerA?.id;
    const playerBWon = match.winnerId === match.playerB?.id;

    return (
        <div className={`bracket-match ${isComplete ? 'bracket-match--done' : ''}`}>
            <div className={`bracket-player ${playerAWon ? 'bracket-player--winner' : ''} ${match.playerA && !playerAWon && isComplete ? 'bracket-player--loser' : ''}`}>
                <span className="bracket-player__name">
                    {match.playerA?.username || 'TBD'}
                </span>
                {playerAWon && <span className="bracket-player__crown">👑</span>}
            </div>
            <div className="bracket-vs">VS</div>
            <div className={`bracket-player ${playerBWon ? 'bracket-player--winner' : ''} ${match.playerB && !playerBWon && isComplete ? 'bracket-player--loser' : ''}`}>
                <span className="bracket-player__name">
                    {match.playerB?.username || 'TBD'}
                </span>
                {playerBWon && <span className="bracket-player__crown">👑</span>}
            </div>
        </div>
    );
}

function getRoundNames(total: number): string[] {
    if (total <= 0) return [];
    const names: string[] = [];
    for (let i = 1; i <= total; i++) {
        if (i === total) names.push('🏆 Final');
        else if (i === total - 1) names.push('Semifinal');
        else if (i === total - 2) names.push('Cuartos');
        else names.push(`Ronda ${i}`);
    }
    return names;
}
