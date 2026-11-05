import type { ReactNode } from 'react';

interface StatusMessageProps {
  children: ReactNode;
  role?: 'status' | 'alert';
}

export function StatusMessage({ children, role = 'status' }: StatusMessageProps) {
  return (
    <p className="status-message" role={role}>
      {children}
    </p>
  );
}
