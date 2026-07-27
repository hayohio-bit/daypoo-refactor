import React from 'react';
import { GlassCard } from '../common/GlassCard';

interface AdminCardProps {
  title?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export const AdminCard: React.FC<AdminCardProps> = ({
  title,
  headerRight,
  children,
  className = '',
  bodyClassName = 'p-6',
}) => {
  return (
    <GlassCard
      className={`flex flex-col overflow-hidden bg-white/50 backdrop-blur-xl border border-black/5 ${className}`}
    >
      {(title || headerRight) && (
        <div className="flex items-center justify-between border-b border-black/5 px-8 py-5">
          {title && (
            <div className="text-[11px] font-black uppercase tracking-widest text-black/40">
              {title}
            </div>
          )}
          {headerRight && <div>{headerRight}</div>}
        </div>
      )}
      <div className={`overflow-x-auto ${bodyClassName}`}>{children}</div>
    </GlassCard>
  );
};
