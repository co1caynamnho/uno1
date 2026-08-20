import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  try {
    const topPlayers = await redis.zrange('uno_leaderboard', 0, 9, {
      rev: true,
      withScores: true
    });

    const leaderboard = [];
    for (let i = 0; i < topPlayers.length; i += 2) {
      leaderboard.push({
        username: topPlayers[i],
        score: topPlayers[i + 1]
      });
    }

    return res.status(200).json(leaderboard);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
