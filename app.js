
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAjXRmYR7cRySBThck2xo7qrrVCvGCjMVY",
  authDomain: "cyrpto-wallet-tracker.firebaseapp.com",
  projectId: "cyrpto-wallet-tracker",
  storageBucket: "cyrpto-wallet-tracker.firebasestorage.app",
  messagingSenderId: "224950296161",
  appId: "1:224950296161:web:cf814cadaad4564b8ad420",
  measurementId: "G-Y41J69H3QZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const walletInput = document.getElementById('wallet-input');
const addWalletButton = document.getElementById('add-wallet');
const walletTableBody = document.getElementById('wallet-table-body');

// Load wallets from localStorage on page load
document.addEventListener('DOMContentLoaded', () => {
  const savedWallets = JSON.parse(localStorage.getItem('wallets')) || [];
  savedWallets.forEach(wallet => addWalletRow(wallet));
});

// Function to fetch Thena locked balance and unlock date
async function fetchThenaBalance(walletAddress) {
  try {
    const response = await fetch(`https://api.debank.com/token/balance_list?user_addr=${walletAddress}`);
    const data = await response.json();

    const thenaData = data.data.find(token => token.token_id === 'THENA_LOCKED_TOKEN_ID'); // Replace with actual Thena ID
    if (!thenaData) return { balance: 0, unlockDate: 'N/A' };

    return {
      balance: thenaData.amount,
      unlockDate: new Date(thenaData.unlock_date * 1000).toISOString().split('T')[0]
    };
  } catch (error) {
    console.error('Error fetching Thena balance:', error);
    return { balance: 'Error', unlockDate: 'Error' };
  }
}

// Function to fetch expected rewards
async function fetchExpectedRewards() {
  try {
    const response = await fetch('https://thena.fi/api/rewards'); // Replace with actual API endpoint
    const data = await response.json();

    const nextEpochRewards = data.next_epoch.total_rewards; // Adjust key path as needed
    return nextEpochRewards || 0;
  } catch (error) {
    console.error('Error fetching expected rewards:', error);
    return 'Error';
  }
}

// Function to calculate $ per 1,000 votes
function calculatePerThousandVotes(balance, rewards) {
  if (!balance || balance === 'Error' || !rewards || rewards === 'Error') return 'Error';
  const votesInThousands = balance / 1000;
  return (rewards / votesInThousands).toFixed(2);
}

// Function to add a wallet row to the table
async function addWalletRow(wallet) {
  const row = document.createElement('tr');

  const expectedRewards = await fetchExpectedRewards();
  const perThousandVotes = calculatePerThousandVotes(wallet.balance, expectedRewards);

  row.innerHTML = `
    <td>${wallet.address}</td>
    <td>${wallet.balance}</td>
    <td>${wallet.unlockDate}</td>
    <td>${expectedRewards}</td>
    <td>${perThousandVotes}</td>
  `;
  walletTableBody.appendChild(row);
}

// Function to save historical data to Firestore
async function saveHistoricalData() {
  const rows = [...document.querySelectorAll('#wallet-table-body tr')].map(row => {
    const cells = row.querySelectorAll('td');
    return {
      address: cells[0].textContent,
      balance: cells[1].textContent,
      unlockDate: cells[2].textContent,
      expectedRewards: cells[3].textContent,
      perThousandVotes: cells[4].textContent
    };
  });

  try {
    await addDoc(collection(db, "historicalData"), {
      timestamp: new Date().toISOString(),
      data: rows
    });
    console.log("Historical data saved successfully!");
  } catch (error) {
    console.error("Error saving historical data: ", error);
  }
}

// Function to load historical data from Firestore
async function loadHistoricalData() {
  try {
    const querySnapshot = await getDocs(collection(db, "historicalData"));
    const history = querySnapshot.docs.map(doc => doc.data());
    console.log("Historical Data:", history);
  } catch (error) {
    console.error("Error loading historical data:", error);
  }
}

// Function to handle adding a wallet
addWalletButton.addEventListener('click', async () => {
  const walletAddress = walletInput.value.trim();
  if (!walletAddress) return;

  const { balance, unlockDate } = await fetchThenaBalance(walletAddress);
  const wallet = { address: walletAddress, balance, unlockDate };
  await addWalletRow(wallet);

  const savedWallets = JSON.parse(localStorage.getItem('wallets')) || [];
  savedWallets.push(wallet);
  localStorage.setItem('wallets', JSON.stringify(savedWallets));

  walletInput.value = '';
});
