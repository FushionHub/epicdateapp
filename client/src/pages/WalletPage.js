import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getWallet, getTransactions, initializePayment } from '../services/supabaseService';

const WalletPage = () => {
  const { currentUser } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadWalletData = async () => {
      setLoading(true);
      const walletData = await getWallet(currentUser.uid);
      setWallet(walletData);
      if (walletData) {
        const transactionData = await getTransactions(walletData.id);
        setTransactions(transactionData);
      }
      setLoading(false);
    };
    loadWalletData();
  }, [currentUser]);

  const handleAddFunds = async (e) => {
    e.preventDefault();
    setError('');
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setLoading(true);
    const paymentData = await initializePayment(numericAmount, 'NGN'); // Assuming NGN for now
    setLoading(false);

    if (paymentData && paymentData.authorization_url) {
      // Redirect user to Paystack's checkout page
      window.location.href = paymentData.authorization_url;
    } else {
      setError('Could not initiate payment. Please try again.');
    }
  };

  if (loading && !wallet) {
    return <div>Loading wallet...</div>;
  }

  return (
    <div>
      <Link to="/">Back to Dashboard</Link>
      <h1>My Wallet</h1>
      {wallet ? (
        <div>
          <h2>Current Balance: ${wallet.balance}</h2>
          <form onSubmit={handleAddFunds}>
            <h3>Add Funds</h3>
            {error && <p style={{color: 'red'}}>{error}</p>}
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              step="0.01"
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Initializing...' : 'Add Funds with Paystack'}
            </button>
          </form>
        </div>
      ) : (
        <p>Could not load wallet information.</p>
      )}

      <hr />

      <h3>Transaction History</h3>
      {transactions.length > 0 ? (
        <table style={{ width: '100%', textAlign: 'left' }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.id}>
                <td>{new Date(tx.created_at).toLocaleDateString()}</td>
                <td>{tx.transaction_type}</td>
                <td>{tx.description}</td>
                <td>${tx.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No transactions yet.</p>
      )}
    </div>
  );
};

export default WalletPage;
