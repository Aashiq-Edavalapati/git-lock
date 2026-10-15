import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { ethers } from 'ethers';
import {
  generateDealId,
  getOnchainDeal
} from '../src/services/escrowService.js';

const abiPath = path.resolve(__dirname, '../src/config/GitLockEscrowABI.json');
const escrowAbi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

const rpcUrl = process.env.BSC_TESTNET_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545/';
const contractAddress = process.env.ESCROW_CONTRACT_ADDRESS || '0x30CF8a5fa441D39e0604781C24ADeeCBcbfecD49';
const oraclePrivateKey = process.env.ORACLE_PRIVATE_KEY || '0x0e0c2034a2356eca34bade83bef909f3a21bf8554eaa74b0f34f3ada0c98f101';

const provider = new ethers.JsonRpcProvider(rpcUrl);
const testWallet = new ethers.Wallet(oraclePrivateKey, provider);

async function runRefundTest() {
  console.log('====================================================');
  console.log('🔄 STARTING GITLOCK BLOCKCHAIN REFUND E2E TEST');
  console.log('====================================================');
  console.log(`📡 RPC: ${rpcUrl}`);
  console.log(`📜 Contract: ${contractAddress}`);
  console.log(`👤 Client/Caller: ${testWallet.address}`);

  const initialBalance = await provider.getBalance(testWallet.address);
  console.log(`💰 Initial Balance: ${ethers.formatEther(initialBalance)} tBNB`);

  const minimalDepositBnb = '0.00005';
  const minimalDepositWei = ethers.parseEther(minimalDepositBnb);

  const testProjectId = `test-refund-${Date.now()}`;
  const dealId = generateDealId(testProjectId);
  const repoFullName = 'gitlock-team/sample-refundable-repo';

  const devWallet = ethers.Wallet.createRandom();
  const developerAddress = devWallet.address;
  console.log(`👨‍💻 Designated Dev Address: ${developerAddress}`);

  try {
    const escrowContract = new ethers.Contract(contractAddress, escrowAbi, testWallet);

    // 1. Fund Deal
    console.log(`\n1. Creating and funding deal with ${minimalDepositBnb} tBNB...`);
    const fundTx = await escrowContract.createAndFundDeal(
      dealId,
      developerAddress,
      repoFullName,
      { value: minimalDepositWei }
    );
    console.log(`Fund Tx: ${fundTx.hash}. Waiting for confirmation...`);
    await fundTx.wait();

    const dealAfterFund = await getOnchainDeal(dealId);
    console.log(`🔍 Verified On-Chain State: ${dealAfterFund.state} (Funded=2)`);
    if (dealAfterFund.state !== 2) throw new Error(`Expected state 2, got ${dealAfterFund.state}`);

    // 2. Client initiates Refund
    console.log(`\n2. Calling refund() on contract...`);
    const balanceBeforeRefund = await provider.getBalance(testWallet.address);

    const refundTx = await escrowContract.refund(dealId);
    console.log(`Refund Tx: ${refundTx.hash}. Waiting for confirmation...`);
    const refundReceipt = await refundTx.wait();
    console.log(`✅ Refund Confirmed in Block ${refundReceipt.blockNumber}! Gas Used: ${refundReceipt.gasUsed}`);

    const balanceAfterRefund = await provider.getBalance(testWallet.address);
    console.log(`💰 Balance After Refund: ${ethers.formatEther(balanceAfterRefund)} tBNB`);

    // Verify Deal State is Refunded (5)
    const dealAfterRefund = await getOnchainDeal(dealId);
    console.log(`🔍 Verified Final State: ${dealAfterRefund.state} (Refunded=5)`);
    if (dealAfterRefund.state !== 5) throw new Error(`Expected state 5, got ${dealAfterRefund.state}`);

    console.log('\n====================================================');
    console.log('🎉 ON-CHAIN REFUND VERIFICATION COMPLETED SUCCESSFULLY!');
    console.log('====================================================');

  } catch (err) {
    console.error('❌ Refund Verification Error:', err);
    process.exit(1);
  }
}

runRefundTest();
