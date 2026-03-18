import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // ---- Test Player ----
    const player = await prisma.user.upsert({
        where: { email: 'player@adivinum.com' },
        update: {},
        create: {
            firebaseUid: 'dev-player-uid',
            username: 'TestPlayer',
            email: 'player@adivinum.com',
            country: 'CL',
            referralCode: 'TESTPLAYER',
            wallet: {
                create: {
                    balanceFiat: 0,
                    balanceVirtual: 50000, // 50k demo coins
                    balanceSavings: 0,
                },
            },
            levelProgress: {
                create: {
                    level: 1,
                    unlocked: true,
                },
            },
        },
        include: { wallet: true },
    });

    // ---- Test Admin ----
    const admin = await prisma.user.upsert({
        where: { email: 'admin@adivinum.com' },
        update: {},
        create: {
            firebaseUid: 'dev-admin-uid',
            username: 'AdminUser',
            email: 'admin@adivinum.com',
            country: 'CL',
            referralCode: 'ADMINUSER',
            isPremium: true,
            wallet: {
                create: {
                    balanceFiat: 100000,
                    balanceVirtual: 100000,
                    balanceSavings: 0,
                },
            },
            levelProgress: {
                create: {
                    level: 1,
                    unlocked: true,
                },
            },
        },
        include: { wallet: true },
    });

    // ---- Second Player (for testing matches) ----
    const player2 = await prisma.user.upsert({
        where: { email: 'player2@adivinum.com' },
        update: { username: 'TestPlayer2' },
        create: {
            firebaseUid: 'dev-player2-uid',
            username: 'TestPlayer2',
            email: 'player2@adivinum.com',
            country: 'CL',
            referralCode: 'TESTPLAYER2',
            wallet: {
                create: {
                    balanceFiat: 0,
                    balanceVirtual: 50000,
                    balanceSavings: 0,
                },
            },
            levelProgress: {
                create: {
                    level: 1,
                    unlocked: true,
                },
            },
        },
        include: { wallet: true },
    });

    console.log('✅ Users created:');
    console.log(`   🎮 Player:  ${player.username} (${player.id}) — ${player.wallet?.balanceVirtual} coins`);
    console.log(`   👑 Admin:   ${admin.username} (${admin.id}) — ${admin.wallet?.balanceVirtual} coins`);
    console.log(`   🤖 Rival:   ${player2.username} (${player2.id}) — ${player2.wallet?.balanceVirtual} coins`);
    console.log('\n🌱 Seed complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
