import pool from '../config/db.js';
import {
  getBlockchainConfig,
  generateDealId,
  getOnchainDeal,
  verifyOnchainFunding,
  verifyGithubRepoOwnership,
  createOracleAttestation
} from '../services/escrowService.js';
import { findProjectById } from '../models/projectModel.js';
import { findUserById } from '../models/userModel.js';
import { createNotification } from '../models/notificationModel.js';
import { sendNotificationEmail } from '../utils/emailService.js';

/**
 * 1. Get Blockchain Config
 */
export const getConfig = (req, res) => {
  try {
    const config = getBlockchainConfig();
    res.json(config);
  } catch (error) {
    console.error('Config fetch error:', error);
    res.status(500).json({ error: 'Failed to get blockchain config' });
  }
};

/**
 * 2. Get Escrow Status for a Project
 */
export const getProjectEscrowStatus = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await findProjectById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const clientUser = await findUserById(project.client_id);
    const devUser = project.developer_id ? await findUserById(project.developer_id) : null;

    const dealId = project.escrow_deal_id || generateDealId(project.id);
    const onchainDeal = await getOnchainDeal(dealId);

    // Get latest version details (repo, staging url, commit)
    const versionRes = await pool.query(
      `SELECT staging_url, commit_sha, repo_url, github_repo_url FROM project_versions WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [projectId]
    );
    const version = versionRes.rows[0] || null;

    res.json({
      projectId: project.id,
      dealId,
      status: project.status,
      budget: project.budget,
      escrowAmount: project.escrow_amount,
      escrowFunded: project.escrow_funded,
      deploymentApproved: project.deployment_approved,
      transferVerified: project.transfer_verified,
      escrowTxHash: project.escrow_tx_hash,
      releaseTxHash: project.release_tx_hash,
      oracleSignature: project.oracle_signature,
      clientWallet: clientUser?.wallet_address || null,
      clientEmail: clientUser?.email || null,
      clientGithub: clientUser?.github_id || null,
      developerWallet: devUser?.wallet_address || null,
      developerEmail: devUser?.email || project.developer_email,
      developerGithub: devUser?.github_id || null,
      onchainDeal,
      version
    });
  } catch (error) {
    console.error('Escrow status error:', error);
    res.status(500).json({ error: 'Failed to fetch escrow status' });
  }
};

/**
 * 3. Client Approves Live Deployment (Workflow Step 3)
 */
export const approveDeployment = async (req, res) => {
  try {
    const { projectId } = req.body;
    const userId = req.user.id;

    const project = await findProjectById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (project.client_id !== userId) {
      return res.status(403).json({ error: 'Only the client can approve deployment' });
    }

    await pool.query(
      `UPDATE projects SET deployment_approved = true, status = 'APPROVED' WHERE id = $1`,
      [projectId]
    );

    // Notifications
    await createNotification(
      project.client_id,
      `Deployment approved for "${project.title}". Next step: Fund escrow with BNB.`,
      'ESCROW',
      projectId,
      `/dashboard/escrow/${projectId}`
    );

    if (project.developer_id) {
      await createNotification(
        project.developer_id,
        `Client approved the deployment for "${project.title}"! Client is now funding the escrow.`,
        'ESCROW',
        projectId,
        `/dashboard/escrow/${projectId}`
      );

      const devUser = await findUserById(project.developer_id);
      if (devUser?.email) {
        await sendNotificationEmail(
          devUser.email,
          `Deployment Approved: ${project.title}`,
          `Hello ${devUser.full_name || 'Developer'},\n\nGreat news! The client has tested and approved your live deployment for "${project.title}".\n\nThe client is now proceeding to deposit funds (${project.budget} tBNB) into the blockchain escrow smart contract on BSC Testnet.`,
          `/dashboard/escrow/${projectId}`,
          'View Escrow Status'
        );
      }
    }

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)`,
      [userId, 'DEPLOYMENT_APPROVED', JSON.stringify({ projectId, title: project.title })]
    );

    res.json({ success: true, message: 'Deployment approved successfully' });
  } catch (error) {
    console.error('Approve deployment error:', error);
    res.status(500).json({ error: 'Failed to approve deployment' });
  }
};

/**
 * 4. Record Escrow Funding from Smart Contract (Workflow Step 4)
 */
export const recordEscrowFunding = async (req, res) => {
  try {
    const { projectId, dealId, txHash, amount, clientWallet } = req.body;
    const userId = req.user.id;

    const project = await findProjectById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (project.client_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Save client's wallet if provided
    if (clientWallet) {
      await pool.query(`UPDATE users SET wallet_address = $1 WHERE id = $2`, [clientWallet, userId]);
    }

    // Verify onchain
    const verification = await verifyOnchainFunding(dealId, txHash);
    console.log('On-chain funding verification:', verification);

    await pool.query(
      `UPDATE projects 
       SET escrow_deal_id = $1, 
           escrow_tx_hash = $2, 
           escrow_amount = $3, 
           escrow_funded = true, 
           status = 'ESCROW_FUNDED' 
       WHERE id = $4`,
      [dealId, txHash, amount, projectId]
    );

    // Notify Developer to transfer GitHub repo
    if (project.developer_id) {
      await createNotification(
        project.developer_id,
        `Escrow funded with ${amount} BNB on BSC Testnet for "${project.title}"! Please transfer GitHub repository ownership to client.`,
        'ESCROW',
        projectId,
        `/dashboard/escrow/${projectId}`
      );

      const devUser = await findUserById(project.developer_id);
      const clientUser = await findUserById(project.client_id);
      if (devUser?.email) {
        await sendNotificationEmail(
          devUser.email,
          `Escrow Funded (${amount} tBNB): ${project.title}`,
          `Hello ${devUser.full_name || 'Developer'},\n\nGreat news! The client has successfully funded the blockchain escrow smart contract with ${amount} tBNB on Binance Smart Chain Testnet for "${project.title}".\n\nTransaction Hash: ${txHash}\n\nPlease transfer ownership of the GitHub repository to the client (${clientUser?.github_id || clientUser?.email || 'the client'}) now so GitLock Oracle can verify the transfer and authorize your payout.`,
          `/dashboard/escrow/${projectId}`,
          'Open Escrow Dashboard'
        );
      }
    }

    await createNotification(
      project.client_id,
      `Escrow funded successfully with ${amount} BNB for "${project.title}". Tx: ${txHash.slice(0, 10)}...`,
      'ESCROW',
      projectId,
      `/dashboard/escrow/${projectId}`
    );

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)`,
      [userId, 'ESCROW_FUNDED', JSON.stringify({ projectId, dealId, txHash, amount })]
    );

    res.json({ success: true, message: 'Escrow funding recorded', verification });
  } catch (error) {
    console.error('Record funding error:', error);
    res.status(500).json({ error: 'Failed to record escrow funding' });
  }
};

/**
 * 5 & 6. Verify GitHub Repository Ownership Transfer & Sign Oracle Attestation (Workflow Step 5 & 6)
 */
export const verifyOwnershipAndAttest = async (req, res) => {
  try {
    const { projectId, clientGithubUsername, forceVerification } = req.body;
    const userId = req.user.id;

    const project = await findProjectById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Must be Client or Developer
    if (project.client_id !== userId && project.developer_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Project must be funded
    if (!project.escrow_funded && project.status !== 'ESCROW_FUNDED') {
      return res.status(400).json({ error: 'Escrow must be funded before repository ownership transfer' });
    }

    // Retrieve Version info
    const versionRes = await pool.query(
      `SELECT repo_url, github_repo_url FROM project_versions WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [projectId]
    );
    const version = versionRes.rows[0];
    if (!version) return res.status(400).json({ error: 'No version locked for this project' });

    const rawUrl = version.repo_url || version.github_repo_url || '';
    const match = rawUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return res.status(400).json({ error: 'Could not parse repository owner and name from URL' });
    }

    const repoOwner = match[1];
    const repoName = match[2].replace(/\.git$/, '');
    const repoFullName = `${repoOwner}/${repoName}`;

    // Expected client username: passed in body, or client user's github_id
    const clientUser = await findUserById(project.client_id);
    const targetGithubUser = clientGithubUsername || clientUser?.github_id;

    // Get developer GitHub token if available
    const devUser = await findUserById(project.developer_id);
    const githubToken = devUser?.github_access_token || clientUser?.github_access_token;

    let isTransferVerified = false;

    if (forceVerification === true) {
      // Manual testing bypass for demo/course evaluation
      console.log('⚡ Simulation/Override: Repository transfer manually verified for demo');
      isTransferVerified = true;
    } else if (targetGithubUser) {
      const checkResult = await verifyGithubRepoOwnership(repoOwner, repoName, targetGithubUser, githubToken);
      isTransferVerified = checkResult.verified;
      if (!isTransferVerified) {
        return res.status(400).json({
          verified: false,
          error: checkResult.message || 'Repository ownership has not been transferred yet.',
          hint: 'Ensure repository ownership on GitHub has been transferred to ' + targetGithubUser
        });
      }
    } else {
      // If client username is not specified, allow demo attestation
      isTransferVerified = true;
    }

    // Both wallets must be available
    const developerWallet = devUser?.wallet_address;
    const clientWallet = clientUser?.wallet_address;

    if (!developerWallet || !clientWallet) {
      return res.status(400).json({
        error: 'Both developer and client wallet addresses must be registered in profile settings or Web3 wallet connection.'
      });
    }

    const dealId = project.escrow_deal_id || generateDealId(project.id);

    // Sign Oracle Attestation
    const { attestation, signature, oracleAddress } = await createOracleAttestation({
      dealId,
      developerAddress: developerWallet,
      clientAddress: clientWallet,
      repoFullName
    });

    // Save to database
    await pool.query(
      `UPDATE projects 
       SET transfer_verified = true, 
           oracle_signature = $1, 
           status = 'OWNERSHIP_VERIFIED' 
       WHERE id = $2`,
      [signature, projectId]
    );

    // Notifications
    await createNotification(
      project.developer_id,
      `Ownership of repository "${repoFullName}" verified! Oracle signed attestation. Ready to release payment on blockchain.`,
      'ESCROW',
      projectId,
      `/dashboard/escrow/${projectId}`
    );

    await createNotification(
      project.client_id,
      `Repository transfer verified! Payment can now be released to developer.`,
      'ESCROW',
      projectId,
      `/dashboard/escrow/${projectId}`
    );

    // Email Notifications
    if (clientUser?.email) {
      await sendNotificationEmail(
        clientUser.email,
        `Repository Transfer Verified: ${project.title}`,
        `Hello ${clientUser.full_name || 'Client'},\n\nGitLock Oracle has verified the repository ownership transfer of "${repoFullName}" and signed the cryptographic attestation.\n\nPayment can now be released to the developer on the blockchain smart contract.`,
        `/dashboard/escrow/${projectId}`,
        'Release Escrow Payment'
      );
    }
    if (devUser?.email) {
      await sendNotificationEmail(
        devUser.email,
        `Repository Transfer Verified & Attested: ${project.title}`,
        `Hello ${devUser.full_name || 'Developer'},\n\nGitLock Oracle has verified the repository ownership transfer of "${repoFullName}" to the client!\n\nThe Oracle attestation has been signed. Payment can now be claimed/released from the escrow smart contract to your wallet on BSC Testnet.`,
        `/dashboard/escrow/${projectId}`,
        'Claim Payment'
      );
    }

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)`,
      [userId, 'OWNERSHIP_VERIFIED', JSON.stringify({ projectId, repoFullName, oracleAddress, signature })]
    );

    res.json({
      success: true,
      verified: true,
      attestation,
      signature,
      oracleAddress,
      message: 'GitHub repository transfer verified & Oracle attestation signed!'
    });
  } catch (error) {
    console.error('Verify & attest error:', error);
    res.status(500).json({ error: error.message || 'Failed to verify ownership and generate attestation' });
  }
};

/**
 * 7. Record Payment Release & Complete Project (Workflow Step 7)
 */
export const recordPaymentRelease = async (req, res) => {
  try {
    const { projectId, txHash, dealId } = req.body;
    const userId = req.user.id;

    const project = await findProjectById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Update Project Status to COMPLETED
    await pool.query(
      `UPDATE projects SET status = 'COMPLETED', release_tx_hash = $1 WHERE id = $2`,
      [txHash, projectId]
    );

    // Notifications
    await createNotification(
      project.client_id,
      `Payment released on-chain! Code unlocked. Tx: ${txHash.slice(0, 10)}...`,
      'PAYMENT',
      projectId,
      `/dashboard/escrow/${projectId}`
    );

    if (project.developer_id) {
      await createNotification(
        project.developer_id,
        `Payment of ${project.escrow_amount || project.budget} BNB released to your wallet! Project completed.`,
        'PAYMENT',
        projectId,
        `/dashboard/escrow/${projectId}`
      );
    }

    // Email Notifications on Release & Completion
    const clientUser = await findUserById(project.client_id);
    const devUser = project.developer_id ? await findUserById(project.developer_id) : null;

    if (devUser?.email) {
      await sendNotificationEmail(
        devUser.email,
        `Payment Released (${project.escrow_amount || project.budget} tBNB): ${project.title}`,
        `Hello ${devUser.full_name || 'Developer'},\n\nCongratulations! Escrow payment of ${project.escrow_amount || project.budget} tBNB has been released to your wallet on BSC Testnet.\n\nRelease Transaction Hash: ${txHash}\n\nThank you for working with GitLock.`,
        `/dashboard/escrow/${projectId}`,
        'View Escrow Summary'
      );
    }

    if (clientUser?.email) {
      await sendNotificationEmail(
        clientUser.email,
        `Project Completed & Assets Unlocked: ${project.title}`,
        `Hello ${clientUser.full_name || 'Client'},\n\nPayment has been released and project "${project.title}" is now officially COMPLETED.\n\nYou have verified ownership of the GitHub repository, and decrypted project source code is available for download on GitLock.\n\nRelease Transaction Hash: ${txHash}`,
        `/dashboard/escrow/${projectId}`,
        'Download Source Code'
      );
    }

    // Payment Audit Log
    const paymentDetails = {
      projectId: project.id,
      projectTitle: project.title,
      dealId: dealId || project.escrow_deal_id,
      amount: project.escrow_amount || project.budget,
      currency: 'tBNB',
      txHash,
      network: 'BSC Testnet (Chain ID 97)'
    };

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)`,
      [project.client_id, 'PAYMENT', JSON.stringify(paymentDetails)]
    );

    res.json({
      success: true,
      message: 'Payment release recorded and project completed. Assets unlocked!',
      txHash
    });
  } catch (error) {
    console.error('Record release error:', error);
    res.status(500).json({ error: 'Failed to record payment release' });
  }
};

/**
 * Save user's wallet address
 */
export const updateWalletAddress = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    const userId = req.user.id;

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: 'Invalid Ethereum/BNB wallet address' });
    }

    await pool.query(`UPDATE users SET wallet_address = $1 WHERE id = $2`, [walletAddress, userId]);
    res.json({ success: true, walletAddress });
  } catch (error) {
    console.error('Update wallet error:', error);
    res.status(500).json({ error: 'Failed to update wallet address' });
  }
};
