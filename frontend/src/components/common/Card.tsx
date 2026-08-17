import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  interactive = false,
  glow = false,
  className = '',
  style,
  ...props
}) => {
  return (
    <div
      className={`glass-card ${interactive ? 'glass-card-interactive' : ''} ${className}`}
      style={{
        ...(glow ? { boxShadow: '0 0 25px rgba(99, 102, 241, 0.2)' } : {}),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};
