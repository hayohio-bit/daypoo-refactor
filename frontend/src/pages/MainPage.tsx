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
import { WaveDivider } from '../components/WaveDivider';
import { useAuth } from '../context/AuthContext';

export function MainPage({ openAuth }: { openAuth: (mode: 'login' | 'signup') => void }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ background: '#F8FAF9' }} className="relative min-h-screen">
      <Navbar openAuth={openAuth} />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <HeroSection onCtaClick={() => navigate('/map?openNearest=true')} openAuth={openAuth} />
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
    </div>
  );
}
