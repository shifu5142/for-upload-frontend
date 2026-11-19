"use client";

import type { ReactNode } from "react";

const loginPath = "/api/auth/login";

export function KindeLoginButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={loginPath}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        window.location.assign(loginPath);
      }}
    >
      {children}
    </a>
  );
}
