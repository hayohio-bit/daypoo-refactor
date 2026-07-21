import { ChevronLeft, ChevronRight, Plus, RefreshCw, Settings, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { GlassCard } from '../../components/common/GlassCard';
import { api } from '../../services/apiClient';
import type { AchievementType, AdminTitleResponse, PageResponse } from '../../types/admin';
import { COLORS, type AdminTab } from './adminCommons';

export const ACHIEVEMENT_LABELS: Record<AchievementType, string> = {
  TOTAL_RECORDS: '총 기록 횟수',
  UNIQUE_TOILETS: '방문 화장실 수',
  CONSECUTIVE_DAYS: '연속 기록 일수',
  SAME_TOILET_VISITS: '동일 화장실 방문',
  LEVEL_REACHED: '레벨 달성',
};

export interface TitleManagementViewProps {
  setActiveTab: (tab: AdminTab) => void;
  setEditingTitle: (title: AdminTitleResponse | null) => void;
}

export const TitleManagementView = ({
  setActiveTab,
  setEditingTitle,
}: TitleManagementViewProps) => {
  const [titles, setTitles] = useState<AdminTitleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AchievementType | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchTitles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: '10',
      });
      if (filter !== 'ALL') params.append('type', filter);

      const response = await api.get<PageResponse<AdminTitleResponse>>(`/admin/titles?${params}`);
      setTitles(response.content);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('칭호 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTitles();
  }, [page, filter]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}" 칭호를 삭제하시겠습니까?`)) return;
    try {
      await api.delete(`/admin/titles/${id}`);
      alert('칭호가 삭제되었습니다.');
      fetchTitles();
    } catch (error: any) {
      alert(error.response?.data?.message || '이미 유저가 획득한 칭호는 삭제할 수 없습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-4">
        <div>
          <h3 className="text-2xl font-black text-black">칭호 시스템 관리</h3>
          <p className="text-sm font-bold text-black/40">업적 기반 자동 해금 칭호 설정</p>
        </div>
        <button
          onClick={() => {
            setEditingTitle(null);
            setActiveTab('add-title');
          }}
          className="px-6 py-3 rounded-2xl bg-[#1B4332] text-white font-black text-sm shadow-xl flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus size={18} /> 신규 칭호 등록
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
        {(
          [
            'ALL',
            'TOTAL_RECORDS',
            'UNIQUE_TOILETS',
            'CONSECUTIVE_DAYS',
            'SAME_TOILET_VISITS',
            'LEVEL_REACHED',
          ] as const
        ).map((type) => (
          <button
            key={type}
            onClick={() => {
              setFilter(type);
              setPage(0);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
              filter === type
                ? 'bg-[#1B4332] text-white shadow-lg'
                : 'bg-white border border-black/5 text-black/40 hover:bg-black/5'
            }`}
          >
            {type === 'ALL' ? '전체 보기' : ACHIEVEMENT_LABELS[type as AchievementType]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={32} className="animate-spin text-[#1B4332]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {titles.map((title) => (
            <GlassCard key={title.id} className="p-0 border-none">
              <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="w-16 h-16 rounded-3xl bg-black/[0.03] flex items-center justify-center text-3xl shadow-inner border border-black/5 flex-shrink-0">
                  {title.imageUrl || '🏆'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h4 className="font-black text-lg text-black">{title.name}</h4>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase">
                      {ACHIEVEMENT_LABELS[title.achievementType]}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-black/40">{title.description}</p>
                  <p className="text-[11px] font-black text-[#E8A838] mt-2 italic">
                    Condition: {ACHIEVEMENT_LABELS[title.achievementType]} &ge;{' '}
                    {title.achievementThreshold}
                  </p>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => {
                      setEditingTitle(title);
                      setActiveTab('add-title');
                    }}
                    className="p-3 rounded-xl bg-black/[0.03] text-black/40 hover:text-black/80 hover:bg-black/[0.05] transition-all"
                  >
                    <Settings size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(title.id, title.name)}
                    className="p-3 rounded-xl bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
          {titles.length === 0 && (
            <div className="text-center py-20 bg-black/[0.01] rounded-[40px] border-2 border-dashed border-black/5">
              <X size={40} className="mx-auto text-black/10 mb-4" />
              <p className="text-sm font-black text-black/20">등록된 칭호가 없습니다.</p>
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-xl border border-black/10 disabled:opacity-30"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-black text-black/40">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-2 rounded-xl border border-black/10 disabled:opacity-30"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};
export default TitleManagementView;
