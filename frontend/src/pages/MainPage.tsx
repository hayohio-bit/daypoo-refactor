import { AnimatePresence, Variants, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmergencyButton } from '../components/EmergencyButton';
import { EmergencySheet } from '../components/EmergencySheet';
import { Footer } from '../components/Footer';
import { HeroSection } from '../components/HeroSection';
import { MapSection } from '../components/MapSection';
import { Navbar } from '../components/Navbar';
import { NovaGlow } from '../components/NovaGlow';
import { ReportCard } from '../components/ReportCard_Glass';
import { WaveDivider } from '../components/WaveDivider';
import { HealthLogModal, type HealthLogResult } from '../components/map/HealthLogModal';
import { useAuth } from '../context/AuthContext';
import { useTransitionContext } from '../context/TransitionContext';
import { api } from '../services/apiClient';
import type { CreateRecordRequest } from '../types/api';

export function MainPage({ openAuth }: { openAuth: (mode: 'login' | 'signup') => void }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showHealthLog, setShowHealthLog] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { transitionTo } = useTransitionContext();

  const handleRecordClick = useCallback(() => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      openAuth('login');
      return;
    }
    setShowHealthLog(true);
  }, [isAuthenticated, openAuth]);

  const handleHealthLogComplete = async (result: HealthLogResult) => {
    try {
      const pos = { lat: 0, lng: 0 }; // Placeholder for location logic
      const payload: CreateRecordRequest = {
        toiletId: 0, // Global report doesn't have a specific toilet
        conditionTags: result.conditionTags,
        dietTags: result.foodTags,
        latitude: pos.lat,
        longitude: pos.lng,
        ...(result.bristolType !== null && { bristolScale: result.bristolType }),
        ...(result.color !== null && { color: result.color }),
        ...(result.imageBase64 && { imageBase64: result.imageBase64 }),
      };
      await api.post('/records', payload);
      setShowHealthLog(false);
      alert('기록이 저장되었습니다!');
    } catch (e: any) {
      alert(`기록 저장 실패: ${e.message || '서버 오류'}`);
    }
  };

  return (
    <div style={{ background: '#F8FAF9' }} className="relative min-h-screen">
      <Navbar openAuth={openAuth} />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <HeroSection onCtaClick={() => navigate('/map?openNearest=true')} openAuth={openAuth} />
      </div>

      {/* AI Health Report Section */}
      <div className="relative overflow-hidden">
        <ReportCard openAuth={openAuth} />
        <WaveDivider fill="#F8FAF9" />
      </div>

      {/* Map Section with Scroll Target */}
      <div id="map-scroll-target" className="relative overflow-hidden pb-32">
        <MapSection />
        <WaveDivider fill="#111e18" />
      </div>

      {/* Footer */}
      <Footer />

      {/* Floating Elements */}
      <EmergencyButton onClick={() => setSheetOpen(true)} />
      <EmergencySheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} />

      {/* 글로벌 건강 기록 모달 */}
      <AnimatePresence>
        {showHealthLog && (
          <HealthLogModal
            onClose={() => setShowHealthLog(false)}
            onComplete={handleHealthLogComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
