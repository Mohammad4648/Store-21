import React from 'react';
import { BlockchainNetwork, CryptoCurrency, PlatformId } from '../types/commerce';

export const SouqChainMark: React.FC<{ className?: string }> = ({ className = 'h-6 w-6' }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
    <path
      d="M16 3L27 9.5V22.5L16 29L5 22.5V9.5L16 3Z"
      stroke="#E5B84B"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M16 3V16M16 16L27 9.5M16 16L5 9.5M16 16V29"
      stroke="#E5B84B"
      strokeOpacity="0.6"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <circle cx="16" cy="16" r="3" fill="#E5B84B" />
  </svg>
);

export const PlatformLogo: React.FC<{ id: PlatformId; className?: string }> = ({
  id,
  className = 'h-7 w-7',
}) => {
  switch (id) {
    case 'salla':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="#004D5A" />
          <path
            d="M9 12.5C9 10.567 10.567 9 12.5 9H19.5C21.433 9 23 10.567 23 12.5V19.5C23 21.433 21.433 23 19.5 23H12.5C10.567 23 9 21.433 9 19.5V12.5Z"
            stroke="#BAF3E6"
            strokeWidth="2"
          />
          <path d="M12.5 14.5H19.5M12.5 18H17" stroke="#BAF3E6" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'zid':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="#4C1D95" />
          <path
            d="M10 11H22L11 21H22"
            stroke="#DDD6FE"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'shopify':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="#14532D" />
          <path
            d="M10 11.5L16 9L22 11.5L23 22.5H9L10 11.5Z"
            stroke="#86EFAC"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M13 13V11C13 9.343 14.343 8 16 8C17.657 8 19 9.343 19 11V13" stroke="#86EFAC" strokeWidth="1.8" />
          <path d="M14.5 18.5C15.5 19.3 17.5 19.2 17.5 17.8C17.5 16.5 14.5 16.6 14.5 15.3C14.5 14.2 16.4 14 17.5 14.7" stroke="#86EFAC" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'woocommerce':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="#3B0764" />
          <path
            d="M7.5 12L10.2 20L13 14.5L15.8 20L18.5 12"
            stroke="#E9D5FF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="22.5" cy="16" r="2.8" stroke="#E9D5FF" strokeWidth="2" />
        </svg>
      );
    case 'amazon':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="#1E293B" />
          <path
            d="M12.5 17.5V13.5C12.5 11.8 14 10.5 16 10.5C18 10.5 19.5 11.8 19.5 13.5V17.5M19.5 15.5C17.5 15 12.5 15.2 12.5 17.2C12.5 18.7 15.5 19.2 19.5 17.5"
            stroke="#F59E0B"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <path
            d="M9.5 21.5C13.5 23.8 18.5 23.8 22.5 21.5"
            stroke="#F59E0B"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'magento':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="#7C2D12" />
          <path
            d="M16 7.5L23.5 11.8V20.5L20.5 22.2V13.5L16 10.9L11.5 13.5V22.2L8.5 20.5V11.8L16 7.5Z"
            fill="#FDBA74"
          />
          <path d="M16 14.5L18 15.6V23.2L16 24.4L14 23.2V15.6L16 14.5Z" fill="#FDBA74" />
        </svg>
      );
  }
};

export const NetworkLogo: React.FC<{ network: BlockchainNetwork; className?: string }> = ({
  network,
  className = 'h-4 w-4',
}) => {
  switch (network) {
    case 'polygon':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M15.5 8.5L18.5 10.2V13.7L15.5 15.5L12.5 13.7V10.2L9.5 8.5L6.5 10.2V13.7L9.5 15.5"
            stroke="#A855F7"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'ethereum':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M12 3L17.5 12L12 15.2L6.5 12L12 3Z" stroke="#93C5FD" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M12 21L17.5 14L12 17.2L6.5 14L12 21Z" stroke="#93C5FD" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case 'arbitrum':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" stroke="#38BDF8" strokeWidth="1.8" />
          <path d="M9 16L12 8.5L15 16" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'base':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" stroke="#3B82F6" strokeWidth="2" />
          <path d="M7 12H15" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'solana':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M6 8H18L16 10.5H4L6 8Z" fill="#2DD4BF" />
          <path d="M4 13.5H16L18 16H6L4 13.5Z" fill="#2DD4BF" />
        </svg>
      );
  }
};

export const TokenLogo: React.FC<{ currency: CryptoCurrency; className?: string }> = ({
  currency,
  className = 'h-4 w-4',
}) => {
  switch (currency) {
    case 'USDC':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="9.5" stroke="#38BDF8" strokeWidth="1.8" />
          <path d="M12 7V17M14.2 9.5C13.7 8.8 10.3 8.8 10 10.2C9.7 11.7 14.3 11.8 14 13.6C13.7 15.1 10.2 15.2 9.6 14.2" stroke="#38BDF8" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'USDT':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="9.5" stroke="#10B981" strokeWidth="1.8" />
          <path d="M8 8.5H16M12 8.5V16.5M8.5 12C8.5 12.8 15.5 12.8 15.5 12" stroke="#10B981" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'ETH':
      return <NetworkLogo network="ethereum" className={className} />;
    case 'SOL':
      return <NetworkLogo network="solana" className={className} />;
  }
};
