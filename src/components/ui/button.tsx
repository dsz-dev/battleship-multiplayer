import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  let classes = 'button';
  
  if (variant === 'secondary') {
    classes += ' button-secondary';
  } else if (variant === 'outline') {
    classes += ' button-outline';
  }
  
  if (className) {
    classes += ` ${className}`;
  }
  
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};
