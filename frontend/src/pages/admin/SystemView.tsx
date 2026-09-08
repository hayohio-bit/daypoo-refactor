import {
  Activity,
  AlertTriangle,
  Bell,
  Database,
  Eye,
  Lock,
  MapPin,
  MessageSquare,
  RefreshCw,
  Settings,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { GlassCard } from '../../components/common/GlassCard';
import { useFeedback } from '../../hooks/useFeedback';
import { getSystemSettings, updateSystemSettings } from '../../services/adminService';
import type { AdminStatsResponse, SystemLog, SystemSettings } from '../../types/admin';
import { type AdminTab, COLORS } from './adminCommons';

export interface SystemViewProps {
  stats: AdminStatsResponse | null;
  logs: SystemLog[];
  loading: boolean;
  onRefresh: () => void;
  setActiveTab: (tab: AdminTab) => void;
}

/** `SystemSettings` 중 토글로 다루는 boolean 항목. 새 항목이 생기면 자동으로 포함된다. */
type ToggleKey = {
  [K in keyof SystemSettings]: SystemSettings[K] extends boolean ? K : never;
}[keyof SystemSettings];

interface ToggleSwitchProps {
  label: string;
  on: boolean;
  onColor: string;
  disabled: boolean;
  onToggle: () => void;
}

const ToggleSwitch = ({ label, on, onColor, disabled, onToggle }: ToggleSwitchProps) => (
  <button
    onClick={onToggle}
    disabled={disabled}
    aria-label={label}
    aria-pressed={on}
    className={`w-12 h-6 rounded-full transition-colors relative ${on ? onColor : 'bg-gray-300'}`}
  >
    <div
      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
        on ? 'left-7' : 'left-1'
      }`}
    />
  </button>
);

interface SettingRowProps {
  icon: ReactNode;
  title: string;
  description: string;
  toggle: ReactNode;
}

const SettingRow = ({ icon, title, description, toggle }: SettingRowProps) => (
  <div className="flex items-center justify-between p-4 rounded-xl bg-black/[0.02]">
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <h4 className="font-black text-black">{title}</h4>
        <p className="text-[10px] font-bold text-black/40">{description}</p>
      </div>
    </div>
    {toggle}
  </div>
);

export const SystemView = ({ stats, logs, loading, onRefresh, setActiveTab }: SystemViewProps) => {
  /** 서버에서 읽기 전에는 null 이다. 이 동안에는 설정 조작을 막는다. */
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const { notifySuccess, notifyError } = useFeedback();
  const [saving, setSaving] = useState(false);
  const [editingNotice, setEditingNotice] = useState(false);
  const [tempNoticeMessage, setTempNoticeMessage] = useState('');

  const loadSettings = useCallback(async () => {
    setLoadFailed(false);
    try {
      setSettings(await getSystemSettings());
    } catch (error) {
      setLoadFailed(true);
      notifyError(error, '시스템 설정을 불러오지 못했어요');
    }
  }, [notifyError]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  /**
   * 바뀐 값을 먼저 화면에 반영하고 서버에 저장한다. PUT 은 다섯 항목을 모두 요구하므로
   * 현재 값과 합쳐 보낸다. 저장에 실패하면 이전 값으로 되돌린다. 저장 성공 여부를 돌려준다.
   */
  const updateSettings = async (changes: Partial<SystemSettings>): Promise<boolean> => {
    if (!settings || saving) return false;
    const previous = settings;
    const next = { ...previous, ...changes };
    setSettings(next);
    setSaving(true);
    try {
      const saved = await updateSystemSettings(next);
      setSettings(saved);
      notifySuccess('설정을 저장했어요.');
      return true;
    } catch (error) {
      setSettings(previous);
      notifyError(error, '설정 저장에 실패했어요');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: ToggleKey) => {
    if (settings) updateSettings({ [key]: !settings[key] });
  };

  /**
   * 점검 모드를 켜면 `MaintenanceModeFilter` 가 관리자 외 모든 요청에 503 을 돌려주므로,
   * 다른 관리자 뷰의 파괴적 작업과 같이 켤 때만 확인을 받는다. 끄는 것은 바로 반영한다.
   */
  const handleMaintenanceToggle = () => {
    if (!settings) return;
    if (
      !settings.maintenanceMode &&
      !window.confirm(
        '점검 모드를 켜면 관리자를 제외한 모든 사용자의 요청이 차단됩니다.\n' +
          '지도 조회·기록·로그인이 모두 중단됩니다.\n\n' +
          '점검 모드를 켜시겠습니까?',
      )
    ) {
      return;
    }
    handleToggle('maintenanceMode');
  };

  const startEditingNotice = () => {
    if (!settings) return;
    setTempNoticeMessage(settings.noticeMessage ?? '');
    setEditingNotice(true);
  };

  /** 저장이 실패하거나 다른 저장이 진행 중이면 편집 상태를 유지해 입력한 문구를 잃지 않는다. */
  const handleNoticeMessageSave = async () => {
    if (await updateSettings({ noticeMessage: tempNoticeMessage })) {
      setEditingNotice(false);
    }
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

          {!settings ? (
            <div className="py-16 text-center text-xs font-black uppercase tracking-widest text-black/30">
              {loadFailed ? (
                <button onClick={loadSettings} className="underline hover:text-black">
                  설정을 불러오지 못했습니다. 다시 시도
                </button>
              ) : (
                '설정을 불러오는 중입니다'
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-black/[0.02]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Bell size={18} className="text-[#1B4332]" />
                    <h4 className="font-black text-black">공지사항 배너</h4>
                  </div>
                  <ToggleSwitch
                    label="공지사항 배너"
                    on={settings.noticeEnabled}
                    onColor="bg-[#1B4332]"
                    disabled={saving}
                    onToggle={() => handleToggle('noticeEnabled')}
                  />
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
                          disabled={saving}
                          className="text-xs font-black text-blue-500 disabled:opacity-40"
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
                          onClick={startEditingNotice}
                          className="text-xs font-black text-black/30"
                        >
                          수정
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <SettingRow
                icon={<Lock size={18} className="text-red-500" />}
                title="점검 모드 (Maintenance)"
                description="활성화 시 모든 유저의 접속이 차단됩니다"
                toggle={
                  <ToggleSwitch
                    label="점검 모드"
                    on={settings.maintenanceMode}
                    onColor="bg-red-500"
                    disabled={saving}
                    onToggle={handleMaintenanceToggle}
                  />
                }
              />

              <SettingRow
                icon={<UserPlus size={18} className="text-blue-500" />}
                title="신규 회원가입 허용"
                description="신규 사용자의 가입 가능 여부를 결정합니다"
                toggle={
                  <ToggleSwitch
                    label="신규 회원가입 허용"
                    on={settings.signupEnabled}
                    onColor="bg-blue-500"
                    disabled={saving}
                    onToggle={() => handleToggle('signupEnabled')}
                  />
                }
              />
            </div>
          )}
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
