
const walletList = document.getElementById('wallet-list');
const addWalletButton = document.getElementById('add-wallet');
const walletInput = document.getElementById('wallet-input');

// Function to fetch protocol balances
async function fetchBalances(walletAddress) {
  try {
    const response = await fetch(`https://api.debank.com/token/balance_list?user_addr=${walletAddress}`);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching balance:', error);
    return [];
  }
}

// Function to render wallet information
async function renderWallet(walletAddress) {
  const balances = await fetchBalances(walletAddress);
  const walletItem = document.createElement('li');
  walletItem.textContent = `Wallet: ${walletAddress} - Balances: ${
    balances.length ? balances.map(b => `${b.token.symbol}: ${b.amount}`).join(', ') : 'No data'
  }`;
  walletList.appendChild(walletItem);
}

// Add wallet to the list
addWalletButton.addEventListener('click', () => {
  const walletAddress = walletInput.value.trim();
  if (walletAddress) {
    renderWallet(walletAddress);
    walletInput.value = ''; // Clear input after adding
  }
});
