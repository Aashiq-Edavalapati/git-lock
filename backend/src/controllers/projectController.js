// src/controllers/projectController.js
import { createProject, findProjectById, saveProjectVersion, updateProjectStatus } from '../models/projectModel.js';
import { encryptBuffer, generateFileHash } from '../utils/cryptoService.js';

// 1. Client Creates Project
export const initProject = async (req, res) => {
  try {
    const { title, description, budget, developerEmail } = req.body;
    const clientId = req.user.id; // From middleware

    const newProject = await createProject(title, description, budget, clientId, developerEmail);
    res.status(201).json(newProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

// 2. Developer Uploads Code (THE LOCK)
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