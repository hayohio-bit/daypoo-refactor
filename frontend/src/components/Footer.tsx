import { Link } from 'react-router-dom';
import { useTransitionContext } from '../context/TransitionContext';

const FOOTER_LINKS = [
  {
    title: '서비스',
    links: [
      { label: '지도', to: '/map' },
      { label: '랭킹', to: '/ranking' },
      { label: 'AI 장 컨디션 체크', to: '/main#health-section' },
    ],
  },
  {
    title: '지원',
    links: [
      { label: 'FAQ', to: '/support?tab=faq' },
      { label: '1:1 문의', to: '/support?tab=inquiry' },
    ],
  },
  {
    title: '법적 고지',
    links: [
      { label: '개인정보처리방침', to: '/privacy' },
      { label: '이용약관', to: '/terms' },
    ],
  },
];

export function Footer() {
  const { transitionTo } = useTransitionContext();

  const handleLinkClick = (e: React.MouseEvent, to: string) => {
    if (to.includes('#')) {
      const [path, hash] = to.split('#');
      if (
        window.location.pathname === path ||
        (path === '/main' && window.location.pathname === '/')
      ) {
        e.preventDefault();
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
        return;
      }
    }

    // Only ranking uses transition
    if (to === '/ranking') {
      e.preventDefault();
      transitionTo(to);
    }
  };

  return (
    <footer className="relative bg-[#111e18] text-white pt-10 sm:pt-16 pb-8 sm:pb-12 px-6 md:px-12 overflow-hidden">
      <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row justify-between items-start gap-10 lg:gap-24 relative z-10">
        {/* 좌측 — 로고 & 브랜딩 */}
        <div className="w-full lg:w-1/2 flex flex-col gap-5 sm:gap-6">
          <div className="space-y-3">
            <h2
              className="text-3xl sm:text-5xl lg:text-7xl font-black leading-none tracking-tighter text-white/90"
              style={{ fontFamily: 'SchoolSafetyNotification, sans-serif' }}
            >
              Day<span className="text-[#E8A838]">.</span>Poo
            </h2>
            <p className="text-xs sm:text-sm font-bold text-white/30 max-w-sm leading-relaxed">
              당신의 건강한 일상을 위한 <br className="sm:hidden" /> 가장 귀여운 AI 퍼스널 닥터.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-3.5 items-center">
              {[
                {
                  icon: (
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.31.975.975 1.247 2.242 1.31 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.31 3.608-.975.975-2.242 1.247-3.608 1.31-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.31-.975-.975-1.247-2.242-1.31-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.334-2.633 1.31-3.608.975-.975 2.242-1.247 3.608-1.31 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.058-1.281.072-1.689.072-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.28-.058-1.688-.072-4.947-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  ),
                  label: 'instagram',
                  url: 'https://instagram.com/daypoo_official',
                },
                {
                  icon: (
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  ),
                  label: 'github',
                  url: 'https://github.com/hayohio-bit/daypoo-refactor',
                },
              ].map((sns, i) => (
                <a
                  key={i}
                  href={sns.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Day.Poo ${sns.label}`}
                  className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-[#E8A838] hover:border-[#E8A838]/30 transition-all"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    {sns.icon}
                  </svg>
                </a>
              ))}
            </div>
            <p className="text-white/10 text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap">
              © 2026 DAY.POO ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>

        {/* 우측 — 링크 섹션 */}
        <div className="w-full lg:w-auto mt-2 lg:mt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-16">
            {FOOTER_LINKS.map((col, idx) => (
              <div
                key={col.title}
                className={`flex flex-col gap-4 sm:gap-5 ${idx === 2 ? 'col-span-2 sm:col-span-1' : ''}`}
              >
                <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/40">
                  {col.title}
                </h3>
                <div className="flex flex-col gap-2 sm:gap-3">
                  {col.links.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={(e) => handleLinkClick(e, link.to)}
                      className="text-xs sm:text-[14px] font-bold text-white/30 hover:text-[#E8A838] transition-all duration-300"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
