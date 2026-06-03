// Finds a recent non-loader transaction for a known devnet address.
import { Connection, PublicKey } from '@solana/web3.js';
const c = new Connection('https://api.devnet.solana.com');
const pubkey = new PublicKey('9BeBqNy15zt5mq112RrR35GaHNoqkPNFe1brhtEocdpU');
c.getSignaturesForAddress(pubkey, {limit: 50}).then(async sigs => {
  for (let s of sigs) {
    const tx = await c.getTransaction(s.signature, {maxSupportedTransactionVersion: 0});
    if (tx && !tx.meta?.logMessages?.some(l => l.includes('BPFLoaderUpgradeab1e'))) {
      console.log('--- WORKING TX:', s.signature);
      console.log('Programs:', tx.transaction.message.staticAccountKeys.map(k => k.toBase58()).filter(k => k !== '11111111111111111111111111111111' && k !== 'ComputeBudget111111111111111111111111111111'));
      break;
    }
  }
});
