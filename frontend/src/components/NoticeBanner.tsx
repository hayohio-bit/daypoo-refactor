import { AnimatePresence, m } from 'framer-motion';
import { Megaphone, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useNotice } from '../hooks/useNotice';

/**
 * `--notice-banner-height` 가 바뀐 것을 알리는 이벤트다.
 *
 * `Navbar` 는 이 값만큼 내려가면서 `--navbar-bottom` 도 다시 발행해야 하는데, 위치만 바뀌고 크기는 그대로라
 * ResizeObserver 로는 감지할 수 없다. 그래서 `LocationConsentBanner` 가 쓰는 것과 같은 방식으로 이벤트를 띄운다.
 */
export const NOTICE_BANNER_HEIGHT_CHANGE = 'noticeBannerHeightChange';

/**
 * 관리자가 게시한 공지를 화면 최상단에 노출한다.
 *
 * 배너가 떠 있는 동안 `Navbar` 가 가려지지 않도록, 자기 높이를 `--notice-banner-height` 로 문서 루트에 실어 둔다.
 * `Navbar` 는 이 값만큼 아래로 내려간다.
 */
export function NoticeBanner() {
  const { notice, dismiss } = useNotice();
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;

    if (!notice) {
      root.style.removeProperty('--notice-banner-height');
      window.dispatchEvent(new Event(NOTICE_BANNER_HEIGHT_CHANGE));
      return;
    }

    const element = barRef.current;
    if (!element) return;

    const syncHeight = () => {
      root.style.setProperty('--notice-banner-height', `${element.offsetHeight}px`);
      window.dispatchEvent(new Event(NOTICE_BANNER_HEIGHT_CHANGE));
    };

    syncHeight();

    // 문구가 길어 줄바꿈되는 화면 폭에서는 크기가 바뀌므로 관찰해 둔다.
    const observer = new ResizeObserver(syncHeight);
    observer.observe(element);

    return () => {
      observer.disconnect();
      root.style.removeProperty('--notice-banner-height');
      window.dispatchEvent(new Event(NOTICE_BANNER_HEIGHT_CHANGE));
    };
  }, [notice]);

  return (
    <AnimatePresence>
      {notice && (
        <m.div
          ref={barRef}
          initial={{ y: '-100%' }}
          animate={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          role="status"
          className="fixed top-0 left-0 right-0 z-[110] bg-[#1A2B27] border-b border-emerald-500/20 shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5 sm:px-6">
            <Megaphone size={16} className="shrink-0 text-emerald-400" aria-hidden="true" />
            <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-slate-100">
              {notice}
            </p>
            <button
              type="button"
              onClick={dismiss}
              aria-label="공지 닫기"
              className="shrink-0 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
