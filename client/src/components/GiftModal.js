import React, { useState, useEffect } from 'react';
import { getGiftTypes, sendGift } from '../services/supabaseService';

const GiftModal = ({ receiverId, onClose }) => {
  const [giftTypes, setGiftTypes] = useState([]);
  const [selectedGift, setSelectedGift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGifts = async () => {
      const gifts = await getGiftTypes();
      setGiftTypes(gifts);
      setLoading(false);
    };
    fetchGifts();
  }, []);

  const handleSendGift = async () => {
    if (!selectedGift) {
      setError('Please select a gift.');
      return;
    }
    setLoading(true);
    setError('');
    const result = await sendGift(receiverId, selectedGift.id);
    setLoading(false);
    if (result && result.startsWith('Success')) {
      alert('Gift sent successfully!');
      onClose();
    } else {
      setError(result || 'Failed to send gift. You may have insufficient funds.');
    }
  };

  if (loading && giftTypes.length === 0) {
    return <div>Loading gifts...</div>;
  }

  return (
    <div style={{
      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      backgroundColor: 'white', padding: '20px', zIndex: 100, border: '1px solid black', borderRadius: '8px'
    }}>
      <h2>Send a Gift</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
        {giftTypes.map(gift => (
          <div
            key={gift.id}
            onClick={() => setSelectedGift(gift)}
            style={{
              border: selectedGift && selectedGift.id === gift.id ? '2px solid blue' : '1px solid #ccc',
              padding: '10px', cursor: 'pointer'
            }}
          >
            <p>{gift.name}</p>
            <p>Cost: ${gift.cost}</p>
          </div>
        ))}
      </div>
      <button onClick={handleSendGift} disabled={loading || !selectedGift}>
        {loading ? 'Sending...' : 'Send Gift'}
      </button>
      <button onClick={onClose} style={{ marginLeft: '8px' }}>Cancel</button>
    </div>
  );
};

export default GiftModal;
