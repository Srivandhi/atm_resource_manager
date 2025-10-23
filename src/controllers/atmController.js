import { requestResources, releaseResources, debugResourceState } from '../services/resourceManager.js';
import { withdraw, deposit, balanceInquiry } from '../services/transactionService.js';

/**
 * Determine resource requirements based on transaction type
 */
function getResourceRequest(atmId, txnType) {
  const atmIdx = atmId - 1;

  switch (txnType) {
    case 'withdraw':
      // needs database + cash dispenser
      return [1, 1, 0];
    case 'deposit':
      // needs database + cash acceptor
      return [1, 0, 1];
    case 'inquiry':
      // only needs database
      return [1, 0, 0];
    default:
      // fallback
      return [1, 0, 0];
  }
}

export async function processTransaction(req, res) {
  const { atmId: atmIdRaw, txnType, cardNo, amount } = req.body;

  const atmId = Number(atmIdRaw);
  if (isNaN(atmId) || atmId < 1 || atmId > 3) {
    return res.status(400).json({ 
      status: 'ERROR', 
      message: 'Invalid atmId. Must be 1, 2, or 3' 
    });
  }

  if (!['withdraw', 'deposit', 'inquiry'].includes(txnType)) {
    return res.status(400).json({
      status: 'ERROR',
      message: 'Invalid transaction type. Must be withdraw, deposit, or inquiry'
    });
  }

  const atmIdx = atmId - 1;
  const request = getResourceRequest(atmId, txnType);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🏧 ATM ${atmId} - ${txnType.toUpperCase()} Transaction`);
  console.log(`   Card: ${cardNo}${amount ? `, Amount: ${amount}` : ''}`);
  console.log(`${'='.repeat(60)}`);

  try {
    const result = await requestResources(atmIdx, request);

    if (!result.granted) {
      console.log(`⏳ Transaction queued - ${result.reason}`);
      debugResourceState();
      return res.json({ 
        status: 'WAIT', 
        message: `Transaction queued: ${result.reason}`, 
        atmId, txnType
      });
    }

    console.log(`✅ Resources allocated to ATM ${atmId}`);

    let responseMsg = '';
    let success = true;

    try {
      switch (txnType) {
        case 'withdraw':
          responseMsg = await withdraw(cardNo, amount);
          success = !responseMsg.includes('unavailable') && !responseMsg.includes('Insufficient');
          break;

        case 'deposit':
          responseMsg = await deposit(cardNo, amount);
          success = !responseMsg.includes('unavailable');
          break;

        case 'inquiry':
          responseMsg = await balanceInquiry(cardNo);
          success = !responseMsg.includes('unavailable');
          break;

        default:
          responseMsg = 'Unknown transaction type';
          success = false;
          break;
      }

      console.log(`📋 Transaction result: ${responseMsg}`);

    } catch (error) {
      console.error(`❌ Transaction error:`, error);
      responseMsg = `Transaction failed: ${error.message}`;
      success = false;
    } finally {
      releaseResources(atmIdx, request);
      console.log(`🔓 Resources released by ATM ${atmId}`);
      debugResourceState();
    }

    return res.json({
      status: success ? 'DONE' : 'ERROR',
      message: responseMsg,
      atmId,
      txnType,
    });

  } catch (error) {
    console.error(`❌ Fatal error in ATM ${atmId}:`, error);
    debugResourceState();
    return res.status(500).json({ 
      status: 'ERROR', 
      message: 'Internal server error',
      details: error.message
    });
  }
}
export function getResourceStatus(req, res) {
  debugResourceState();
  res.json({ status: 'OK', message: 'Resource status logged to console' });
}

export function emergencyRelease(req, res) {
  const { atmId } = req.body;
  if (!atmId || atmId < 1 || atmId > 3) {
    return res.status(400).json({ status: 'ERROR', message: 'Invalid atmId' });
  }
  const atmIdx = atmId - 1;
  // Maximum resources to be released for demo
  releaseResources(atmIdx, [3, 3, 3]);
  debugResourceState();
  res.json({ status: 'OK', message: `Emergency release completed for ATM ${atmId}` });
}