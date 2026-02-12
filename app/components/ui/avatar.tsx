"use client";

import React from "react";

type AvatarProps = React.HTMLAttributes<HTMLDivElement> & {
  src?: string;
  alt?: string;
};

export const Avatar = ({ src, alt, className = "", children, ...props }: AvatarProps) => {
  if (src) {
    return (
      // Image avatar
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt ?? "avatar"} className={`rounded-full object-cover ${className}`} {...props} />
    );
  }

  return (
    <div className={`rounded-full overflow-hidden ${className}`} {...props}>
      {children}
    </div>
  );
};

type AvatarFallbackProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: React.ReactNode;
};

export const AvatarFallback = ({ className = "flex items-center justify-center w-full h-full", children, ...props }: AvatarFallbackProps) => {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

export default Avatar;
