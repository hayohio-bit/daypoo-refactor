import { RefreshCw } from 'lucide-react';
import { GlassCard } from '../../components/common/GlassCard';
import { COLORS } from './adminCommons';

export interface LogsViewProps {
  logs: any[];
  loading: boolean;
}

export const LogsView = ({ logs, loading }: LogsViewProps) => {
  if (loading)
    return (
      <div className="flex justify-center py-20">
        <RefreshCw size={24} className="animate-spin text-black/20" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-black text-black">실시간 시스템 로그</h3>
          <p className="text-sm font-bold text-black/40">
            백엔드 및 인프라 엔진의 모든 런타임 이벤트를 모니터링합니다.
          </p>
        </div>
        <button className="px-4 py-2 rounded-xl bg-black text-white font-black text-[10px] uppercase shadow-lg self-start sm:self-auto">
          Export CSV
        </button>
      </div>
      <GlassCard className="p-0 border-none bg-transparent shadow-none">
        <div
          className="overflow-x-auto rounded-[28px] border bg-white/50 backdrop-blur-xl"
          style={{ borderColor: COLORS.border }}
        >
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/[0.02] border-b" style={{ borderColor: COLORS.border }}>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                  Timestamp
                </th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                  Type
                </th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                  Message
                </th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40 text-right">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {(logs || []).map((log, idx) => (
                <tr
                  key={log.id || idx}
                  className="border-b transition-colors hover:bg-black/[0.01]"
                  style={{ borderColor: COLORS.border }}
                >
                  <td className="px-8 py-5 text-xs font-bold text-black/60">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : '방금 전'}
                  </td>
                  <td
                    className="px-8 py-5 text-[10px] font-black tracking-widest"
                    style={{
                      color:
                        log.level === 'ERROR'
                          ? COLORS.error
                          : log.level === 'WARN'
                          ? COLORS.warning
                          : COLORS.textSecondary,
                    }}
                  >
                    {log.level || 'INFO'}
                  </td>
                  <td className="px-8 py-5 text-sm font-black text-black">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-black/30 uppercase tracking-tighter mb-0.5">
                        {log.source}
                      </span>
                      <span className="line-clamp-1">{log.message}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right flex justify-end">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[9px] font-black ${
                        log.level === 'ERROR' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {log.level === 'ERROR' ? 'FAIL' : 'OK'}
                    </span>
                  </td>
                </tr>
              ))}
              {(logs || []).length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-20 text-center opacity-30 font-black uppercase tracking-widest text-sm"
                  >
                    No system logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
export default LogsView;
