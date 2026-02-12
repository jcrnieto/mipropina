import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "ghost" | "default";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button = ({ 
  variant = "default", 
  size = "md", 
  className = "", 
  ...props 
}: ButtonProps) => {
  const baseStyles = "font-medium rounded transition-colors";
  
  const variants = {
    ghost: "text-muted-foreground hover:text-foreground",
    default: "bg-primary text-white hover:bg-primary/90"
  };
  
  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
};