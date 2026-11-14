import React from 'react';
import { PlatformId, WalletProviderId } from '../types/commerce';

export const Store21Mark: React.FC<{ className?: string }> = ({ className = 'h-8 w-8' }) => (
  <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
    <rect width="36" height="36" rx="10" fill="#059669" />
    <path
      d="M11 14.5L13.2 10.5H22.8L25 14.5V24.5C25 25.328 24.328 26 23.5 26H12.5C11.672 26 11 25.328 11 24.5V14.5Z"
      stroke="#FFFFFF"
      strokeWidth="1.9"
      strokeLinejoin="round"
    />
    <path
      d="M15 16V14.5C15 12.843 16.343 11.5 18 11.5C19.657 11.5 21 12.843 21 14.5V16"
      stroke="#FFFFFF"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
    <circle cx="18" cy="20.5" r="2.1" fill="#FFFFFF" />
  </svg>
);

export const PlatformLogo: React.FC<{ id: PlatformId; className?: string }> = ({
  id,
  className = 'h-8 w-8',
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
  }
};

export const WalletProviderLogo: React.FC<{ provider: WalletProviderId; className?: string }> = ({
  provider,
  className = 'h-7 w-7',
}) => {
  switch (provider) {
    case 'metamask':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <rect width="32" height="32" rx="16" fill="#FFF4ED" />
          <path d="M9 9L15 13.5L14 17.5L9 14.5V9Z" fill="#E2761B" />
          <path d="M23 9L17 13.5L18 17.5L23 14.5V9Z" fill="#E4761B" />
          <path d="M10.5 21.5L14 17.5L16 19.5L18 17.5L21.5 21.5L16 24L10.5 21.5Z" fill="#F6851B" />
        </svg>
      );
    case 'trust':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <rect width="32" height="32" rx="16" fill="#EFF6FF" />
          <path
            d="M16 7L23 10.2V16.2C23 20.5 19.9 23.8 16 25C12.1 23.8 9 20.5 9 16.2V10.2L16 7Z"
            fill="#0500FF"
          />
          <path
            d="M16 9.5L20.5 11.6V16C20.5 19 18.4 21.4 16 22.3C13.6 21.4 11.5 19 11.5 16V11.6L16 9.5Z"
            stroke="#FFFFFF"
            strokeWidth="1.6"
          />
        </svg>
      );
    case 'coinbase':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <rect width="32" height="32" rx="16" fill="#0052FF" />
          <circle cx="16" cy="16" r="7.5" fill="#FFFFFF" />
          <rect x="13.5" y="13.5" width="5" height="5" rx="1.2" fill="#0052FF" />
        </svg>
      );
    case 'walletconnect':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <rect width="32" height="32" rx="16" fill="#EFF6FF" />
          <path
            d="M10.5 13.5C13.5 10.5 18.5 10.5 21.5 13.5L22.3 14.3L19.8 16.8L18.2 15.2C17 14 15 14 13.8 15.2L12.2 16.8L9.7 14.3L10.5 13.5Z"
            fill="#3B99FC"
          />
          <path d="M13 18.5L16 21.5L19 18.5" stroke="#3B99FC" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'solana':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <rect width="32" height="32" rx="16" fill="#141518" />
          <path d="M9 11H22L20 13.5H7L9 11Z" fill="#14F195" />
          <path d="M7 15.5H20L22 18H9L7 15.5Z" fill="#00C2FF" />
          <path d="M9 20H22L20 22.5H7L9 20Z" fill="#9945FF" />
        </svg>
      );
  }
};
