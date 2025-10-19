import { requestResources, releaseResources, debugResourceState } from '../services/resourceManager.js';
import { withdraw, deposit, balanceInquiry } from '../services/transactionService.js';

export async function processTransaction(req, res) {
  const atmIdRaw = req.body.atmId;
  const atmId = Number(atmIdRaw);
  if (isNaN(atmId) || atmId < 1 || atmId > 3) {
    return res.status(400).json({ status: 'WAIT', message: 'Invalid atmId received' });
  }
  const atmIdx = atmId - 1;

  let request;
  if (atmId === 1)      request = [1, 0, 0];
  else if (atmId === 2) request = [0, 1, 0];
  else if (atmId === 3) request = [0, 0, 1];
  else                  request = [1, 0, 0];

  const result = await requestResources(atmIdx, request);

  if (!result.granted) {
    debugResourceState();
    return res.json({ status: 'WAIT', message: result.reason });
  }

  let responseMsg;
  switch (req.body.txnType) {
    case 'withdraw':
      responseMsg = await withdraw(req.body.cardNo, req.body.amount);
      break;
    case 'deposit':
      responseMsg = await deposit(req.body.cardNo, req.body.amount);
      break;
    case 'inquiry':
      responseMsg = await balanceInquiry(req.body.cardNo);
      break;
    default:
      responseMsg = 'Unknown transaction';
      break;
  }

  releaseResources(atmIdx, request);
  debugResourceState();
  res.json({ status: 'DONE', details: responseMsg });
}
