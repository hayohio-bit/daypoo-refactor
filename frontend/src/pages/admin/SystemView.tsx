import {
  Activity,
  AlertTriangle,
  Bell,
  Database,
  Eye,
  Lock,
  RefreshCw,
  Settings,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { GlassCard } from '../../components/common/GlassCard';
import type { AdminStatsResponse } from '../../types/admin';
import { COLORS, type AdminTab } from './adminCommons';

export interface SystemSettings {
  noticeEnabled: boolean;
  noticeMessage: string;
  maintenanceMode: boolean;
  signupEnabled: boolean;
  aiReportEnabled: boolean;
}

export interface SystemLog {
  id: number;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  source: string;
  message: string;
}

export interface SystemViewProps {
  stats: AdminStatsResponse | null;
  logs: SystemLog[];
  loading: boolean;
  onRefresh: () => void;
  setActiveTab: (tab: AdminTab) => void;
}

export const SystemView = ({
  stats,
  logs,
  loading,
  onRefresh,
  setActiveTab,
}: SystemViewProps) => {
  const [settings, setSettings] = useState<SystemSettings>({
    noticeEnabled: true,
    noticeMessage: '🎉 Day.Poo 서비스가 정식 오픈했습니다!',
    maintenanceMode: false,
    signupEnabled: true,
    aiReportEnabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [editingNotice, setEditingNotice] = useState(false);
  const [tempNoticeMessage, setTempNoticeMessage] = useState('');

  useEffect(() => {
    if (settings.noticeMessage) {
      setTempNoticeMessage(settings.noticeMessage);
    }
  }, [settings.noticeMessage]);

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    setSaving(true);
    try {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      alert('설정이 로컬에 반영되었습니다.\n(서버 연동은 추후 지원 예정)');
    } catch (error: any) {
      console.error('설정 저장 실패:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof SystemSettings) => {
    if (typeof settings[key] === 'boolean') {
      updateSettings({ [key]: !settings[key] });
    }
  };

  const handleNoticeMessageSave = () => {
    updateSettings({ noticeMessage: tempNoticeMessage });
    setEditingNotice(false);
  };

  const getLogIcon = (level: SystemLog['level']) => {
    switch (level) {
      case 'INFO':
        return <Activity size={16} className="text-blue-500" />;
      case 'WARN':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'ERROR':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <Activity size={16} />;
    }
  };

  const getLogBgColor = (level: SystemLog['level']) => {
    switch (level) {
      case 'INFO':
        return 'bg-blue-50 border-blue-200';
      case 'WARN':
        return 'bg-yellow-50 border-yellow-200';
      case 'ERROR':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <RefreshCw size={32} className="animate-spin text-[#1B4332]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-black tracking-tight mb-2">시스템 통합 관제</h2>
          <p className="text-sm font-bold text-black/40">
            기반 인프라 설정 및 실시간 엔진 모니터링
          </p>
        </div>
        <button
          onClick={onRefresh}
          aria-label="시스템 관제 새로고침"
          className="p-3 rounded-xl bg-white border border-gray-300 text-[#1B4332] hover:bg-black/5 transition-colors"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Eye size={24} className="text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-1">
                실시간 접속자
              </p>
              <p className="text-3xl font-black text-blue-500">{stats?.totalUsers || 0}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/10">
              <UserPlus size={24} className="text-green-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-1">
                금일 신규 가입
              </p>
              <p className="text-3xl font-black text-green-500">+{stats?.todayNewUsers || 0}</p>
            </div>
          </div>
        </GlassCard>

        <div
          onClick={() => setActiveTab('cs')}
          className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <GlassCard>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <MessageSquare size={24} className="text-purple-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-1">
                  미답변 문의
                </p>
                <p className="text-3xl font-black text-purple-500">
                  {stats?.pendingInquiries || 0}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-500/10">
              <MapPin size={24} className="text-yellow-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-1">
                전체 화장실
              </p>
              <p className="text-3xl font-black text-yellow-500">
                {(stats?.totalToilets || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard>
          <div className="border-b pb-4 mb-6" style={{ borderColor: COLORS.border }}>
            <h3 className="text-xl font-black text-black flex items-center gap-2">
              <Settings size={20} />
              어플리케이션 환경 설정
            </h3>
          </div>

          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-black/[0.02]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-[#1B4332]" />
                  <h4 className="font-black text-black">공지사항 배너</h4>
                </div>
                <button
                  onClick={() => handleToggle('noticeEnabled')}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    settings.noticeEnabled ? 'bg-[#1B4332]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                      settings.noticeEnabled ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
              {settings.noticeEnabled && (
                <div
                  className={`mt-4 p-3 border rounded-xl border-dashed transition-all ${
                    editingNotice ? 'bg-yellow-50/50 border-yellow-200' : 'bg-white'
                  }`}
                >
                  {editingNotice ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tempNoticeMessage}
                        onChange={(e) => setTempNoticeMessage(e.target.value)}
                        className="flex-1 text-sm font-bold bg-transparent border-none focus:ring-0"
                      />
                      <button
                        onClick={handleNoticeMessageSave}
                        className="text-xs font-black text-blue-500"
                      >
                        저장
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-black/70 truncate">
                        {settings.noticeMessage}
                      </p>
                      <button
                        onClick={() => setEditingNotice(true)}
                        className="text-xs font-black text-black/30"
                      >
                        수정
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-black/[0.02]">
              <div className="flex items-center gap-3">
                <Lock size={18} className="text-red-500" />
                <div>
                  <h4 className="font-black text-black">점검 모드 (Maintenance)</h4>
                  <p className="text-[10px] font-bold text-black/40">
                    활성화 시 모든 유저의 접속이 차단됩니다
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('maintenanceMode')}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                    settings.maintenanceMode ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-black/[0.02]">
              <div className="flex items-center gap-3">
                <UserPlus size={18} className="text-blue-500" />
                <div>
                  <h4 className="font-black text-black">신규 회원가입 허용</h4>
                  <p className="text-[10px] font-bold text-black/40">
                    신규 사용자의 가입 가능 여부를 결정합니다
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('signupEnabled')}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  settings.signupEnabled ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                    settings.signupEnabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div
            className="flex items-center justify-between border-b pb-4 mb-6"
            style={{ borderColor: COLORS.border }}
          >
            <h3 className="text-xl font-black text-black flex items-center gap-2">
              <Database size={20} />
              최신 시스템 로그
            </h3>
            <button
              onClick={() => setActiveTab('logs')}
              className="text-[10px] font-black text-black/30 hover:text-black transition-colors uppercase"
            >
              View All
            </button>
          </div>
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {logs.slice(0, 10).map((log, idx) => (
              <div
                key={log.id || idx}
                className={`p-4 rounded-2xl border ${getLogBgColor(log.level)} transition-all hover:scale-[1.01]`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getLogIcon(log.level)}
                    <span className="text-[10px] font-black tracking-widest uppercase text-black/80">
                      {log.level}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-black/30">
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '방금 전'}
                  </span>
                </div>
                <p className="text-[11px] font-black text-black/30 uppercase tracking-tighter mb-1">
                  {log.source}
                </p>
                <p className="text-sm font-bold text-black/80 leading-snug">{log.message}</p>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="py-20 text-center opacity-20 font-black uppercase tracking-widest text-xs">
                No logs available
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
export default SystemView;
