import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getVirtualGifts, sendVirtualGift } from '../services/advancedFeatures';
import { useAuth } from '../context/AuthContext';

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 20px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(50px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ModalHeader = styled.div`
  padding: 2rem 2rem 1rem;
  text-align: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  h2 {
    margin: 0 0 0.5rem 0;
    color: ${({ theme }) => theme.colors.text};
    font-size: 1.5rem;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 0.9rem;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.backgroundLight};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const GiftsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  padding: 2rem;
`;

const GiftCard = styled.div`
  background-color: ${({ theme, selected }) => selected ? theme.colors.primary + '20' : theme.colors.surface};
  border: 2px solid ${({ theme, selected }) => selected ? theme.colors.primary : theme.colors.border};
  border-radius: 15px;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
    transform: rotate(45deg);
    transition: all 0.6s ease;
    opacity: 0;
  }

  &:hover::before {
    opacity: 1;
    animation: shimmer 0.6s ease;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
    100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
  }
`;

const GiftIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  
  img {
    width: 50px;
    height: 50px;
    object-fit: contain;
  }
`;

const GiftName = styled.h4`
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text};
`;

const GiftPrice = styled.p`
  margin: 0;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 0.8rem;
`;

const RarityBadge = styled.span`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: bold;
  text-transform: uppercase;
  
  ${({ rarity }) => {
    switch (rarity) {
      case 'legendary':
        return 'background: linear-gradient(45deg, #FFD700, #FFA500); color: #000;';
      case 'epic':
        return 'background: linear-gradient(45deg, #9B59B6, #8E44AD); color: #fff;';
      case 'rare':
        return 'background: linear-gradient(45deg, #3498DB, #2980B9); color: #fff;';
      default:
        return 'background: linear-gradient(45deg, #95A5A6, #7F8C8D); color: #fff;';
    }
  }}
`;

const MessageInput = styled.textarea`
  width: 100%;
  padding: 1rem;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  margin: 1rem 0;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  padding: 0 2rem 2rem;
`;

const Button = styled.button`
  flex: 1;
  padding: 1rem;
  border: none;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
`;

const CancelButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  border: 2px solid ${({ theme }) => theme.colors.border};

  &:hover {
    background-color: ${({ theme }) => theme.colors.backgroundLight};
  }
`;

const SendButton = styled(Button)`
  background: linear-gradient(45deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.primary}dd);
  color: white;
  position: relative;
  overflow: hidden;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s ease;
  }

  &:not(:disabled):hover::before {
    left: 100%;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;

  &::after {
    content: '';
    width: 40px;
    height: 40px;
    border: 4px solid ${({ theme }) => theme.colors.border};
    border-top: 4px solid ${({ theme }) => theme.colors.primary};
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const VirtualGiftModal = ({ isOpen, onClose, receiverId, receiverName, context = 'profile', contextId = null }) => {
  const { currentUser } = useAuth();
  const [gifts, setGifts] = useState([]);
  const [selectedGift, setSelectedGift] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadGifts();
    }
  }, [isOpen]);

  const loadGifts = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getVirtualGifts();
      
      if (result.success) {
        setGifts(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load gifts');
    } finally {
      setLoading(false);
    }
  };

  const handleSendGift = async () => {
    if (!selectedGift) return;

    try {
      setSending(true);
      setError(null);

      const result = await sendVirtualGift(
        receiverId,
        selectedGift.id,
        message.trim() || null,
        context,
        contextId
      );

      if (result.success) {
        // Success! Show a nice animation or notification
        onClose();
        // You might want to show a success toast here
        alert(`Gift sent to ${receiverName}! 🎁`);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to send gift');
    } finally {
      setSending(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClick={handleBackdropClick}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>
        
        <ModalHeader>
          <h2>Send a Gift to {receiverName}</h2>
          <p>Show your appreciation with a virtual gift</p>
        </ModalHeader>

        {loading && <LoadingSpinner />}

        {error && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
            <p>{error}</p>
            <button onClick={loadGifts}>Try Again</button>
          </div>
        )}

        {!loading && !error && (
          <>
            <GiftsGrid>
              {gifts.map((gift) => (
                <GiftCard
                  key={gift.id}
                  selected={selectedGift?.id === gift.id}
                  onClick={() => setSelectedGift(gift)}
                >
                  <RarityBadge rarity={gift.rarity}>
                    {gift.rarity}
                  </RarityBadge>
                  
                  <GiftIcon>
                    {gift.icon_url ? (
                      <img src={gift.icon_url} alt={gift.name} />
                    ) : (
                      '🎁'
                    )}
                  </GiftIcon>
                  
                  <GiftName>{gift.name}</GiftName>
                  <GiftPrice>{gift.cost} {gift.currency}</GiftPrice>
                </GiftCard>
              ))}
            </GiftsGrid>

            {selectedGift && (
              <div style={{ padding: '0 2rem' }}>
                <h4>Selected: {selectedGift.name}</h4>
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  {selectedGift.description}
                </p>
                
                <MessageInput
                  placeholder="Add a personal message (optional)..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={200}
                />
              </div>
            )}

            <ActionButtons>
              <CancelButton onClick={onClose}>
                Cancel
              </CancelButton>
              <SendButton
                onClick={handleSendGift}
                disabled={!selectedGift || sending}
              >
                {sending ? 'Sending...' : `Send Gift (${selectedGift?.cost || 0} ${selectedGift?.currency || 'NGN'})`}
              </SendButton>
            </ActionButtons>
          </>
        )}
      </ModalContent>
    </ModalBackdrop>
  );
};

export default VirtualGiftModal;