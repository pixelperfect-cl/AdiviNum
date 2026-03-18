import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TournamentService } from './tournament.service';
import { CurrencyType } from '@prisma/client';

/**
 * Automatically schedules recurring tournaments.
 *
 * Templates define what tournaments get created automatically.
 * The scheduler checks every 30 minutes and creates tournaments
 * when they're due according to their schedule.
 */

interface TournamentTemplate {
    name: string;
    description: string;
    schedule: 'daily' | 'weekly';
    hour: number;          // UTC hour to start
    dayOfWeek?: number;    // 0=Sunday, 1=Monday, etc. (for weekly)
    maxPlayers: 8 | 16 | 32;
    entryFee: number;
    currencyType: CurrencyType;
    level: number;
    prizeDistribution: number[];
    registrationMinutesBefore: number; // Open registration this many minutes before start
}

const TOURNAMENT_TEMPLATES: TournamentTemplate[] = [
    {
        name: 'Torneo Diario Express',
        description: 'Torneo rápido diario — 8 jugadores, eliminación directa',
        schedule: 'daily',
        hour: 20, // 8 PM UTC
        maxPlayers: 8,
        entryFee: 500,
        currencyType: CurrencyType.VIRTUAL,
        level: 3,
        prizeDistribution: [60, 30, 10],
        registrationMinutesBefore: 60,
    },
    {
        name: 'Copa Semanal AdiviNum',
        description: 'El torneo semanal más grande — 16 jugadores',
        schedule: 'weekly',
        hour: 18, // 6 PM UTC
        dayOfWeek: 6, // Saturday
        maxPlayers: 16,
        entryFee: 1000,
        currencyType: CurrencyType.VIRTUAL,
        level: 4,
        prizeDistribution: [50, 25, 15, 10],
        registrationMinutesBefore: 120,
    },
    {
        name: 'Torneo Nocturno Free',
        description: 'Torneo gratuito nocturno para principiantes',
        schedule: 'daily',
        hour: 2, // 2 AM UTC (late night LatAm)
        maxPlayers: 8,
        entryFee: 0,
        currencyType: CurrencyType.VIRTUAL,
        level: 2,
        prizeDistribution: [70, 30],
        registrationMinutesBefore: 30,
    },
];

@Injectable()
export class TournamentSchedulerService implements OnModuleInit {
    private readonly logger = new Logger(TournamentSchedulerService.name);
    private intervalRef: NodeJS.Timeout | null = null;

    constructor(private readonly tournamentService: TournamentService) {}

    onModuleInit() {
        // Check every 30 minutes
        this.intervalRef = setInterval(() => this.checkAndCreate(), 30 * 60 * 1000);
        // Also check on startup after short delay
        setTimeout(() => this.checkAndCreate(), 5000);
        this.logger.log('Tournament scheduler initialized');
    }

    async checkAndCreate() {
        const now = new Date();

        for (const template of TOURNAMENT_TEMPLATES) {
            try {
                const shouldCreate = this.shouldCreateTournament(template, now);
                if (shouldCreate) {
                    const startsAt = this.getNextStartTime(template, now);
                    const registrationDeadline = new Date(startsAt.getTime() - 5 * 60 * 1000); // 5 min before start

                    await this.tournamentService.createTournament({
                        name: template.name,
                        description: template.description,
                        format: 'SINGLE_ELIMINATION',
                        maxPlayers: template.maxPlayers,
                        entryFee: template.entryFee,
                        currencyType: template.currencyType,
                        level: template.level,
                        prizeDistribution: template.prizeDistribution,
                        startsAt,
                        registrationDeadline,
                    });

                    this.logger.log(`Auto-created tournament: ${template.name} starting at ${startsAt.toISOString()}`);
                }
            } catch (err) {
                this.logger.error(`Failed to auto-create ${template.name}:`, err);
            }
        }
    }

    private shouldCreateTournament(template: TournamentTemplate, now: Date): boolean {
        const startTime = this.getNextStartTime(template, now);
        const regOpenTime = new Date(startTime.getTime() - template.registrationMinutesBefore * 60 * 1000);

        // Should create if registration window is now open and less than registration period away
        const msUntilRegOpen = regOpenTime.getTime() - now.getTime();

        // Create if registration should open within the next 35 minutes
        // (our check interval is 30 min, so 35 min buffer avoids missing)
        return msUntilRegOpen >= 0 && msUntilRegOpen <= 35 * 60 * 1000;
    }

    private getNextStartTime(template: TournamentTemplate, now: Date): Date {
        const target = new Date(now);
        target.setUTCHours(template.hour, 0, 0, 0);

        if (template.schedule === 'weekly' && template.dayOfWeek !== undefined) {
            const currentDay = target.getUTCDay();
            let daysAhead = template.dayOfWeek - currentDay;
            if (daysAhead < 0) daysAhead += 7;
            if (daysAhead === 0 && target.getTime() <= now.getTime()) daysAhead = 7;
            target.setUTCDate(target.getUTCDate() + daysAhead);
        } else {
            // Daily: if today's time has passed, schedule for tomorrow
            if (target.getTime() <= now.getTime()) {
                target.setUTCDate(target.getUTCDate() + 1);
            }
        }

        return target;
    }
}
