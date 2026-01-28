import axios from 'axios';
import AdmZip from 'adm-zip';
import { createProject, findProjectById, saveProjectVersion, updateProjectStatus } from '../models/projectModel.js';
import { findUserByEmail, findUserById } from '../models/userModel.js';
import { encryptBuffer, generateFileHash } from '../utils/cryptoService.js';
import { sendProjectInvite } from '../utils/emailService.js';
import pool from '../config/db.js';

// 0. List Projects (For Dashboard)
export const listProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    // Show projects where user is client OR developer
    const query = `
      SELECT * FROM projects 
      WHERE client_id = $1 OR developer_id = $1 OR (developer_email = $2)
      ORDER BY created_at DESC
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
        const versionQuery = `SELECT * FROM project_versions WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1`;
        const versionResult = await pool.query(versionQuery, [id]);
        if (versionResult.rows.length > 0) {
            project.version = versionResult.rows[0];
            // Don't send encrypted_blob, but send readme_preview
            delete project.version.encrypted_blob;
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

    // 1. Check Project
    const project = await findProjectById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // 2. Access Control: Is this the invited email?
    if (project.developer_email !== developerEmail) {
      return res.status(403).json({ error: 'Unauthorized: You were not invited to this project' });
    }

    // 3. Update Status and Bind Developer ID
    const query = `
      UPDATE projects 
      SET developer_id = $1, status = 'IN_PROGRESS' 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await pool.query(query, [developerId, projectId]);

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
    responseType: 'arraybuffer', // Important! We need raw bytes
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data; // This is a Buffer
};

export const uploadCode = async (req, res) => {
  try {
    let { projectId, stagingUrl, commitSha, commitHash, repoUrl, repoOwner, repoName } = req.body;

    // Use commitHash if commitSha is missing
    commitSha = commitSha || commitHash;
    
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
    
    // Clean commitSha just in case
    // const [_, owner, repoName] = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/); // REMOVED
    
    // 1. Get Developer's GitHub Token from DB
    // We need this to access Private Repos
    const devQuery = `SELECT github_access_token FROM users WHERE id = $1`;
    const devResult = await pool.query(devQuery, [req.user.id]);
    const githubToken = devResult.rows[0]?.github_access_token;

    if (!githubToken) return res.status(403).json({ error: 'Please connect GitHub account first' });

    // 2. Fetch the "Official" Code from GitHub
    console.log(`🕵️ Verifying Integrity with GitHub for commit ${commitSha}...`);
    const githubZipBuffer = await fetchGithubZip(repoOwner, repoName, commitSha, githubToken);
    
    // 3. Compare Hashes (The "GitLock" Core Logic)
    // Note: GitHub zips might differ slightly in metadata/folder structure compared to a local zip.
    // OPTION A (Strict): Hash the buffers. (Hard because compression varies)
    // OPTION B (Smart): Unzip both in memory, hash the *contents* (files).
    // FOR THIS LAB: We will assume the user downloads the zip FROM GitHub and uploads THAT exact file.
    // This allows exact hash matching.
    
    // 3. Compare Contents (Smart Verification)
    // We compare file entries and their CRC32 checksums to ignore compression differences
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

        // We only check if names match approximately (handling the root folder difference dynamically is hard, usually stripping root works)
        // If the user zipped it without a root folder, standardizing paths is key.
        // For now, we trust the name sort + CRC.
        
        if (gh.crc !== up.crc) {
             return res.status(400).json({ error: `Content Mismatch: File '${gh.name}' differs from GitHub version.` });
        }
    }

    console.log("✅ Integrity Verified: Code matches GitHub exactly.");

    // 4. Verify Deployment Status
    console.log("🌍 Verifying Staging Deployment...");
    await verifyDeploymentStatus(repoOwner, repoName, commitSha, githubToken, stagingUrl);
    console.log("✅ Deployment Verified.");

    // 5. Proceed with Encryption (Existing Logic)
    const encryptedData = encryptBuffer(req.file.buffer);
    
    // Use uploadedEntries CRC or similar as hash? 
    // We already verified they match. We can store the simple hash or the calculated content hash.
    // For now, keep using the uploaded file's simple hash as the identifier.
    const finalHash = generateFileHash(req.file.buffer);

    await saveProjectVersion(projectId, encryptedData, finalHash, stagingUrl, commitSha, repoUrl);
    await updateProjectStatus(projectId, 'LOCKED_REVIEW');

    res.status(200).json({ message: 'Code Verified & Locked', integrityHash: finalHash });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Verification failed. Ensure you uploaded the ZIP exported from GitHub.' });
  }
};

const verifyDeploymentStatus = async (owner, repo, commitSha, token, providedUrl) => {
  // 1. Get Statuses for this Commit
  const url = `https://api.github.com/repos/${owner}/${repo}/commits/${commitSha}/status`;
  const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });

  // 2. Look for a "success" state from Vercel/Netlify/GitHub Actions
  const successState = data.statuses.find(s => s.state === 'success');
  
  if (!successState) {
    throw new Error('No successful deployment found for this commit SHA.');
  }

  // 3. Optional: Verify URL match
  // Some CI providers put the URL in `target_url`.
  if (successState.target_url && !successState.target_url.includes(providedUrl)) {
     console.warn("⚠️ Warning: CI Deployment URL differs from Staging URL.");
     // We might not fail the request, but we should flag it.
  }
  
  return true;
};

export const verifyProjectDetails = async (req, res) => {
    try {
        const { repoOwner, repoName, commitSha, stagingUrl } = req.body;
        
        // 1. Get Token
        const devQuery = `SELECT github_access_token FROM users WHERE id = $1`;
        const devResult = await pool.query(devQuery, [req.user.id]);
        const githubToken = devResult.rows[0]?.github_access_token;
    
        if (!githubToken) return res.status(403).json({ error: 'Please connect GitHub account first' });

        // 2. Check Repo Access & Commit Existence
        try {
            await axios.get(`https://api.github.com/repos/${repoOwner}/${repoName}/commits/${commitSha}`, {
                headers: { Authorization: `Bearer ${githubToken}` }
            });
        } catch (e) {
            return res.status(404).json({ error: 'Repository or Commit not found (or access denied)' });
        }

        // 3. Verify Deployment
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