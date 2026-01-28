import pool from '../config/db.js';

export const createProject = async (title, description, budget, clientId, devEmail) => {
  const query = `
    INSERT INTO projects (title, description, budget, client_id, developer_email)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const result = await pool.query(query, [title, description, budget, clientId, devEmail]);
  return result.rows[0];
};

// Find Project by ID
export const findProjectById = async (id) => {
  const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
  return result.rows[0];
};

// Upload Encrypted Code (The Lock)
export const saveProjectVersion = async (projectId, encryptedBlob, zipHash, stagingUrl, commitSha, repoUrl, readmeBase64) => {
  // TODO: Add readme_preview column to DB. we will autocreate it in index.js
  const query = `
    INSERT INTO project_versions (project_id, encrypted_blob, zip_hash, staging_url, commit_sha, repo_url, readme_preview)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, created_at;
  `;
  
  const result = await pool.query(query, [projectId, encryptedBlob, zipHash, stagingUrl, commitSha, repoUrl, readmeBase64]);
  return result.rows[0];
};

// Update Project Status
export const updateProjectStatus = async (projectId, status) => {
  const query = `UPDATE projects SET status = $1 WHERE id = $2`;
  await pool.query(query, [status, projectId]);
};