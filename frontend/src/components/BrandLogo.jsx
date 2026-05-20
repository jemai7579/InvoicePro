import React from 'react';
import logo from '../assets/invoicepro-logo-transparent.png';
import whiteLogo from '../assets/invoicepro-logo-white-transparent.png';
import icon from '../assets/invoicepro-icon-transparent.png';

const BrandLogo = ({ tone = 'light', variant = 'full', className = '' }) => {
  const src = variant === 'icon' ? icon : tone === 'dark' ? whiteLogo : logo;
  return <img src={src} alt="InvoicePro" className={`object-contain ${className}`} />;
};

export default BrandLogo;
