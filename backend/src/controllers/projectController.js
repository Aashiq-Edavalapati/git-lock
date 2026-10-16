import axios from 'axios';
import AdmZip from 'adm-zip';
import { createProject, findProjectById, saveProjectVersion, updateProjectStatus, createProject as createProjectModel, updateProject as updateProjectModel, deleteProject as deleteProjectModel } from '../models/projectModel.js';
import { findUserByEmail, findUserById, getMFASecret, clearMFASecret } from '../models/userModel.js';
import { encryptBuffer, generateFileHash } from '../utils/cryptoService.js';
import { sendProjectInvite, sendNotificationEmail, sendJoinInviteEmail } from '../utils/emailService.js';
import { generateOTP, storeMFASecret } from '../utils/mfaService.js';
import pool from '../config/db.js';
import { createNotification } from '../models/notificationModel.js';
import bcrypt from 'bcrypt';

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
        c.email as client_email,
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
    
    // Include version details if locked or in escrow flow
    const lockedStates = ['LOCKED_REVIEW', 'APPROVED', 'ESCROW_FUNDED', 'OWNERSHIP_VERIFIED', 'COMPLETED'];
    if (lockedStates.includes(project.status)) {
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

    // Include Client Details (Name/Email) for UI
    const clientUser = await findUserById(project.client_id);
    if (clientUser) {
        project.client_name = clientUser.full_name;
        project.client_email = clientUser.email;
    }

    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed' });
  }
};


export const initProject = async (req, res) => {
  try {
    const { title, description, budget, developerEmail, requirements, attachments } = req.body;
    const clientId = req.user.id; // From JWT
    const client = await findUserById(clientId);
    const clientName = client?.full_name || client?.email || req.user.email || 'A GitLock Client';
    const clientEmail = client?.email || req.user.email;

    const normalizedDevEmail = developerEmail ? developerEmail.trim().toLowerCase() : null;

    // A. Validation: If dev email is provided
    let devUserId = null;
    let isNewUser = false;

    if (normalizedDevEmail) {
        const developer = await findUserByEmail(normalizedDevEmail);
        if (developer) {
            // Check Role
            if (developer.role !== 'DEVELOPER') {
                return res.status(400).json({ error: 'User exists but is not a Developer. Only developers can be invited.' });
            }
            devUserId = developer.id;
        } else {
            isNewUser = true;
        }
    }

    // B. Create Project
    const status = normalizedDevEmail ? 'INVITE_SENT' : 'OPEN';
    const newProject = await createProject(title, description, budget, clientId, normalizedDevEmail, requirements || "", attachments || [], status);

    // C. Handle Invite Logic
    if (normalizedDevEmail) {
        if (!isNewUser) {
            // Existing Developer -> Standard Invite
            await sendProjectInvite(normalizedDevEmail, clientName, title, budget, null, null, newProject.id);
            // In-App Notification (Only for existing user)
            await createNotification(devUserId, `You received an invitation for project "${title}"`, 'PROJECT', newProject.id, `/dashboard/accept-invite/${newProject.id}`);
        } else {
            // Non-Existing User -> Join Invite
            await sendJoinInviteEmail(normalizedDevEmail, clientName, title, newProject.id);
            // No In-App Notification yet (will be created on registration)
        }
    }

    // D. Notification & Confirmation for Client
    await createNotification(clientId, `Project Created: ${title}`, 'PROJECT', newProject.id, `/dashboard/projects/${newProject.id}`);
    if (clientEmail) {
        await sendNotificationEmail(
            clientEmail,
            `Project Created: ${title}`,
            `Hello ${clientName},\n\nYour project "${title}" with an escrow budget of ${budget} tBNB has been successfully created.${normalizedDevEmail ? ` An invitation has been dispatched to ${normalizedDevEmail}.` : ''}\n\nYou can track project progress, review code delivery, and manage blockchain escrow directly from your dashboard.`,
            `/dashboard/projects/${newProject.id}`,
            'View Project Dashboard'
        );
    }

    // LOGGING: PROJECT_CREATED
    await pool.query(
        `INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)`,
        [clientId, 'PROJECT_CREATED', JSON.stringify({ projectId: newProject.id, title, budget, developerEmail: normalizedDevEmail })]
    );

    res.status(201).json({
      message: normalizedDevEmail 
        ? (isNewUser ? 'Project created. Invite sent to join GitLock.' : 'Project created and invite sent to developer.') 
        : 'Project created (No developer invited yet)',
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
    const { projectId, developerEmail, subject, body, requirements } = req.body;
    const clientId = req.user.id;
    const client = await findUserById(clientId);
    const clientName = client?.full_name || client?.email || req.user.email || 'A GitLock Client';
    const clientEmail = client?.email || req.user.email;

    if (!developerEmail) {
        return res.status(400).json({ error: 'Developer email is required' });
    }

    const normalizedDevEmail = developerEmail.trim().toLowerCase();

    // A. Authorization Check (Rubric #2: Access Control)
    const project = await findProjectById(projectId);
    
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    if (project.client_id !== clientId) {
      return res.status(403).json({ error: 'Unauthorized: You are not the owner of this project' });
    }

    // A.5 Developer Validation
    let devUserId = null;
    let isNewUser = false;

    const developer = await findUserByEmail(normalizedDevEmail);
    if (developer) {
        // Check Role
        if (developer.role !== 'DEVELOPER') {
            return res.status(400).json({ error: 'User exists but is not a Developer. Only developers can be invited.' });
        }
        devUserId = developer.id;
    } else {
        isNewUser = true;
    }

    // B. Handle Attachments
    let attachments = [];
    if (req.files && req.files.length > 0) {
        attachments = req.files.map(file => {
            const base64 = file.buffer.toString('base64');
            const dataUri = `data:${file.mimetype};base64,${base64}`;
            
            return {
                name: file.originalname,
                size: (file.size / 1024).toFixed(2) + ' KB',
                type: file.mimetype,
                url: dataUri,
                uploadedAt: new Date().toISOString()
            };
        });
    }

    // C. Update Database
    const query = `
        UPDATE projects 
        SET developer_email = $1, status = 'INVITE_SENT', requirements = $3, attachments = $4
        WHERE id = $2 
        RETURNING *
    `;
    const result = await pool.query(query, [normalizedDevEmail, projectId, requirements, JSON.stringify(attachments)]);

    // D. Send Email
    if (!isNewUser) {
        // Standard User
        await sendProjectInvite(normalizedDevEmail, clientName, project.title, project.budget, subject, body, projectId);
        // Notification
        await createNotification(devUserId, `You received an invitation for project "${project.title}"`, 'PROJECT', projectId, `/dashboard/accept-invite/${projectId}`);
    } else {
        // Non-User
        await sendJoinInviteEmail(normalizedDevEmail, clientName, project.title, projectId);
    }
 
    // Notify Client (In-App & Email Confirmation)
    await createNotification(clientId, `Invite sent to ${normalizedDevEmail} for "${project.title}"`, 'PROJECT', projectId, `/dashboard/projects/${projectId}`);
    if (clientEmail) {
        await sendNotificationEmail(
            clientEmail,
            `Invitation Dispatched: ${project.title}`,
            `Hello ${clientName},\n\nYour project invitation for "${project.title}" has been sent to ${normalizedDevEmail}. You will be notified immediately when they accept or decline the invitation.`,
            `/dashboard/projects/${projectId}`,
            'View Project Dashboard'
        );
    }

    // LOGGING: INVITE_SENT
    await pool.query(
        `INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)`,
        [clientId, 'INVITE_SENT', JSON.stringify({ projectId, developerEmail: normalizedDevEmail, projectTitle: project.title })]
    );

    res.status(200).json({ 
        message: isNewUser ? 'Invite sent to join GitLock' : 'Invite sent successfully', 
        project: result.rows[0] 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send invite' });
  }
};

// 1.6 Remove Developer / Cancel Invite
export const removeDeveloper = async (req, res) => {
    try {
        const { projectId } = req.body;
        const clientId = req.user.id;

        const project = await findProjectById(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (project.client_id !== clientId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Prevent removal if Payment is Completed (Status: COMPLETED)
        if (project.status === 'COMPLETED') {
             return res.status(400).json({ error: 'Cannot remove developer after project completion/payment.' });
        }

        const oldDevEmail = project.developer_email;
        const oldStatus = project.status;

        // Reset to OPEN
        // We also need to clear developer_id if it was set
        const query = `UPDATE projects SET developer_email = NULL, developer_id = NULL, status = 'OPEN' WHERE id = $1 RETURNING *`;
        const result = await pool.query(query, [projectId]);

        // Notifications
        await createNotification(clientId, `Developer removed from "${project.title}". Project is now Open.`, 'PROJECT', project.id, `/dashboard/projects/${project.id}`);
        
        if (oldDevEmail) {
            // Try to find if they are a registered user to send in-app notification
            const devUser = await findUserByEmail(oldDevEmail);
            if (devUser) {
                 await createNotification(devUser.id, `You have been removed from project "${project.title}" by the client.`, 'PROJECT', project.id, `/dashboard`);
            }

            // Send Email Notification (Crucial for active projects)
            if (oldStatus === 'IN_PROGRESS' || oldStatus === 'LOCKED_REVIEW') {
                 // Import dynamically to avoid circular issues if any, or just use import
                 const { sendNotificationEmail } = await import('../utils/emailService.js');
                 await sendNotificationEmail(
                    oldDevEmail, 
                    `Project Update: ${project.title}`,
                    `Hello,\n\nThe client has removed you from the project "${project.title}".\n\nIf you believe this is a mistake, please contact the client directly.\n\n- GitLock Team`
                 );
            }
        }

        // LOGGING: DEVELOPER_REMOVED
        await pool.query(
            `INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)`,
            [clientId, 'DEVELOPER_REMOVED', JSON.stringify({ projectId, removedEmail: oldDevEmail, projectTitle: project.title })]
        );

        res.json({ message: 'Developer removed successfully', project: result.rows[0] });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to remove developer' });
    }
};

// Dev accepting the invite from client
export const acceptProject = async (req, res) => {
  try {
    const { projectId } = req.body;
    const developerId = req.user.id;
    const devUser = await findUserById(developerId);
    const developerEmail = devUser?.email || req.user.email;
    const developerName = devUser?.full_name || developerEmail;

    // Check Project
    const project = await findProjectById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Access Control: Is this the invited email? (case-insensitive check)
    if (project.developer_email && developerEmail && project.developer_email.toLowerCase() !== developerEmail.toLowerCase()) {
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

    // In-App Notifications
    await createNotification(project.client_id, `Developer ${developerName} accepted your invite for "${project.title}"`, 'PROJECT', projectId, `/dashboard/projects/${projectId}`);
    await createNotification(developerId, `You successfully joined project "${project.title}"`, 'PROJECT', projectId, `/dashboard/projects/${projectId}`);

    // Email Notifications to Client and Developer
    const clientUser = await findUserById(project.client_id);
    if (clientUser?.email) {
      await sendNotificationEmail(
        clientUser.email,
        `Invitation Accepted: ${project.title}`,
        `Hello ${clientUser.full_name || 'Client'},\n\nGreat news! Developer ${developerName} (${developerEmail}) has accepted your invitation for "${project.title}".\n\nThe project status is now IN_PROGRESS. The developer will now work on the project and lock the verified source code and deployment.\n\nYou can track the project and view escrow status anytime from your dashboard.`,
        `/dashboard/projects/${projectId}`,
        'Open Project Dashboard'
      );
    }

    if (developerEmail) {
      await sendNotificationEmail(
        developerEmail,
        `Project Started: ${project.title}`,
        `Hello ${developerName},\n\nYou have accepted the invitation for "${project.title}" with an escrow budget of ${project.budget} tBNB.\n\nThe project is now IN_PROGRESS. When you are ready, lock and verify your GitHub repository and deployment on GitLock.`,
        `/dashboard/projects/${projectId}`,
        'Go to Project'
      );
    }

    // LOGGING: INVITE_ACCEPTED
    await pool.query(
        `INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)`,
        [developerId, 'INVITE_ACCEPTED', JSON.stringify({ projectId, projectTitle: project.title })]
    );

    res.status(200).json({ message: 'Project accepted!', project: result.rows[0] });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to accept project' });
  }
};

// Dev declining the invite
export const declineProject = async (req, res) => {
  try {
    const { projectId } = req.body;
    const developerId = req.user.id;
    const devUser = await findUserById(developerId);
    const developerEmail = devUser?.email || req.user.email;
    const developerName = devUser?.full_name || developerEmail;

    const project = await findProjectById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (project.developer_email && developerEmail && project.developer_email.toLowerCase() !== developerEmail.toLowerCase()) {
      return res.status(403).json({ error: 'Unauthorized: You were not invited to this project' });
    }

    // Reset status to OPEN and clear developer_email
    const query = `
      UPDATE projects 
      SET developer_email = NULL, developer_id = NULL, status = 'OPEN' 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [projectId]);

    // In-App Notification to Client
    await createNotification(
      project.client_id, 
      `Developer ${developerName} declined your invitation for "${project.title}". Project is now OPEN.`, 
      'PROJECT', 
      projectId, 
      `/dashboard/projects/${projectId}`
    );

    // Email to Client
    const clientUser = await findUserById(project.client_id);
    if (clientUser?.email) {
      await sendNotificationEmail(
        clientUser.email,
        `Invitation Declined: ${project.title}`,
        `Hello ${clientUser.full_name || 'Client'},\n\nDeveloper ${developerName} (${developerEmail}) has declined the invitation for "${project.title}".\n\nThe project status has been reset to OPEN. You can now invite another developer from your dashboard.`,
        `/dashboard/projects/${projectId}`,
        'Invite Another Developer'
      );
    }

    res.status(200).json({ message: 'Invitation declined', project: result.rows[0] });
  } catch (error) {
    console.error('Decline project error:', error);
    res.status(500).json({ error: 'Failed to decline project' });
  }
};

// Developer Revoking Acceptance
export const revokeProjectAcceptance = async (req, res) => {
    try {
        const { id } = req.params; // Project ID
        const developerId = req.user.id;

        const project = await findProjectById(id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        // Authorization: Must be the assigned developer
        if (project.developer_id !== developerId) {
            return res.status(403).json({ error: 'Unauthorized: You are not the assigned developer for this project.' });
        }

        // Validation: Cannot revoke if COMPLETED 
        // (Optional: Maybe restrict if LOCKED_REVIEW too? User said "revoke his acceptance", usually implies early stage, but let's allow as long as not completed/paid)
        if (project.status === 'COMPLETED') {
            return res.status(400).json({ error: 'Cannot revoke acceptance for a completed project.' });
        }

        // Action: Reset Developer fields
        // We set status to OPEN so client can invite someone else or it appears in marketplace
        const query = `
            UPDATE projects 
            SET developer_id = NULL, developer_email = NULL, status = 'OPEN' 
            WHERE id = $1 
            RETURNING *
        `;
        const result = await pool.query(query, [id]);

        // Notifications
        // 1. In-App to Client
        await createNotification(project.client_id, `URGENT: Developer has revoked acceptance for "${project.title}". Project is now OPEN.`, 'PROJECT', project.id, `/dashboard/projects/${project.id}`);
        
        // 2. Email to Client
        const clientUser = await findUserById(project.client_id);
        if (clientUser) {
            await sendNotificationEmail(
                clientUser.email,
                `Project Alert: Developer Revoked Acceptance - ${project.title}`,
                `Hello,\n\nThe developer has revoked their acceptance for the project "${project.title}".\n\nThe project status has been reset to OPEN. You can now invite a new developer or wait for applications.\n\n- GitLock Team`
            );
        }

        res.json({ message: 'You have revoked your acceptance. Project removed from your list.', project: result.rows[0] });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to revoke revocation' });
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

    if (stagingUrl) {
      stagingUrl = stagingUrl.trim();
      if (!stagingUrl.startsWith('http://') && !stagingUrl.startsWith('https://')) {
        stagingUrl = `https://${stagingUrl}`;
      }
    }

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
    // 1. Fetch Client's Public Key (The owner of the project)
    // We need to fetch the project again to be sure (or use the check above if we had client_id)
    // The project object was not fetched in this function yet (except implicitly via validation?)
    // Actually we haven't fetched 'project' yet in this function. We need to.
    
    // We already need project_id to save version.
    const project = await findProjectById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    const clientUser = await findUserById(project.client_id);
    const clientPublicKey = clientUser?.public_key;

    let encryptedData;
    let encryptedKey = null;

    if (clientPublicKey) {
        console.log("🔐 Using Hybrid Encryption (RSA + AES)");
         // Dynamic Import to avoid circular dep if needed, but we used standard import at top
        const { encryptHybrid } = await import('../utils/cryptoService.js');
        const hybridResult = encryptHybrid(req.file.buffer, clientPublicKey);
        
        encryptedData = hybridResult.encryptedFile;
        encryptedKey = hybridResult.encryptedKey;
    } else {
        console.warn("⚠️ Client has no Public Key. Falling back to Server-Side Encryption.");
        encryptedData = encryptBuffer(req.file.buffer);
    }
    
    const finalHash = generateFileHash(req.file.buffer);

    const readmeEntry = githubZip.getEntries().find(e => e.entryName.toLowerCase().endsWith('readme.md'));
    const readmeBase64 = readmeEntry ? readmeEntry.getData().toString('base64') : null;

    await saveProjectVersion(projectId, encryptedData, finalHash, stagingUrl, commitSha, repoUrl, readmeBase64, encryptedKey);
    await updateProjectStatus(projectId, 'LOCKED_REVIEW');

    // Notification Logic
    // Project was already fetched above as 'project'
    const cleanStagingUrl = stagingUrl ? stagingUrl.replace(/\/$/, "") : stagingUrl;
    
    const notificationMsg = `
      New Code Locked for "${project.title}".
      - Deploy Status: Verified (Success)
      - Staging URL: ${cleanStagingUrl}
      - GitHub Commit: ${commitSha} (Verified)
      - Integrity Check: Passed (Matches GitHub Source)
    `.trim();

    await createNotification(project.client_id, notificationMsg, 'PROJECT', projectId, `/dashboard/escrow/${projectId}`);
    await createNotification(project.developer_id, `Code uploaded successfully for "${project.title}". Validation passed.`, 'PROJECT', projectId, `/dashboard/escrow/${projectId}`);

    // Email notification to client to test deployment & fund escrow
    if (clientUser?.email) {
      await sendNotificationEmail(
        clientUser.email,
        `Code Delivery Ready for Review: ${project.title}`,
        `Hello ${clientUser.full_name || 'Client'},\n\nThe developer has submitted and locked the verified source code for "${project.title}".\n\n- Staging URL: ${cleanStagingUrl}\n- GitHub Commit: ${commitSha}\n- Integrity Check: Passed (Matches GitHub Source)\n\nPlease test the live staging URL and approve the deployment on GitLock to proceed with funding the escrow.`,
        `/dashboard/escrow/${projectId}`,
        'Review Delivery & Escrow'
      );
    }

    // LOGGING: LOCK_CREATED (Code Upload)
    await pool.query(
        `INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)`,
        [req.user.id, 'LOCK_CREATED', JSON.stringify({ projectId, commitSha, stagingUrl, projectTitle: project.title })]
    );

    res.status(200).json({ message: 'Code Verified & Locked', integrityHash: finalHash });

  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
        res.status(500).json({ error: 'Verification failed. Ensure you uploaded the ZIP exported from GitHub.' });
    }
  }
};

const normalizeUrl = (url) => {
  if (!url) return '';
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');
};

const isDeploymentUrlMatch = (provided, actual, repo) => {
  const normProvided = normalizeUrl(provided);
  const normActual = normalizeUrl(actual);

  if (!normProvided || !normActual) return false;

  // Direct equality or substring match
  if (normProvided === normActual) return true;
  if (normActual.includes(normProvided) || normProvided.includes(normActual)) return true;

  // Vercel deployment matching:
  // e.g. actual: "gitlock-demo-6lzkx2ucx-...vercel.app", provided: "gitlock-demo.vercel.app"
  if (normProvided.endsWith('.vercel.app') && normActual.endsWith('.vercel.app')) {
    const providedProject = normProvided.replace(/\.vercel\.app$/, '');
    if (normActual.startsWith(providedProject + '-') || normActual.startsWith(providedProject + '.')) {
      return true;
    }
  }

  // Netlify matching:
  if (normProvided.endsWith('.netlify.app') && normActual.endsWith('.netlify.app')) {
    const providedProject = normProvided.replace(/\.netlify\.app$/, '');
    if (normActual.includes(providedProject)) {
      return true;
    }
  }

  // Check if project prefix in URL matches repository name
  const repoName = (repo || '').toLowerCase();
  if (repoName) {
    const providedProject = normProvided.split('.')[0];
    if (providedProject === repoName && (normActual.startsWith(repoName + '-') || normActual.startsWith(repoName + '.'))) {
      return true;
    }
  }

  return false;
};

const verifyDeploymentStatus = async (owner, repo, commitSha, token, providedUrl) => {
  const headers = { 
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json" 
  };

  // Get Deployments for this specific commit
  const deployUrl = `https://api.github.com/repos/${owner}/${repo}/deployments?sha=${commitSha}`;
  const { data: deployments } = await axios.get(deployUrl, { headers });

  if (!deployments || deployments.length === 0) {
    throw new Error('No deployments found for this commit SHA.');
  }

  let matched = false;
  let detectedUrl = null;

  for (const deployment of deployments) {
    const statusUrl = `https://api.github.com/repos/${owner}/${repo}/deployments/${deployment.id}/statuses`;
    const { data: statuses } = await axios.get(statusUrl, { headers });
    const successStatus = statuses.find(s => s.state === 'success');
    if (successStatus) {
      detectedUrl = successStatus.environment_url || successStatus.target_url;
      console.log("[DEBUG]: Evaluated Deployed URL:", detectedUrl, "against provided:", providedUrl);
      if (isDeploymentUrlMatch(providedUrl, detectedUrl, repo)) {
        matched = true;
        break;
      }
    }
  }

  if (!detectedUrl) {
    throw new Error('No successful deployment status found.');
  }

  if (!matched) {
    throw new Error(`Deployment URL mismatch. Please enter the correct deployment URL (e.g. ${detectedUrl}).`);
  }

  return detectedUrl;
};

export const verifyProjectDetails = async (req, res) => {
    try {
        let { repoOwner, repoName, commitSha, stagingUrl } = req.body;
        
        if (stagingUrl) {
            stagingUrl = stagingUrl.trim();
            if (!stagingUrl.startsWith('http://') && !stagingUrl.startsWith('https://')) {
                stagingUrl = `https://${stagingUrl}`;
            }
        }

        // Basic Validation
        if (!/^[0-9a-f]{40}$/.test(commitSha)) {
             return res.status(400).json({ error: 'Invalid Commit SHA. Must be 40 hexadecimal characters.' });
        }

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
        const versionQuery = `SELECT encrypted_blob, encrypted_aes_key FROM project_versions WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1`;
        const versionResult = await pool.query(versionQuery, [id]);
        
        if (versionResult.rows.length === 0) return res.status(404).json({ error: 'No code found' });

        const { encrypted_blob, encrypted_aes_key } = versionResult.rows[0];
        
        // HYBRID ENCRYPTION CHECK
        if (encrypted_aes_key) {
            console.log("🔓 Serving Hybrid Encrypted File (Client-Side Decryption)");
            
            // Return the Encrypted AES Key in Header
            res.set({
                'Content-Type': 'application/zip', // Browser treats as zip, but it's actually encrypted stream. Client JS must handle.
                'Content-Disposition': `attachment; filename="project_${id}_encrypted.gitlock"`, // Custom extension to hint need for decryption
                'X-GitLock-Key': encrypted_aes_key, // The Key needed to decrypt
                'Access-Control-Expose-Headers': 'X-GitLock-Key' // Important for CORS if needed
            });
            
            // Check if encrypted_blob is Buffer or String (Postgres BYTEA vs TEXT)
            // If stored as TEXT in DB (from our previous update), it's the hex string "iv:data"
            // We should send it as is.
            res.send(encrypted_blob); 
            
        } else {
            console.log("🔓 Legacy Decryption (Server-Side)");
            // Legacy / Fallback: Decrypt on Server
            const { decryptBuffer } = await import('../utils/cryptoService.js');

            const encryptedString = encrypted_blob.toString('utf-8');
            const decryptedBuffer = decryptBuffer(encryptedString);

            res.set({
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="project_${id}_source.zip"`,
                'Content-Length': decryptedBuffer.length
            });
            res.send(decryptedBuffer);
        }

        // LOGGING: CODE_DOWNLOADED
        // We log after starting send, better to do it before but inside try/catch.
        // Using "fire and forget" if response is already streaming, but here we can just await since we sent streams/buffers.
        // Actually res.send sends it. So we must put it before res.send or use fire-and-forget.
        // Let's do parallel execution or before.
        pool.query(
            `INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)`,
            [req.user.id, 'CODE_DOWNLOADED', JSON.stringify({ projectId: id, projectTitle: project.title })]
        ).catch(err => console.error("Logging failed", err));



    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Download Failed' });
    }
};

// --- Advanced Lock Features ---

export const requestLockModification = async (req, res) => {
    try {
        const { projectId, requestType } = req.body; // requestType: 'UNLOCK' or 'DELETE'
        const developerId = req.user.id;

        const project = await findProjectById(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        
        if (project.developer_id !== developerId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Create Request
        const query = `
            INSERT INTO lock_requests (project_id, requester_id, request_type, status)
            VALUES ($1, $2, $3, 'PENDING')
            RETURNING *;
        `;
        await pool.query(query, [projectId, developerId, requestType]);

        // Notify Client
        await createNotification(project.client_id, `Lock Modification Requested: ${requestType} for "${project.title}". Please review.`, 'PROJECT', projectId, `/dashboard/escrow/${projectId}`);

        res.json({ message: 'Request sent to client' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed' });
    }
};

export const approveLockModification = async (req, res) => {
    try {
        const { requestId, otp } = req.body;
        const clientId = req.user.id;

        // 1. Verify OTP (MFA)
        const secretData = await getMFASecret(clientId);
        if (!secretData) return res.status(400).json({ error: 'MFA not set up or expired. Login again to set MFA.' });

        const [hashedOtp, expiryStr] = secretData.split('|');
        if (Date.now() > parseInt(expiryStr)) return res.status(400).json({ error: 'OTP Expired' });
        
        const isValid = await bcrypt.compare(otp, hashedOtp);
        if (!isValid) return res.status(401).json({ error: 'Invalid OTP' });
        
        // 2. Clear OTP (One-time use)
        await clearMFASecret(clientId);

        // 3. Process Request
        const reqQuery = `SELECT * FROM lock_requests WHERE id = $1`;
        const reqResult = await pool.query(reqQuery, [requestId]);
        const lockRequest = reqResult.rows[0];

        if (!lockRequest) return res.status(404).json({ error: 'Request not found' });
        if (lockRequest.status !== 'PENDING') return res.status(400).json({ error: 'Request already processed' });

        // Update Request Status
        await pool.query(`UPDATE lock_requests SET status = 'APPROVED' WHERE id = $1`, [requestId]);

        // Perform Action
        // UNLOCK/DELETE -> Revert to IN_PROGRESS
        await updateProjectStatus(lockRequest.project_id, 'IN_PROGRESS');
        
        // Optional: If 'DELETE', maybe delete versions? 
        // For 'UNLOCK', we just allow overwrite. Let's keep it simple: Status -> IN_PROGRESS allows uploadCode again.
        
        // Notify Developer
        const project = await findProjectById(lockRequest.project_id);
        await createNotification(lockRequest.requester_id, `Lock Modification APPROVED for "${project.title}". You can now update the lock.`, 'PROJECT', lockRequest.project_id, `/dashboard/escrow/${lockRequest.project_id}`);

        res.json({ message: 'Request Approved & Project Unlocked' });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Approval Failed' });
    }
};

export const getProjectLockRequests = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `SELECT * FROM lock_requests WHERE project_id = $1 ORDER BY created_at DESC`;
        const result = await pool.query(query, [id]);
        res.json(result.rows);
    } catch(e) {
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
};

// --- Edit / Delete Project ---
// --- Refined Edit Workflow ---

export const updateSafeDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;
        const clientId = req.user.id;

        const project = await findProjectById(id);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        if (project.client_id !== clientId) return res.status(403).json({ error: 'Unauthorized' });

        // Update only Title and Description
        await pool.query('UPDATE projects SET title = $1, description = $2 WHERE id = $3', [title, description, id]);
        
        // Notify Developer
        if (project.developer_id) {
             createNotification(project.developer_id, `Project details updated: "${title}"`, 'PROJECT', id, `/dashboard/projects/${id}`);
        }

        res.json({ message: 'Project details updated' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed' });
    }
};

export const requestBudgetUpdate = async (req, res) => {
    try {
        const { id } = req.params;
        const { newBudget } = req.body;
        const clientId = req.user.id;

        const project = await findProjectById(id);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        if (project.client_id !== clientId) return res.status(403).json({ error: 'Unauthorized' });

        // 1. No Invite Sent (No dev email, no dev id) -> Direct Update
        if (!project.developer_email && !project.developer_id) {
             await pool.query('UPDATE projects SET budget = $1, pending_budget = NULL WHERE id = $2', [newBudget, id]);
             return res.json({ message: 'Budget updated successfully.' });
        }

        // 2. Invite Sent but Not Accepted (Dev email set, Dev ID null) -> BLOCK
        if (project.developer_email && !project.developer_id) {
            return res.status(400).json({ error: 'Cannot change budget while invite is pending. Revoke invite or wait for acceptance.' });
        }

        // 3. Invite Accepted (Dev ID set) -> Request Approval (Continue below)
        if (!project.developer_id) {
            // Should not happen given above logic, but safety check
            return res.status(400).json({ error: 'Invalid project state.' });
        }

        // Set Pending Budget
        await pool.query('UPDATE projects SET pending_budget = $1 WHERE id = $2', [newBudget, id]);

        // Notify Developer (Action Required)
        await createNotification(project.developer_id, `URGENT: Client requests budget update to ${newBudget} tBNB for "${project.title}". Please approve/reject.`, 'PROJECT', id, `/dashboard/projects/${id}`);
            // Email
        const devUser = await findUserById(project.developer_id);
            await sendNotificationEmail(
            devUser.email, 
            `Budget Change Request: ${project.title}`,
            `The client wants to change the budget to ${newBudget} tBNB.\n\nPlease go to the dashboard to Approve or Reject this change.`,
            `/dashboard/projects/${id}`,
            'Review Budget Request'
        );

        res.json({ message: 'Budget update requested. Waiting for developer approval.' });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to request budget update' });
    }
};

export const sendBudgetApprovalOTP = async (req, res) => {
    try {
        const { id } = req.params;
        const developerId = req.user.id;

        const project = await findProjectById(id);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        if (project.developer_id !== developerId) return res.status(403).json({ error: 'Unauthorized' });
        
        const devUser = await findUserById(developerId);
        
        // Generate and Send OTP
        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10);
        const expiry = Date.now() + 10 * 60 * 1000; // 10 mins
        
        await storeMFASecret(developerId, `${hashedOtp}|${expiry}`);
        
        await sendNotificationEmail(
            devUser.email,
            `Budget Approval OTP: ${project.title}`,
            `Your OTP to approve the budget update is: ${otp}\n\nThis OTP is valid for 10 minutes.`
        );

        res.json({ message: 'OTP sent to your email.' });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
};

export const approveBudgetUpdate = async (req, res) => {
     try {
        const { id } = req.params;
        const { otp } = req.body;
        const developerId = req.user.id;

        const project = await findProjectById(id);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        if (project.developer_id !== developerId) return res.status(403).json({ error: 'Unauthorized' });

        if (!project.pending_budget) return res.status(400).json({ error: 'No pending budget request' });

        // Verify OTP
        const secretData = await getMFASecret(developerId);
        if (!secretData) return res.status(400).json({ error: 'OTP expired or not requested.' });
        const [hashedOtp, expiryStr] = secretData.split('|');
        if (Date.now() > parseInt(expiryStr)) return res.status(400).json({ error: 'OTP Expired' });
        const isValid = await bcrypt.compare(otp, hashedOtp);
        if (!isValid) return res.status(401).json({ error: 'Invalid OTP' });
        await clearMFASecret(developerId);

        const newBudget = project.pending_budget;

        // Apply Change
        await pool.query('UPDATE projects SET budget = $1, pending_budget = NULL WHERE id = $2', [newBudget, id]);

        // Notify Client
        await createNotification(project.client_id, `Budget Approved! New budget for "${project.title}" is ${newBudget} tBNB.`, 'PROJECT', id, `/dashboard/projects/${id}`);
        
        res.json({ message: 'Budget updated successfully' });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed' });
    }
};

export const rejectBudgetUpdate = async (req, res) => {
     try {
        const { id } = req.params;
        const developerId = req.user.id;

        const project = await findProjectById(id);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        if (project.developer_id !== developerId) return res.status(403).json({ error: 'Unauthorized' });

        // Reject Change
        await pool.query('UPDATE projects SET pending_budget = NULL WHERE id = $1', [id]);

        // Notify Client
        await createNotification(project.client_id, `Budget Change Rejected for "${project.title}".`, 'PROJECT', id, `/dashboard/projects/${id}`);
        
        res.json({ message: 'Budget update rejected' });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed' });
    }
};

export const editProject = async (req, res) => {
    // Deprecated in favor of updateSafeDetails + requestBudgetUpdate, but kept for Fallback
    res.status(410).json({ error: 'Please use the new safe update endpoints.' });
};

export const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const clientId = req.user.id;

        const project = await findProjectById(id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (project.client_id !== clientId) {
            return res.status(403).json({ error: 'Unauthorized: You are not the owner.' });
        }
        
        // Prevent deletion if payment/escrow is active? 
        // SAFETY CHECK: Block deletion if project is COMPLETED (Funds Transferred / Work Done) gives history protection
        if (project.status === 'COMPLETED') {
             return res.status(403).json({ error: 'Cannot delete a completed project. It serves as a transaction record.' });
        }

        // Logic: If status is LOCKED_REVIEW, maybe warn?
        

        // Notify Developer BEFORE deleting (so we have their email)
        if (project.developer_email) {
             const devEmail = project.developer_email;

             // In-App Notification to Developer
             const devUser = await findUserByEmail(devEmail);
             if (devUser) {
                 await createNotification(devUser.id, `Project DELETED: "${project.title}" has been deleted by the client.`, 'PROJECT', id, `/dashboard`);
             }

             // Email Notification to Developer
             await sendNotificationEmail(
                devEmail,
                `Project Deleted: ${project.title}`,
                `Hello,\n\nThe client has deleted the project "${project.title}".\n\nThis project is no longer active.\n\n- GitLock Team`
            );
        }

        // Notify Client (In-App Only)
        // Even though they triggered it, it's good for audit/confirmation log in their notification tray
        await createNotification(clientId, `You deleted project "${project.title}".`, 'PROJECT', id, `/dashboard`);

        await deleteProjectModel(id);

        res.json({ message: 'Project Deleted Successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
};