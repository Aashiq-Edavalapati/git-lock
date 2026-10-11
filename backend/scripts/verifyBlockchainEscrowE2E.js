import { ethers } from 'ethers';
import pool from '../src/config/db.js';
import {
  generateDealId,
  getOnchainDeal,
  createOracleAttestation
} from '../src/services/escrowService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const abiPath = path.resolve(__dirname, '../src/config/GitLockEscrowABI.json');
const escrowAbi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

const rpcUrl = process.env.BSC_TESTNET_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545/';
const contractAddress = process.env.ESCROW_CONTRACT_ADDRESS || '0x1642fb0220915E10b9e21cC18EFE10297154C67A';
const oraclePrivateKey = process.env.ORACLE_PRIVATE_KEY || '0x0e0c2034a2356eca34bade83bef909f3a21bf8554eaa74b0f34f3ada0c98f101';

const provider = new ethers.JsonRpcProvider(rpcUrl);
const testWallet = new ethers.Wallet(oraclePrivateKey, provider);

async function runE2E() {
  console.log('====================================================');
  console.log('🚀 STARTING GITLOCK BLOCKCHAIN ESCROW E2E VERIFICATION');
  console.log('====================================================');
  console.log(`📡 RPC: ${rpcUrl}`);
  console.log(`📜 Contract: ${contractAddress}`);
  console.log(`👤 Test/Oracle Wallet: ${testWallet.address}`);

  const balance = await provider.getBalance(testWallet.address);
  console.log(`💰 Wallet Balance: ${ethers.formatEther(balance)} tBNB`);

  // We will test on-chain with minimal amount: 0.00005 tBNB to conserve funds!
  const minimalDepositBnb = '0.00005';
  const minimalDepositWei = ethers.parseEther(minimalDepositBnb);

  const testProjectId = `test-escrow-${Date.now()}`;
  const dealId = generateDealId(testProjectId);
  console.log(`🆔 Test Project ID: ${testProjectId}`);
  console.log(`🔑 Deal ID (bytes32): ${dealId}`);

  const clientAddress = testWallet.address;
  // Use a secondary address for developer (e.g. 0x0000000000000000000000000000000000000001 or deployer)
  // Contract reverts if developer == client (self dealing prevention!)
  const devWallet = ethers.Wallet.createRandom();
  const developerAddress = devWallet.address;
  console.log(`👨‍💻 Generated Developer Address: ${developerAddress}`);

  try {
    // ----------------------------------------------------
    // STEP 1 & 2: Setup Database Project Record
    // ----------------------------------------------------
    console.log('\n--- Step 1 & 2: Database Record & Locked Code Setup ---');
    const userRes = await pool.query(
      `INSERT INTO users (email, full_name, role, wallet_address) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [`testclient_${Date.now()}@example.com`, 'Test Client', 'CLIENT', clientAddress]
    );
    const clientId = userRes.rows[0].id;

    const devRes = await pool.query(
      `INSERT INTO users (email, full_name, role, wallet_address) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [`testdev_${Date.now()}@example.com`, 'Test Dev', 'DEVELOPER', developerAddress]
    );
    const devId = devRes.rows[0].id;

    const projRes = await pool.query(
      `INSERT INTO projects (id, title, budget, client_id, developer_id, status)
       VALUES (gen_random_uuid(), 'E2E Blockchain Escrow Project', $1, $2, $3, 'LOCKED_REVIEW')
       RETURNING *`,
      [minimalDepositBnb, clientId, devId]
    );
    const dbProject = projRes.rows[0];
    console.log(`✅ DB Project Created: ${dbProject.id} (Status: ${dbProject.status})`);

    // ----------------------------------------------------
    // STEP 3: Client Approval
    // ----------------------------------------------------
    console.log('\n--- Step 3: Client Deployment Approval ---');
    await pool.query(
      `UPDATE projects SET deployment_approved = true, status = 'APPROVED' WHERE id = $1`,
      [dbProject.id]
    );
    console.log('✅ Client approved deployment. Status updated to APPROVED.');

    // ----------------------------------------------------
    // STEP 4: On-Chain Escrow Funding
    // ----------------------------------------------------
    console.log(`\n--- Step 4: Escrow Funding (${minimalDepositBnb} tBNB on BSC Testnet) ---`);
    const escrowContract = new ethers.Contract(contractAddress, escrowAbi, testWallet);

    const repoFullName = 'gitlock-team/sample-verified-repo';
    console.log(`Submitting createAndFundDeal on-chain...`);
    const fundTx = await escrowContract.createAndFundDeal(
      dealId,
      developerAddress,
      repoFullName,
      { value: minimalDepositWei }
    );
    console.log(`Transaction submitted: ${fundTx.hash}. Waiting for confirmation...`);
    const fundReceipt = await fundTx.wait();
    console.log(`✅ Escrow Funded On-Chain in Block ${fundReceipt.blockNumber}! Gas Used: ${fundReceipt.gasUsed}`);

    // Update DB
    await pool.query(
      `UPDATE projects 
       SET escrow_deal_id = $1, escrow_tx_hash = $2, escrow_amount = $3, escrow_funded = true, status = 'ESCROW_FUNDED'
       WHERE id = $4`,
      [dealId, fundTx.hash, minimalDepositBnb, dbProject.id]
    );

    // Verify On-Chain Deal State
    const onchainDeal = await getOnchainDeal(dealId);
    console.log(`🔍 Verified On-Chain Deal: Amount=${onchainDeal.amount} tBNB | State=${onchainDeal.state} (Funded=2)`);
    if (onchainDeal.state !== 2) throw new Error(`Expected onchain state 2 (Funded), got ${onchainDeal.state}`);

    // ----------------------------------------------------
    // STEP 5 & 6: Repository Transfer & Oracle Attestation
    // ----------------------------------------------------
    console.log('\n--- Step 5 & 6: Oracle Attestation for GitHub Repo Transfer ---');
    const { attestation, signature, oracleAddress } = await createOracleAttestation({
      dealId,
      developerAddress,
      clientAddress,
      repoFullName
    });

    console.log(`Signed Oracle Attestation:`);
    console.log(`  Oracle: ${oracleAddress}`);
    console.log(`  Nonce: ${attestation.nonce}`);
    console.log(`  Deadline: ${attestation.deadline}`);
    console.log(`  Signature: ${signature}`);

    await pool.query(
      `UPDATE projects SET transfer_verified = true, oracle_signature = $1, status = 'OWNERSHIP_VERIFIED' WHERE id = $2`,
      [signature, dbProject.id]
    );
    console.log(`✅ Attestation saved to DB. Status updated to OWNERSHIP_VERIFIED.`);

    // ----------------------------------------------------
    // STEP 7: Payment Release on Smart Contract
    // ----------------------------------------------------
    console.log('\n--- Step 7: Smart Contract Payment Release ---');
    console.log(`Calling releasePaymentWithAttestation on-chain...`);

    const devInitialBalance = await provider.getBalance(developerAddress);

    const releaseTx = await escrowContract.releasePaymentWithAttestation(attestation, signature);
    console.log(`Transaction submitted: ${releaseTx.hash}. Waiting for confirmation...`);
    const releaseReceipt = await releaseTx.wait();
    console.log(`✅ Payment Released On-Chain in Block ${releaseReceipt.blockNumber}! Gas Used: ${releaseReceipt.gasUsed}`);

    const devFinalBalance = await provider.getBalance(developerAddress);
    console.log(`💵 Developer Initial Balance: ${ethers.formatEther(devInitialBalance)} tBNB`);
    console.log(`💵 Developer Final Balance: ${ethers.formatEther(devFinalBalance)} tBNB`);
    console.log(`🎉 Developer Received: ${ethers.formatEther(devFinalBalance - devInitialBalance)} tBNB!`);

    if (devFinalBalance - devInitialBalance !== minimalDepositWei) {
      throw new Error(`Developer payout mismatch!`);
    }

    // Verify On-Chain Deal Completed State
    const completedDeal = await getOnchainDeal(dealId);
    console.log(`🔍 Verified Final On-Chain Deal State: ${completedDeal.state} (Completed=4)`);
    if (completedDeal.state !== 4) throw new Error(`Expected onchain state 4 (Completed), got ${completedDeal.state}`);

    // Complete in DB
    await pool.query(
      `UPDATE projects SET status = 'COMPLETED', release_tx_hash = $1 WHERE id = $2`,
      [releaseTx.hash, dbProject.id]
    );

    console.log('\n====================================================');
    console.log('🏆 ALL 7 STEPS OF THE GITLOCK PROTOCOL PASSED ON-CHAIN!');
    console.log('====================================================');

  } catch (err) {
    console.error('❌ E2E Verification Error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runE2E();
