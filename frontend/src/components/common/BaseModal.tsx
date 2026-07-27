import { motion as m } from 'framer-motion';
import React, { useEffect } from 'react';

export interface BaseModalProps {
  onClose: () => void;
  children: React.ReactNode;
  zIndex?: number;
  backdropClassName?: string;
}

export const BaseModal: React.FC<BaseModalProps> = ({
  onClose,
  children,
  zIndex = 1000,
  backdropClassName = 'bg-black/60 backdrop-blur-sm',
}) => {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex }}>
      {/* Backdrop */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className={`absolute inset-0 ${backdropClassName}`}
      />
      {children}
    </div>
  );
};
