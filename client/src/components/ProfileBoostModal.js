import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getBoostPricing, purchaseProfileBoost, getActiveBoosts } from '../services/advancedFeatures';

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
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.background} 0%, ${({ theme }) => theme.colors.surface} 100%);
  border-radius: 20px;
  max-width: 450px;
  width: 90%;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  animation: slideUp 0.3s ease;
  overflow: hidden;

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
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.primary}dd);
  color: white;
  padding: 2rem;
  text-align: center;
  position: relative;

  h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    font-weight: bold;
  }

  p {
    margin: 0;
    opacity: 0.9;
    font-size: 0.9rem;
  }

  &::before {
    content: '🚀';
    position: absolute;
    top: 1rem;
    left: 1rem;
    font-size: 1.5rem;
    animation: bounce 2s infinite;
  }

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: rotate(90deg);
  }
`;

const BoostOptions = styled.div`
  padding: 2rem;
`;

const BoostOption = styled.div`
  background-color: ${({ theme, selected }) => selected ? theme.colors.primary + '20' : theme.colors.surface};
  border: 2px solid ${({ theme, selected }) => selected ? theme.colors.primary : theme.colors.border};
  border-radius: 15px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    transition: left 0.5s ease;
  }

  &:hover::before {
    left: 100%;
  }
`;

const OptionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const OptionTitle = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.1rem;
`;

const OptionPrice = styled.span`
  background: linear-gradient(45deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.primary}dd);
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9rem;
`;

const OptionDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.9rem;
  line-height: 1.4;
`;

const PopularBadge = styled.span`
  position: absolute;
  top: -8px;
  right: 1rem;
  background: linear-gradient(45deg, #FF6B6B, #FF8E53);
  color: white;
  padding: 0.3rem 1rem;
  border-radius: 15px;
  font-size: 0.7rem;
  font-weight: bold;
  text-transform: uppercase;
  box-shadow: 0 2px 10px rgba(255, 107, 107, 0.3);
`;

const ActiveBoostInfo = styled.div`
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  padding: 1rem;
  margin: 1rem 2rem;
  border-radius: 10px;
  text-align: center;
  font-size: 0.9rem;

  strong {
    display: block;
    margin-bottom: 0.5rem;
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

const BoostButton = styled(Button)`
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
    box-shadow: 0 8px 25px rgba(0,0,0,0.2);
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

const ProfileBoostModal = ({ isOpen, onClose, onBoostPurchased }) => {
  const [pricing, setPricing] = useState({});
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState(null);
  const [activeBoosts, setActiveBoosts] = useState([]);

  const boostOptions = [
    {
      duration: 30,
      title: '30 Minutes',
      description: 'Quick visibility boost for immediate results',
      popular: false
    },
    {
      duration: 60,
      title: '1 Hour',
      description: 'Extended exposure during peak hours',
      popular: true
    },
    {
      duration: 120,
      title: '2 Hours',
      description: 'Maximum visibility for serious matching',
      popular: false
    }
  ];

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [pricingResult, boostsResult] = await Promise.all([
        getBoostPricing(),
        getActiveBoosts()
      ]);
      
      if (pricingResult.success) {
        setPricing(pricingResult.data);
      }
      
      if (boostsResult.success) {
        setActiveBoosts(boostsResult.data);
      }
    } catch (err) {
      setError('Failed to load boost information');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseBoost = async () => {
    try {
      setPurchasing(true);
      setError(null);

      const result = await purchaseProfileBoost(selectedDuration, 'visibility');

      if (result.success) {
        onClose();
        if (onBoostPurchased) {
          onBoostPurchased(result);
        }
        alert('Profile boost activated! Your profile will be more visible for the next ' + selectedDuration + ' minutes! 🚀');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to purchase boost');
    } finally {
      setPurchasing(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const hasActiveBoost = activeBoosts.length > 0;
  const nextExpiry = hasActiveBoost ? new Date(activeBoosts[0].expires_at) : null;

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClick={handleBackdropClick}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <CloseButton onClick={onClose}>×</CloseButton>
          <h2>Boost Your Profile</h2>
          <p>Get more matches with increased visibility</p>
        </ModalHeader>

        {hasActiveBoost && (
          <ActiveBoostInfo>
            <strong>🔥 Boost Active!</strong>
            Your profile is currently boosted until {nextExpiry?.toLocaleString()}
          </ActiveBoostInfo>
        )}

        {loading && <LoadingSpinner />}

        {error && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
            <p>{error}</p>
            <button onClick={loadData}>Try Again</button>
          </div>
        )}

        {!loading && !error && (
          <>
            <BoostOptions>
              {boostOptions.map((option) => (
                <BoostOption
                  key={option.duration}
                  selected={selectedDuration === option.duration}
                  onClick={() => setSelectedDuration(option.duration)}
                >
                  {option.popular && <PopularBadge>Most Popular</PopularBadge>}
                  
                  <OptionHeader>
                    <OptionTitle>{option.title}</OptionTitle>
                    <OptionPrice>
                      {pricing[`${option.duration}min`] || 'N/A'} NGN
                    </OptionPrice>
                  </OptionHeader>
                  
                  <OptionDescription>
                    {option.description}
                  </OptionDescription>
                </BoostOption>
              ))}
            </BoostOptions>

            <ActionButtons>
              <CancelButton onClick={onClose}>
                Cancel
              </CancelButton>
              <BoostButton
                onClick={handlePurchaseBoost}
                disabled={purchasing || !pricing[`${selectedDuration}min`]}
              >
                {purchasing ? 'Activating...' : `Boost Now (${pricing[`${selectedDuration}min`] || 0} NGN)`}
              </BoostButton>
            </ActionButtons>
          </>
        )}
      </ModalContent>
    </ModalBackdrop>
  );
};

export default ProfileBoostModal;