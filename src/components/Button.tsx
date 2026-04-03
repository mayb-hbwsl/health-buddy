import React, { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const variantClass = styles[variant] || styles.primary;
  const buttonClass = `
    ${styles.button} 
    ${variantClass} 
    ${fullWidth ? styles.fullWidth : ''} 
    ${className}
  `.trim();

  return (
    <button className={buttonClass} {...props}>
      {children}
    </button>
  );
};

export default Button;
