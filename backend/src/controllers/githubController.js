import axios from 'axios';
import pool from '../config/db.js';

const getClient = async (userId) => {
  const res = await pool.query('SELECT github_access_token FROM users WHERE id = $1', [userId]);
  return axios.create({
    baseURL: 'https://api.github.com',
    headers: { Authorization: `Bearer ${res.rows[0].github_access_token}` }
  });
};

export const listRepos = async (req, res) => {
  try {
    const client = await getClient(req.user.id);
    const { data } = await client.get('/user/repos?sort=updated&per_page=100');
    res.json(data);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch repos' }); }
};

export const listCommits = async (req, res) => {
  try {
    const { owner, repo } = req.query;
    const client = await getClient(req.user.id);
    const { data } = await client.get(`/repos/${owner}/${repo}/commits`);
    res.json(data);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch commits' }); }
};