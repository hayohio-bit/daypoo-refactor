import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  RefreshCw,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import WaveButtonComponent from '../../components/WaveButton';
import { GlassCard } from '../../components/common/GlassCard';
import { api } from '../../services/apiClient';
import type {
  AdminItemCreateRequest,
  ItemResponse,
  ItemType,
  PageResponse,
} from '../../types/admin';
import { type AvatarStyle, parseDicebearUrl } from '../../utils/avatar';
import { COLORS, type AdminTab } from './adminCommons';

export interface StoreViewProps {
  setActiveTab: (tab: AdminTab) => void;
  setEditingItem: (item: ItemResponse) => void;
}

export const StoreView = ({ setActiveTab, setEditingItem }: StoreViewProps) => {
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ItemType | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: '15',
      });
      if (filter !== 'ALL') params.append('type', filter);

      const response = await api.get<PageResponse<ItemResponse>>(`/admin/shop/items?${params}`);
      setItems(response?.content || []);
      setTotalPages(response?.totalPages || 0);
      setTotalElements(response?.totalElements || 0);
    } catch (error) {
      console.error('아이템 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, filter]);

  const handleDeleteItem = async (id: number, name: string) => {
    if (!confirm(`"${name}" 아이템을 삭제하시겠습니까?`)) return;

    try {
      await api.delete(`/admin/shop/items/${id}`);
      alert('아이템이 삭제되었습니다.');
      fetchItems();
    } catch (error: any) {
      alert(error.message || '아이템 삭제에 실패했습니다.');
    }
  };

  const [syncingStore, setSyncingStore] = useState(false);
  const [generatingItems, setGeneratingItems] = useState(false);

  const handleSyncDefaultItems = async () => {
    if (syncingStore) return;
    const confirmed = confirm(
      '미공개 상태의 모든 아이템을 상점에 공개하시겠습니까?\n공개된 아이템은 유저의 마이페이지 상점에 노출됩니다.',
    );
    if (!confirmed) return;

    setSyncingStore(true);
    try {
      const result = await api.post<{ publishedCount: number }>('/admin/shop/items/publish-all');
      const count = result?.publishedCount ?? 0;
      if (count > 0) {
        alert(
          `${count}개의 아이템이 공개되었습니다.\n마이페이지의 [상점] 탭에서 확인하실 수 있습니다.`,
        );
      } else {
        alert('공개할 미공개 아이템이 없습니다.');
      }
      fetchItems();
    } catch (error: any) {
      console.error('동기화 실패:', error);
      const errorMsg = error?.response?.data?.message || error?.message || '알 수 없는 오류';
      alert(`동기화 중 오류가 발생했습니다.\n\n상세: ${errorMsg}`);
    } finally {
      setSyncingStore(false);
    }
  };

  const handleTogglePublish = async (itemId: number, itemName: string) => {
    try {
      await api.put(`/admin/shop/items/${itemId}/toggle-publish`);
      fetchItems();
    } catch (error: any) {
      console.error('공개 상태 변경 실패:', error);
      alert(`"${itemName}" 공개 상태 변경에 실패했습니다.`);
    }
  };

  const handleGenerateTestData = async () => {
    if (generatingItems) return;
    const confirmed = confirm(
      '20개의 프리미엄 상점 테스트 데이터를 생성하시겠습니까?\n이 작업은 다소 시간이 걸릴 수 있습니다.',
    );
    if (!confirmed) return;

    setGeneratingItems(true);
    try {
      const avatarItems = [
        { emoji: '👑', name: '왕족 스타일', desc: '왕실의 위엄이 느껴지는 고귀한 캐릭터' },
        { emoji: '🎩', name: '신사 스타일', desc: '우아하고 세련된 신사 캐릭터' },
        { emoji: '🎀', name: '러블리 핑크', desc: '사랑스럽고 귀여운 핑크 캐릭터' },
        { emoji: '🧢', name: '힙합 스타일', desc: '스트릿 감성 넘치는 힙합 캐릭터' },
        { emoji: '🎓', name: '졸업생 스타일', desc: '영광스러운 졸업생 캐릭터' },
        { emoji: '🪖', name: '군인 스타일', desc: '강인하고 용맹한 군인 캐릭터' },
        { emoji: '🦊', name: '미스터리 스타일', desc: '신비롭고 영리한 여우 캐릭터' },
        { emoji: '🐱', name: '냥냥 스타일', desc: '귀엽고 사랑스러운 고양이 캐릭터' },
        { emoji: '🐶', name: '멍멍 스타일', desc: '충직하고 친근한 강아지 캐릭터' },
        { emoji: '🦄', name: '유니콘 스타일', desc: '환상적이고 신비로운 유니콘 캐릭터' },
      ];

      const effectItems = [
        { emoji: '✨', name: '반짝이는 오라', desc: '온몸을 감싸는 반짝이는 빛' },
        { emoji: '🌟', name: '별빛 오라', desc: '밤하늘 별처럼 빛나는 효과' },
        { emoji: '💫', name: '유성 궤적', desc: '이동할 때 남는 유성 꼬리' },
        { emoji: '🔥', name: '화염 오라', desc: '타오르는 불꽃 효과' },
        { emoji: '❄️', name: '얼음 오라', desc: '차가운 얼음 결정 효과' },
        { emoji: '🌊', name: '물결 효과', desc: '잔잔한 물결 애니메이션' },
        { emoji: '💨', name: '바람 효과', desc: '시원한 바람이 부는 효과' },
        { emoji: '⚡', name: '번개 오라', desc: '전기가 튀는 섬광 효과' },
        { emoji: '🌈', name: '무지개 오라', desc: '화려한 7색 무지개 효과' },
        { emoji: '🌀', name: '회오리 효과', desc: '빙글빙글 도는 회오리' },
      ];

      const testItems: AdminItemCreateRequest[] = [];
      const avatarStyles: AvatarStyle[] = [
        'avataaars',
        'bottts',
        'lorelei',
        'pixelArt',
        'funEmoji',
      ];
      avatarItems.forEach((item, index) => {
        const randomStyle = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
        const randomSeed = `test-avatar-${index}-${Math.random().toString(36).substring(7)}`;

        testItems.push({
          name: item.name,
          type: 'AVATAR',
          price: Math.floor(Math.random() * 20) * 100 + 500,
          description: `[헤드] ${item.desc}`,
          imageUrl: `dicebear:${randomStyle}:${randomSeed}`,
        });
      });

      effectItems.forEach((item) => {
        testItems.push({
          name: item.name,
          type: 'EFFECT',
          price: Math.floor(Math.random() * 30) * 100 + 1000,
          description: `[이펙트] ${item.desc}`,
          imageUrl: item.emoji,
        });
      });

      for (const item of testItems) {
        await api.post('/admin/shop/items', {
          ...item,
        });
      }

      alert('20개의 다채롭고 고유한 이미지를 가진 테스트 데이터 생성이 완료되었습니다!');
      fetchItems();
    } catch (error) {
      console.error('테스트 데이터 생성 실패:', error);
      alert('데이터 생성 중 오류가 발생했습니다.');
    } finally {
      setGeneratingItems(false);
    }
  };

  const handleDeleteAllItems = async () => {
    if (items.length === 0) {
      alert('삭제할 아이템이 없습니다.');
      return;
    }

    const confirmed = confirm(
      `현재 표시된 ${items.length}개의 아이템을 전부 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다!`,
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const item of items) {
        try {
          await api.delete(`/admin/shop/items/${item.id}`);
          successCount++;
        } catch (error) {
          console.error(`아이템 ${item.id} 삭제 실패:`, error);
          failCount++;
        }
      }

      alert(`삭제 완료!\n성공: ${successCount}개 / 실패: ${failCount}개`);
      fetchItems();
    } catch (error) {
      console.error('일괄 삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getItemTypeColor = (type: ItemType) => {
    switch (type) {
      case 'AVATAR':
        return '#3B82F6';
      case 'EFFECT':
        return '#52b788';
      default:
        return '#1B4332';
    }
  };

  const getItemTypeLabel = (type: ItemType) => {
    switch (type) {
      case 'AVATAR':
        return '아바타';
      case 'EFFECT':
        return '효과';
      default:
        return type;
    }
  };

  const isEmoji = (str: string) => {
    return str && str.length <= 4 && /\p{Extended_Pictographic}/u.test(str);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <GlassCard
            className="py-2 px-4 shadow-none border-dashed bg-transparent"
            glowColor="transparent"
          >
            <span className="text-[10px] font-black uppercase text-[#1B4332]/50 mr-2">
              총 아이템
            </span>
            <span className="font-black text-[#E8A838]">{totalElements}개</span>
          </GlassCard>
          <div className="flex gap-2">
            {(['ALL', 'AVATAR', 'EFFECT'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type as any)}
                className={`px-3 py-2 rounded-xl font-bold text-[10px] uppercase transition-all ${
                  filter === type
                    ? 'bg-[#1B4332] text-white shadow-lg'
                    : 'bg-white border border-gray-300 text-black hover:bg-black/5'
                }`}
              >
                {type === 'ALL' ? '전체' : getItemTypeLabel(type as ItemType)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 md:ml-4">
            <WaveButtonComponent
              onClick={handleSyncDefaultItems}
              disabled={syncingStore}
              variant="primary"
              size="sm"
              className="shadow-md animate-none"
              icon={
                syncingStore ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )
              }
            >
              {syncingStore ? '동기화 중...' : '미공개 아이템 전체 공개'}
            </WaveButtonComponent>
            <WaveButtonComponent
              onClick={handleGenerateTestData}
              disabled={generatingItems}
              variant="accent"
              size="sm"
              className="shadow-md animate-none"
              icon={
                generatingItems ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )
              }
            >
              {generatingItems ? '생성 중...' : '테스트 아이템 20개 생성'}
            </WaveButtonComponent>
            <WaveButtonComponent
              onClick={handleDeleteAllItems}
              disabled={loading || items.length === 0}
              variant="error"
              size="sm"
              className="shadow-md animate-none"
              icon={<Trash2 size={14} />}
            >
              현재 페이지 전체 삭제
            </WaveButtonComponent>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('add-item')}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1B4332] text-white rounded-2xl font-black text-xs shadow-xl shadow-green-900/20 whitespace-nowrap self-start xl:self-auto"
        >
          <Plus size={16} /> 신규 아이템 등록
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={32} className="animate-spin text-[#1B4332]" />
        </div>
      ) : (items || []).length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag size={48} className="mx-auto mb-4 text-black/20" />
          <p className="font-bold text-black/40">등록된 아이템이 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {(items || []).map((item) => {
              const color = getItemTypeColor(item.type);
              return (
                <GlassCard
                  key={item.id}
                  className="group cursor-pointer w-full h-full flex flex-col"
                >
                  <div className="w-full aspect-square rounded-[24px] mb-4 bg-black/[0.02] flex items-center justify-center relative overflow-hidden flex-shrink-0">
                    <div
                      className="w-16 h-16 rounded-full blur-3xl opacity-20 absolute"
                      style={{ background: color }}
                    />
                    <div className="w-full h-full flex items-center justify-center transition-transform group-hover:scale-105 duration-500">
                      {item.imageUrl &&
                      (isEmoji(item.imageUrl) ||
                        (!item.imageUrl.includes(':') &&
                          !item.imageUrl.startsWith('http') &&
                          !item.imageUrl.startsWith('/'))) ? (
                        <span className="text-6xl select-none leading-none">{item.imageUrl}</span>
                      ) : (
                        <img
                          src={parseDicebearUrl(item.imageUrl, item.id, item.type)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="absolute top-3 right-3 flex gap-1">
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-white/90 border text-black/40">
                        {getItemTypeLabel(item.type)}
                      </span>
                    </div>
                    <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id, item.name);
                        }}
                        className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingItem(item);
                          setActiveTab('edit-item');
                        }}
                        className="p-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-lg"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  </div>
                  <h5 className="font-black text-sm mb-1 text-black truncate">{item.name}</h5>
                  <p className="text-xs text-black/50 mb-2 line-clamp-2 font-bold min-h-[32px]">
                    {item.description}
                  </p>
                  <div className="mt-auto">
                    <div className="h-[52px] flex items-end mb-4">
                      {item.discountPrice != null ? (
                        <div>
                          <p className="text-xs text-black/40 line-through font-bold">
                            {item.price.toLocaleString()} P
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="font-black text-lg" style={{ color }}>
                              {item.discountPrice.toLocaleString()} P
                            </p>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-red-100 text-red-500">
                              -{Math.round((1 - item.discountPrice / item.price) * 100)}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="font-black text-lg" style={{ color }}>
                          {(item.price || 0).toLocaleString()} P
                        </p>
                      )}
                    </div>
                    <div
                      className="flex items-center justify-between border-t pt-4"
                      style={{ borderColor: COLORS.border }}
                    >
                      <span className="text-[9px] font-black text-black/40 uppercase tracking-widest">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'NO DATE'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePublish(item.id, item.name);
                        }}
                        className={`text-[10px] font-black italic px-2 py-0.5 rounded-md transition-colors ${
                          item.published
                            ? 'text-green-500 bg-green-50 hover:bg-green-100'
                            : 'text-orange-500 bg-orange-50 hover:bg-orange-100'
                        }`}
                      >
                        {item.published ? '공개중' : '미공개'}
                      </button>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-2 rounded-xl bg-white border border-gray-300 text-[#1B4332] hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 py-2 font-bold text-sm text-black">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-xl bg-white border border-gray-300 text-[#1B4332] hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default StoreView;
