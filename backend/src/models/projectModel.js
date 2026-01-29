import pool from '../config/db.js';

export const createProject = async (title, description, budget, clientId, devEmail, status = 'OPEN') => {
  const query = `
    INSERT INTO projects (title, description, budget, client_id, developer_email, status)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const result = await pool.query(query, [title, description, budget, clientId, devEmail, status]);
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

// Update Project Details
export const updateProject = async (id, title, description, budget) => {
    const query = `
      UPDATE projects 
      SET title = $1, description = $2, budget = $3
      WHERE id = $4
      RETURNING *;
    `;
    const result = await pool.query(query, [title, description, budget, id]);
    return result.rows[0];
};

// Delete Project
export const deleteProject = async (id) => {
    // Manually delete related records to avoid Foreign Key constraint violations
    
    // 1. Delete Lock Requests
    try {
        await pool.query('DELETE FROM lock_requests WHERE project_id = $1', [id]);
    } catch (e) {
        console.warn('Checking lock_requests cleanup:', e.message);
    }

    // 2. Delete Project Versions (The code backups)
    try {
        await pool.query('DELETE FROM project_versions WHERE project_id = $1', [id]);
    } catch (e) {
        console.warn('Checking project_versions cleanup:', e.message);
    }

    // 3. Delete Project
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
};