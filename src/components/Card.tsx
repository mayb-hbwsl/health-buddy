import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({ title, children, className = '', style }) => {
  return (
    <div className={`${styles.card} ${className}`} style={style}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};

export default Card;
