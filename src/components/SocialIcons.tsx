import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const InstagramIcon: React.FC<IconProps> = ({ size = 20, className, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
  >
    <defs>
      <radialGradient id="nalu-ig-radial-grad" cx="20%" cy="115%" r="130%">
        <stop offset="0%" stopColor="#FFDC80" />
        <stop offset="15%" stopColor="#FCAF45" />
        <stop offset="30%" stopColor="#F77737" />
        <stop offset="50%" stopColor="#F56040" />
        <stop offset="70%" stopColor="#FD1D1D" />
        <stop offset="85%" stopColor="#E1306C" />
        <stop offset="95%" stopColor="#C13584" />
        <stop offset="100%" stopColor="#833AB4" />
      </radialGradient>
    </defs>
    <rect width="24" height="24" rx="6.5" fill="url(#nalu-ig-radial-grad)" />
    <rect x="5.2" y="5.2" width="13.6" height="13.6" rx="3.8" stroke="#FFFFFF" strokeWidth="1.6" fill="none" />
    <circle cx="12" cy="12" r="3.4" stroke="#FFFFFF" strokeWidth="1.6" fill="none" />
    <circle cx="15.8" cy="8.2" r="1.1" fill="#FFFFFF" />
  </svg>
);

export const WhatsAppIcon: React.FC<IconProps> = ({ size = 20, className, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
  >
    <defs>
      <linearGradient id="nalu-wa-linear-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2FE576" />
        <stop offset="100%" stopColor="#1DA851" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6.5" fill="url(#nalu-wa-linear-grad)" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 4.2C7.69 4.2 4.2 7.69 4.2 12c0 1.44.39 2.79 1.07 3.95L4.2 19.8l3.98-1.04A7.75 7.75 0 0 0 12 19.8c4.31 0 7.8-3.49 7.8-7.8s-3.49-7.8-7.8-7.8zm4.6 10.95c-.2.54-1.13 1.05-1.56 1.09-.41.04-.95.06-2.7-.65-2.25-.92-3.7-3.21-3.8-3.37-.12-.15-.9-1.21-.9-2.3 0-1.09.57-1.63.78-1.85.2-.22.43-.28.58-.28.15 0 .29 0 .41.01.14.01.31-.05.49.37.2.45.65 1.6.71 1.72.06.12.1.25.02.41-.08.15-.12.24-.23.38-.12.14-.24.3-.35.41-.12.12-.23.24-.1.49.14.23.6 1 1.3 1.61.89.79 1.64 1.03 1.87 1.15.23.12.37.1.51-.06.14-.16.59-.68.74-.92.16-.23.31-.2.53-.12.21.08 1.37.64 1.6.76.23.12.39.18.45.27.06.1.06.57-.13 1.11z"
      fill="#FFFFFF"
    />
  </svg>
);
