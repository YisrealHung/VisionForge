import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  interactive = false,
  glow: _glow = false,
  className = '',
  style,
  ...props
}) => {
  return (
    <div
      className={`glass-card ${interactive ? 'glass-card-interactive' : ''} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};
