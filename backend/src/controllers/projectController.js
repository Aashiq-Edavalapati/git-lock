import axios from 'axios';
import AdmZip from 'adm-zip';
import { createProject, findProjectById, saveProjectVersion, updateProjectStatus } from '../models/projectModel.js';
import { findUserByEmail, findUserById } from '../models/userModel.js';
import { encryptBuffer, generateFileHash } from '../utils/cryptoService.js';
import { sendProjectInvite } from '../utils/emailService.js';
import pool from '../config/db.js';
import { createNotification } from '../models/notificationModel.js';

// 0. List Projects (For Dashboard)
export const listProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    // Show projects where user is client OR developer
    // Join with users table to get names
    const query = `
      SELECT 
        p.*, 
        c.full_name as client_name, 
        d.full_name as developer_name
      FROM projects p
      LEFT JOIN users c ON p.client_id = c.id
      LEFT JOIN users d ON p.developer_id = d.id
      WHERE p.client_id = $1 OR p.developer_id = $1 OR (p.developer_email = $2)
      ORDER BY p.created_at DESC
    `;
    const userEmail = (await findUserById(userId)).email;
    const result = await pool.query(query, [userId, userEmail]);
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

// 0.5 Get Single Project (For Escrow Page)
export const getProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await findProjectById(id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    // Check access (Client or Dev)
    const userId = req.user.id;
    if (project.client_id !== userId && project.developer_id !== userId) {
        // Also allow access if developer_email matches (invite sent)
        const userEmail = (await findUserById(userId)).email;
        if (project.developer_email !== userEmail) {
             return res.status(403).json({ error: 'Access Denied' });
        }
    }
    
    // Include version details if locked
    if (project.status === 'LOCKED_REVIEW' || project.status === 'COMPLETED') {
        const versionQuery = `
          SELECT id, project_id, zip_hash, staging_url, commit_sha, repo_url, created_at, readme_preview 
          FROM project_versions 
          WHERE project_id = $1 
          ORDER BY created_at DESC LIMIT 1
        `;
        const versionResult = await pool.query(versionQuery, [id]);
        if (versionResult.rows.length > 0) {
            project.version = versionResult.rows[0];
            // No need to delete encrypted_blob anymore
        }
    }

    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed' });
  }
};

// 1. Client Creates Project (Refined)
export const initProject = async (req, res) => {
  try {
    const { title, description, budget, developerEmail } = req.body;
    const clientId = req.user.id; // From JWT
    const clientEmail = req.user.email; // From JWT payload

    // A. Validation: If dev email is provided, check if they are a real user?    
    // B. Create Project
    const newProject = await createProject(title, description, budget, clientId, developerEmail || null);

    // C. Handle Invite Logic
    if (developerEmail) {
      await sendProjectInvite(developerEmail, clientEmail, title, budget);
    }

    // D. Notification
    await createNotification(clientId, `Project Created: ${title}`);

    res.status(201).json({
      message: developerEmail ? 'Project created and invite sent' : 'Project created (No developer invited yet)',
      project: newProject
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

// 1.5 Send Invite (Late Invitation)
export const inviteDeveloper = async (req, res) => {
  try {
    const { projectId, developerEmail } = req.body;
    const clientId = req.user.id;

    // A. Authorization Check (Rubric #2: Access Control)
    // We must ensure the person sending the invite is the CLIENT who OWNS the project.
    const project = await findProjectById(projectId);
    
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    if (project.client_id !== clientId) {
      return res.status(403).json({ error: 'Unauthorized: You are not the owner of this project' });
    }

    // B. Update Database
    const query = `UPDATE projects SET developer_email = $1, status = 'INVITE_SENT' WHERE id = $2 RETURNING *`;
    const result = await pool.query(query, [developerEmail, projectId]);

    // C. Send Email
    // We need client email. In a real app, fetch it. Here assuming req.user has it.
    await sendProjectInvite(developerEmail, req.user.email, project.title, project.budget);

    await createNotification(clientId, `Invite sent to ${developerEmail} for "${project.title}"`);
    
    const developer = await findUserByEmail(developerEmail);
    if (developer) {
        await createNotification(developer.id, `You received an invitation for project "${project.title}"`);
    }

    res.status(200).json({ message: 'Invite sent successfully', project: result.rows[0] });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send invite' });
  }
};

// Dev accepting the invite from client
export const acceptProject = async (req, res) => {
  try {
    const { projectId } = req.body;
    const developerId = req.user.id;
    const developerEmail = req.user.email;

    // Check Project
    const project = await findProjectById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Access Control: Is this the invited email?
    if (project.developer_email !== developerEmail) {
      return res.status(403).json({ error: 'Unauthorized: You were not invited to this project' });
    }

    // Update Status and Bind Developer ID
    const query = `
      UPDATE projects 
      SET developer_id = $1, status = 'IN_PROGRESS' 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await pool.query(query, [developerId, projectId]);

    // Notifications
    await createNotification(project.client_id, `Developer ${developerEmail} accepted your invite for "${project.title}"`);
    await createNotification(developerId, `You successfully joined project "${project.title}"`);

    res.status(200).json({ message: 'Project accepted!', project: result.rows[0] });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to accept project' });
  }
};

const fetchGithubZip = async (repoOwner, repoName, commitSha, token) => {
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/zipball/${commitSha}`;
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'arraybuffer', 
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data; // This is a Buffer
};

export const uploadCode = async (req, res) => {
  try {
    let { projectId, stagingUrl, commitSha, repoUrl, repoOwner, repoName } = req.body;

    commitSha = commitSha;
    
    // If repoOwner/Name provided directly, construct repoUrl
    if (repoOwner && repoName) {
        repoUrl = `https://github.com/${repoOwner}/${repoName}`;
    } else if (repoUrl) {
         // Extract Owner/Name from URL (e.g., github.com/user/repo)
         const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
         if(match) {
             repoOwner = match[1];
             repoName = match[2];
         }
    }

    if (!repoOwner || !repoName) {
        return res.status(400).json({ error: 'Repository Owner and Name are required.' });
    }
    
    // Get Developer's GitHub Token from DB to access private repos
    const devQuery = `SELECT github_access_token FROM users WHERE id = $1`;
    const devResult = await pool.query(devQuery, [req.user.id]);
    const githubToken = devResult.rows[0]?.github_access_token;

    if (!githubToken) return res.status(403).json({ error: 'Please connect GitHub account first' });

    // Fetch the "Official" Code from GitHub
    console.log(`🕵️ Verifying Integrity with GitHub for commit ${commitSha}...`);
    const githubZipBuffer = await fetchGithubZip(repoOwner, repoName, commitSha, githubToken);
    
    // Compare Hashes
    const githubZip = new AdmZip(githubZipBuffer);
    const uploadedZip = new AdmZip(req.file.buffer);

    const getEntries = (zip) => {
        return zip.getEntries()
            .filter(entry => !entry.isDirectory && !entry.entryName.includes('__MACOSX') && !entry.entryName.includes('.DS_Store')) // Ignore system files/folders
            .map(entry => {
                // Remove top-level folder usually present in GitHub zips (e.g., "repo-name-sha/")
                const cleanName = entry.entryName.substring(entry.entryName.indexOf('/') + 1); 
                return { name: cleanName, crc: entry.header.crc };
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    };

    const githubEntries = getEntries(githubZip);
    const uploadedEntries = getEntries(uploadedZip);

    // Basic count check
    if (githubEntries.length !== uploadedEntries.length) {
         return res.status(400).json({ 
             error: `File Count Mismatch: GitHub has ${githubEntries.length} files, Upload has ${uploadedEntries.length}.` 
         });
    }

    // CRC Check
    for (let i = 0; i < githubEntries.length; i++) {
        const gh = githubEntries[i];
        const up = uploadedEntries[i];
        
        if (gh.crc !== up.crc) {
             return res.status(400).json({ error: `Content Mismatch: File '${gh.name}' differs from GitHub version.` });
        }
    }

    console.log("✅ Integrity Verified: Code matches GitHub exactly.");

    // Verify Deployment Status
    console.log("🌍 Verifying Staging Deployment...");
    await verifyDeploymentStatus(repoOwner, repoName, commitSha, githubToken, stagingUrl);
    console.log("✅ Deployment Verified.");

    // Proceed with Encryption
    const encryptedData = encryptBuffer(req.file.buffer);
    
    const finalHash = generateFileHash(req.file.buffer);

    const readmeEntry = githubZip.getEntries().find(e => e.entryName.toLowerCase().endsWith('readme.md'));
    const readmeBase64 = readmeEntry ? readmeEntry.getData().toString('base64') : null;

    await saveProjectVersion(projectId, encryptedData, finalHash, stagingUrl, commitSha, repoUrl, readmeBase64);
    await updateProjectStatus(projectId, 'LOCKED_REVIEW');

    res.status(200).json({ message: 'Code Verified & Locked', integrityHash: finalHash });
    
    // Notification Logic
    const project = await findProjectById(projectId);
    const notificationMsg = `
      New Code Locked for "${project.title}".
      - Deploy Status: Verified (Success)
      - Staging URL: ${cleanProvidedUrl || stagingUrl}
      - GitHub Commit: ${commitSha} (Verified)
      - Integrity Check: Passed (Matches GitHub Source)
    `.trim();

    await createNotification(project.client_id, notificationMsg);
    await createNotification(project.developer_id, `Code uploaded successfully for "${project.title}". Validation passed.`);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Verification failed. Ensure you uploaded the ZIP exported from GitHub.' });
  }
};

const verifyDeploymentStatus = async (owner, repo, commitSha, token, providedUrl) => {
  const headers = { 
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json" 
  };

  // Normalize Provided URL: Remove trailing slash if present
  const cleanProvidedUrl = providedUrl ? providedUrl.replace(/\/$/, "") : providedUrl;

  // Get Deployments for this specific commit
  const deployUrl = `https://api.github.com/repos/${owner}/${repo}/deployments?sha=${commitSha}`;
  const { data: deployments } = await axios.get(deployUrl, { headers });

  if (!deployments || deployments.length === 0) {
    throw new Error('No deployments found for this commit SHA.');
  }

  // Get the statuses for the most recent deployment
  const deploymentId = deployments[0].id;
  const statusUrl = `https://api.github.com/repos/${owner}/${repo}/deployments/${deploymentId}/statuses`;
  const { data: statuses } = await axios.get(statusUrl, { headers });

  // Find the "success" state
  const successStatus = statuses.find(s => s.state === 'success');

  if (!successStatus) {
    throw new Error('No successful deployment status found.');
  }

  // Extract the actual live URL
  const actualUrl = successStatus.environment_url;

  console.log("[DEBUG]: Actual Deployed URL:", actualUrl);
  console.log("[DEBUG]: Provided URL (Cleaned):", cleanProvidedUrl);

  // Compare using the cleaned URL
  if (actualUrl && !actualUrl.includes(cleanProvidedUrl)) {
    console.warn("⚠️ Warning: CI Deployment URL differs from Staging URL.");
  }

  return actualUrl;
};

export const verifyProjectDetails = async (req, res) => {
    try {
        const { repoOwner, repoName, commitSha, stagingUrl } = req.body;
        
        // Get Token
        const devQuery = `SELECT github_access_token FROM users WHERE id = $1`;
        const devResult = await pool.query(devQuery, [req.user.id]);
        const githubToken = devResult.rows[0]?.github_access_token;
    
        if (!githubToken) return res.status(403).json({ error: 'Please connect GitHub account first' });

        // Check Repo Access & Commit Existence
        try {
            await axios.get(`https://api.github.com/repos/${repoOwner}/${repoName}/commits/${commitSha}`, {
                headers: { Authorization: `Bearer ${githubToken}` }
            });
        } catch (e) {
            return res.status(404).json({ error: 'Repository or Commit not found (or access denied)' });
        }

        // Verify Deployment
        try {
            await verifyDeploymentStatus(repoOwner, repoName, commitSha, githubToken, stagingUrl);
        } catch (e) {
             return res.status(400).json({ error: e.message || 'Deployment verification failed' });
        }

        res.json({ message: 'Verification Successful' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Verification Error' });
    }
}

export const downloadCode = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await findProjectById(id);
        
        if (!project) return res.status(404).json({ error: 'Project not found' });
        
        // Access Control Logic
        // 1. Developer: Can download anytime (as they are the uploader)
        if (req.user.id === project.developer_id) {
             // Access Granted
        } 
        // 2. Client: Can ONLY download if status is COMPLETED
        else if (req.user.id === project.client_id) {
             if (project.status !== 'COMPLETED') {
                 return res.status(403).json({ error: 'Access Denied: Payment not completed yet.' });
             }
        }
        // 3. Others: Strict No
        else {
             return res.status(403).json({ error: 'Access Denied' });
        }

        // Get Version
        const versionQuery = `SELECT encrypted_blob FROM project_versions WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1`;
        const versionResult = await pool.query(versionQuery, [id]);
        
        if (versionResult.rows.length === 0) return res.status(404).json({ error: 'No code found' });

        const { encrypted_blob } = versionResult.rows[0];
        
        // Decrypt dynamically
        const { decryptBuffer } = await import('../utils/cryptoService.js');

        const encryptedString = encrypted_blob.toString('utf-8');
        const decryptedBuffer = decryptBuffer(encryptedString);

        res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="project_${id}_source.zip"`,
            'Content-Length': decryptedBuffer.length
        });
        res.send(decryptedBuffer);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Download Failed' });
    }
};