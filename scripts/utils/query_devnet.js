// Dumps recent devnet transaction logs for known buyer/seller addresses.
const { Connection, PublicKey } = require('@solana/web3.js');
const fs = require('fs');
const conn = new Connection('https://api.devnet.solana.com');

async function fetchTxLogs(address, label, limit) {
  let out = '\n' + '='.repeat(80) + '\n';
  out += label + ': ' + address + '\n';
  out += '='.repeat(80) + '\n';
  
  const sigs = await conn.getSignaturesForAddress(new PublicKey(address), { limit: limit });
  
  for (let i = 0; i < sigs.length; i++) {
    const sig = sigs[i];
    out += '\n--- TX ' + i + ' | ' + sig.signature.slice(0, 30) + '... ---\n';
    out += 'Sig: ' + sig.signature + '\n';
    out += 'Err: ' + (sig.err ? JSON.stringify(sig.err) : 'none') + '\n';
    
    try {
      const tx = await conn.getTransaction(sig.signature, { maxSupportedTransactionVersion: 0 });
      if (!tx) { out += '  (tx not found)\n'; continue; }
      
      if (tx.meta && tx.meta.err) {
        out += 'META ERROR: ' + JSON.stringify(tx.meta.err) + '\n';
      }
      
      if (tx.meta && tx.meta.logMessages) {
        out += 'Logs:\n';
        for (const log of tx.meta.logMessages) {
          out += '  ' + log + '\n';
        }
      }
    } catch (e) {
      out += '  fetch error: ' + e.message + '\n';
    }
  }
  return out;
}

async function run() {
  let result = '';
  result += await fetchTxLogs('Egs2wyMb8AyNNSCn88UwuXjFptPvy4Nhf7Cj7xjWSU6c', 'BUYER', 5);
  result += await fetchTxLogs('61KboWyv38393yNMC3kgcNA7SSqQtfL2bwnHbSgSy8PM', 'SELLER', 5);
  fs.writeFileSync('devnet_logs.txt', result, 'utf8');
  console.log('Done. Written to devnet_logs.txt');
}

run().catch(console.error);
