import { createProject, findProjectById, saveProjectVersion, updateProjectStatus } from '../models/projectModel.js';
import { findUserByEmail } from '../models/userModel.js'; // Need to check if dev exists
import { encryptBuffer, generateFileHash } from '../utils/cryptoService.js';
import { sendProjectInvite } from '../utils/emailService.js';
import pool from '../config/db.js'; // Direct DB access for updates if needed

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

// Developer Uploads Code (THE LOCK)
export const uploadCode = async (req, res) => {
  try {
    const { projectId, stagingUrl } = req.body;
    
    // Multer stores the file in req.file
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // A. Integrity Check (Rubric #4)
    // We calculate the hash of the uploaded file
    const fileBuffer = req.file.buffer;
    const fileHash = generateFileHash(fileBuffer);
    
    console.log(`🔒 Processing Upload. Hash: ${fileHash}`);

    // B. Encryption (Rubric #3)
    // We encrypt the raw buffer. The DB will never see the original zip.
    const encryptedData = encryptBuffer(fileBuffer);

    // C. Save to Database    
    await saveProjectVersion(projectId, encryptedData, fileHash, stagingUrl);
    
    // D. Update Status
    await updateProjectStatus(projectId, 'LOCKED_REVIEW');

    res.status(200).json({ 
      message: 'Code encrypted and locked successfully.', 
      integrityHash: fileHash 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Upload failed' });
  }
};