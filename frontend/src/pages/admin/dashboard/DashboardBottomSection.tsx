import { Activity, AlertTriangle, ChevronRight, MapPin, MessageSquare } from 'lucide-react';
import { GlassCard } from '../../../components/common/GlassCard';
import type { AdminStatsResponse } from '../../../types/admin';
import { type AdminTab, COLORS } from '../adminCommons';

interface DashboardBottomSectionProps {
  stats: AdminStatsResponse | null;
  logs: any[] | null;
  setActiveTab: (tab: AdminTab) => void;
}

/** 최근 시스템 로그 타임라인과 다른 관리 탭으로 이동하는 바로가기 */
export const DashboardBottomSection = ({
  stats,
  logs,
  setActiveTab,
}: DashboardBottomSectionProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* Real-time Logs List */}
    <GlassCard className="lg:col-span-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black text-black">시스템 타임라인</h3>
          <p className="text-[10px] font-black text-black/30 uppercase tracking-widest">
            Real-time Events
          </p>
        </div>
        <button
          onClick={() => setActiveTab('logs')}
          className="p-2 rounded-xl hover:bg-black/5 text-black/30 transition-all"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(logs || []).slice(0, 4).map((log, idx) => (
          <div
            key={log.id || idx}
            className="flex items-start gap-4 p-4 rounded-2xl bg-black/[0.02] border border-black/5 hover:border-black/10 transition-all"
          >
            <div
              className="p-2.5 rounded-xl bg-black/5"
              style={{
                color:
                  log.level === 'ERROR'
                    ? COLORS.error
                    : log.level === 'WARN'
                      ? COLORS.warning
                      : COLORS.primary,
              }}
            >
              {log.level === 'ERROR' ? <AlertTriangle size={18} /> : <Activity size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <span
                  className="text-[9px] font-black tracking-widest uppercase"
                  style={{ color: log.level === 'ERROR' ? COLORS.error : COLORS.textSecondary }}
                >
                  {log.source || 'SYSTEM'}
                </span>
                <span className="text-[9px] text-black/30 font-bold">
                  {log.timestamp
                    ? new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '방금 전'}
                </span>
              </div>
              <p className="text-[13px] font-bold text-black/80 truncate">{log.message}</p>
            </div>
          </div>
        ))}
        {(logs || []).length === 0 && (
          <div className="md:col-span-2 py-10 text-center opacity-30 font-bold text-sm uppercase tracking-widest">
            No recent system logs
          </div>
        )}
      </div>
    </GlassCard>

    {/* Quick Actions Grid */}
    <div className="grid grid-cols-2 gap-4">
      <div
        onClick={() => setActiveTab('toilets')}
        className="col-span-2 relative overflow-hidden rounded-[24px] p-6 bg-white border border-black/5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#E8A838]/30 group transition-all"
      >
        <div className="w-12 h-12 rounded-2xl bg-[#E8A838]/5 text-[#E8A838] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
          <MapPin size={24} />
        </div>
        <span className="text-sm font-black text-black">맵 관제</span>
      </div>
      <div
        onClick={() => setActiveTab('cs')}
        className="col-span-2 relative overflow-hidden rounded-[24px] p-6 bg-white border border-black/5 flex items-center gap-6 cursor-pointer hover:border-blue-500/30 group transition-all"
      >
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:rotate-12 transition-transform">
          <MessageSquare size={28} />
        </div>
        <div className="text-left">
          <h4 className="text-base font-black text-black">고객 지원 센터</h4>
          <p className="text-xs font-bold text-black/40">
            미해결 티켓: {stats?.pendingInquiries || 0}건
          </p>
        </div>
        <ChevronRight
          size={20}
          className="ml-auto text-black/10 group-hover:text-black/30 transition-all"
        />
      </div>
    </div>
  </div>
);
