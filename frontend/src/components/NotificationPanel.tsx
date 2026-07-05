import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Trash2, Info, Trophy, MessageSquare, Sparkles, CheckCheck } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useState, useMemo } from 'react';

type FilterType = 'all' | 'unread';

export function NotificationPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const {
    notifications,
    markAllAsRead,
    markAsRead,
    deleteNotification,
    showToast,
    setNotifications,
    unreadCount,
  } = useNotification();

  const [filter, setFilter] = useState<FilterType>('all');
  const [showDevTools, setShowDevTools] = useState(import.meta.env.DEV);
  const [clickCount, setClickCount] = useState(0);

  // 알림 클릭 핸들러
  const handleNotificationClick = async (n: any) => {
    if (!n.isRead) {
      await markAsRead(n.id);
    }
    if (n.redirectUrl) {
      onClose();
      navigate(n.redirectUrl);
    }
  };

  const filteredNotifications = useMemo(() => {
    return filter === 'unread'
      ? notifications.filter(n => !n.isRead)
      : notifications;
  }, [notifications, filter]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ACHIEVEMENT':
        return { Icon: Trophy, gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' };
      case 'INQUIRY_REPLY':
        return { Icon: MessageSquare, gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50' };
      default:
        return { Icon: Info, gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50' };
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const deleteNotif = (id: number) => {
    deleteNotification(id);
  };

  // 개발자 모드 토글 (헤더 3번 클릭)
  const handleHeaderClick = () => {
    setClickCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 3) {
        setShowDevTools(prev => !prev);
        return 0;
      }
      setTimeout(() => setClickCount(0), 1000);
      return newCount;
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[2000] bg-black/30 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 z-[2001] w-full max-w-[420px] h-full flex flex-col"
            style={{
              background: 'linear-gradient(to bottom, rgba(248,250,249,0.98), rgba(255,255,255,0.95))',
              backdropFilter: 'blur(20px)',
              boxShadow: '-10px 0 50px rgba(0,0,0,0.08)',
            }}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ rotate: 15, scale: 1.1 }}
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2d6a4f] to-[#1b4332] flex items-center justify-center text-white shadow-lg"
                  >
                    <Bell size={22} />
                  </motion.div>
                  <div
                    onClick={handleHeaderClick}
                    className="cursor-pointer select-none relative"
                  >
                    <h2 className="font-black text-xl text-[#1a2b22]">알림</h2>
                    {unreadCount > 0 && (
                      <p className="text-xs font-bold text-[#7a9e8a]">
                        {unreadCount}개의 새로운 알림
                      </p>
                    )}
                    {clickCount > 0 && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[10px] font-black shadow-lg"
                      >
                        {clickCount}
                      </motion.div>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:bg-white hover:text-gray-600 transition-all shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 p-1 rounded-2xl bg-white/60 backdrop-blur-md shadow-sm">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all ${
                    filter === 'all'
                      ? 'bg-[#1B4332] text-white shadow-md'
                      : 'text-gray-500 hover:bg-white/50'
                  }`}
                >
                  전체
                  {notifications.length > 0 && (
                    <span className={`ml-2 text-xs ${filter === 'all' ? 'text-white/70' : 'text-gray-400'}`}>
                      {notifications.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all ${
                    filter === 'unread'
                      ? 'bg-[#1B4332] text-white shadow-md'
                      : 'text-gray-500 hover:bg-white/50'
                  }`}
                >
                  미읽음
                  {unreadCount > 0 && (
                    <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      filter === 'unread'
                        ? 'bg-white/20 text-white'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar">
              {filteredNotifications.length > 0 ? (
                <div className="space-y-3">
                  {filteredNotifications.map((n, index) => {
                    const { Icon, gradient, bg } = getNotificationIcon(n.type);

                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.9 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleNotificationClick(n)}
                        className={`relative group p-4 rounded-2xl transition-all cursor-pointer ${
                          n.isRead
                            ? 'bg-white/50 backdrop-blur-sm'
                            : 'bg-white backdrop-blur-md shadow-md hover:shadow-lg'
                        }`}
                        style={{
                          border: n.isRead ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(45,106,79,0.1)',
                        }}
                      >
                        {/* Unread indicator */}
                        {!n.isRead && (
                          <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500" />
                        )}

                        <div className="flex gap-3">
                          {/* Icon */}
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${bg}`}>
                            <div className={`bg-gradient-to-br ${gradient} bg-clip-text text-transparent`}>
                              <Icon size={24} strokeWidth={2.5} />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className={`text-sm font-black leading-tight ${
                                n.isRead ? 'text-gray-400' : 'text-[#1a2b22]'
                              }`}>
                                {n.title}
                              </h3>
                            </div>
                            <p className={`text-xs leading-relaxed mb-2 ${
                              n.isRead ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {n.content}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-medium text-gray-400">
                                {getTimeAgo(n.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons (Show on hover) */}
                        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotif(n.id);
                            }}
                            className="p-1.5 rounded-lg bg-white/80 backdrop-blur-sm text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all shadow-sm"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center px-6"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center mb-6"
                  >
                    <Sparkles size={40} className="text-emerald-300" />
                  </motion.div>
                  <h3 className="font-black text-lg text-[#1a2b22] mb-2">
                    {filter === 'unread' ? '모든 알림을 확인했어요!' : '새로운 알림이 없어요'}
                  </h3>
                  <p className="text-sm text-[#7a9e8a] leading-relaxed">
                    {filter === 'unread' ? (
                      <>
                        모든 알림을 읽었습니다.<br />
                        새로운 소식이 있으면 알려드릴게요!
                      </>
                    ) : (
                      <>
                        오늘 변은 어떠셨나요?<br />
                        새로운 알림이 도착하면 알려드릴게요!
                      </>
                    )}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="bg-white/50 backdrop-blur-md border-t border-gray-100">
              {notifications.length > 0 && (
                <div className="p-4 pb-3">
                  <button
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                    className="w-full py-3 px-4 rounded-2xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{
                      background: unreadCount > 0
                        ? 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)'
                        : '#f3f4f6',
                      color: unreadCount > 0 ? 'white' : '#9ca3af',
                      boxShadow: unreadCount > 0 ? '0 4px 16px rgba(27,67,50,0.2)' : 'none',
                    }}
                  >
                    <CheckCheck size={18} />
                    모두 읽음으로 표시
                  </button>
                </div>
              )}

              {/* 개발자 도구 (숨겨진 모드) */}
              <AnimatePresence>
                {showDevTools && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                          🛠️ 개발자 도구
                        </p>
                        <button
                          onClick={() => setShowDevTools(false)}
                          className="text-[10px] text-gray-400 hover:text-gray-600 font-medium"
                        >
                          닫기
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => {
                            showToast('레벨업!', '축하합니다! 새로운 등급을 획득하셨습니다.', 'achievement');
                            setNotifications(prev => [{
                              id: Date.now(),
                              type: 'ACHIEVEMENT',
                              title: '레벨업!',
                              content: '축하합니다! 새로운 등급을 획득하셨습니다.',
                              isRead: false,
                              createdAt: new Date().toISOString()
                            }, ...prev]);
                          }}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white border border-gray-100 hover:border-amber-200 hover:shadow-md transition-all group active:scale-95"
                        >
                          <Trophy size={16} className="text-amber-500 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold text-gray-600">성취</span>
                        </button>
                        <button
                          onClick={() => {
                            showToast('문의 답변', '문의하신 내용에 대해 답변이 도착했습니다.', 'message');
                            setNotifications(prev => [{
                              id: Date.now(),
                              type: 'INQUIRY_REPLY',
                              title: '문의 답변',
                              content: '문의하신 내용에 대해 답변이 도착했습니다.',
                              isRead: false,
                              createdAt: new Date().toISOString()
                            }, ...prev]);
                          }}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group active:scale-95"
                        >
                          <MessageSquare size={16} className="text-blue-500 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold text-gray-600">메시지</span>
                        </button>
                        <button
                          onClick={() => {
                            showToast('근처 화장실', '현재 위치 150m 이내에 화장실이 있습니다.', 'info');
                            setNotifications(prev => [{
                              id: Date.now(),
                              type: 'INFO',
                              title: '근처 화장실',
                              content: '현재 위치 150m 이내에 화장실이 있습니다.',
                              isRead: false,
                              createdAt: new Date().toISOString()
                            }, ...prev]);
                          }}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all group active:scale-95"
                        >
                          <Info size={16} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold text-gray-600">시스템</span>
                        </button>
                      </div>
                      <p className="text-[9px] text-gray-400 text-center mt-3 leading-tight">
                        💡 Tip: "알림" 제목을 3번 클릭하면 이 패널이 토글됩니다
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
