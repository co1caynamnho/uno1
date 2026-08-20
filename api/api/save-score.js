import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Phương thức không hợp lệ' });
  }

  try {
    const { username, score } = req.body;

    if (!username || score === undefined) {
      return res.status(400).json({ error: 'Thiếu tên người chơi hoặc điểm số' });
    }

    await redis.zadd('uno_leaderboard', { score: Number(score), member: username });

    return res.status(200).json({ success: true, message: 'Đã lưu điểm thành công!' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
