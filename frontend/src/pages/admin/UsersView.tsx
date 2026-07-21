import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { GlassCard } from '../../components/common/GlassCard';
import { api } from '../../services/apiClient';
import type {
  AdminUserDetailResponse,
  AdminUserListResponse,
  PageResponse,
  Role,
} from '../../types/admin';
import { COLORS } from './adminCommons';

export const UsersView = () => {
  const [users, setUsers] = useState<AdminUserListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserListResponse | null>(null);
  const [userDetail, setUserDetail] = useState<AdminUserDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [searchInput, setSearchInput] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: '20',
      });
      if (search) params.append('search', search);
      if (roleFilter && roleFilter !== 'ALL') params.append('role', roleFilter);
      if (planFilter && planFilter !== 'ALL') params.append('plan', planFilter);

      const response = await api.get<PageResponse<AdminUserListResponse>>(`/admin/users?${params}`);
      setUsers(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error: any) {
      console.error('유저 목록 조회 실패:', error);
      alert('유저 목록을 불러오는데 실패했습니다. (' + (error.message || '네트워크 오류') + ')');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    fetchUsers();
  }, [page, search, roleFilter, planFilter]);

  const handleOpenUserDetail = async (user: AdminUserListResponse) => {
    setSelectedUser(user);
    setShowUserModal(true);
    setLoadingDetail(true);
    try {
      const detail = await api.get<AdminUserDetailResponse>(`/admin/users/${user.id}`);
      setUserDetail(detail);
    } catch (error: any) {
      console.error('유저 상세 조회 실패:', error);
      const errorMsg = error.response?.data?.message || error.message || '알 수 없는 오류';
      alert(`유저 정보를 불러오는데 실패했습니다.\n상세: ${errorMsg}`);
      setShowUserModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleUpdateUserRole = async (userId: number, newRole: Role) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      alert('역할이 변경되었습니다.');
      setShowUserModal(false);
      fetchUsers();
    } catch (error: any) {
      console.error('역할 변경 실패:', error);
      alert('역할 변경에 실패했습니다.');
    }
  };

  const handleDeleteUser = async (userId: number, userEmail: string) => {
    const confirmed = window.confirm(
      `정말로 이 사용자를 탈퇴시키겠습니까?\n\n` +
        `이메일: ${userEmail}\n\n` +
        `⚠️ 경고: 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.`,
    );

    if (!confirmed) return;

    try {
      await api.delete(`/admin/users/${userId}`);
      alert('사용자가 성공적으로 탈퇴되었습니다.');
      setShowUserModal(false);
      fetchUsers();
    } catch (error: any) {
      console.error('사용자 삭제 실패:', error);
      alert('탈퇴 처리 중 오류가 발생했습니다. (권한 또는 데이터 제약 조건 확인 필요)');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString)
      .toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      .replace(/\. /g, '.');
  };

  const getRoleBadge = (role: Role) => {
    return role === 'ROLE_ADMIN' ? 'ADMIN' : 'USER';
  };

  const getPlanBadge = (plan: 'BASIC' | 'PRO' | 'PREMIUM') => {
    switch (plan) {
      case 'PRO':
        return (
          <span className="bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase">
            PRO
          </span>
        );
      case 'PREMIUM':
        return (
          <span className="bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase">
            PREMIUM
          </span>
        );
      default:
        return (
          <span className="bg-black/5 text-black/40 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase">
            BASIC
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-black text-black">유저 데이터 센터</h3>
          <p className="text-sm text-black/60 font-bold">
            총 {totalElements.toLocaleString()}명의 사용자
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={18} />
            <input
              type="text"
              placeholder="이메일 또는 닉네임으로 검색"
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-black/5 bg-white/50 backdrop-blur-xl focus:outline-none focus:border-[#1B4332]/30 transition-all font-bold text-sm text-[#1B4332] placeholder:text-black/20"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="relative group">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(0);
              }}
              className="pl-4 pr-10 py-3 rounded-2xl border border-black/5 bg-white/50 backdrop-blur-xl focus:outline-none focus:border-[#1B4332]/30 transition-all font-black text-sm appearance-none cursor-pointer text-[#1B4332] hover:bg-white hover:shadow-md"
            >
              <option value="ALL">역할: 전체</option>
              <option value="ROLE_USER">일반 유저</option>
              <option value="ROLE_ADMIN">관리자</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black/20 group-hover:text-[#1B4332] transition-colors">
              <ChevronRight size={14} className="rotate-90" />
            </div>
          </div>

          <div className="relative group">
            <select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setPage(0);
              }}
              className="pl-4 pr-10 py-3 rounded-2xl border border-black/5 bg-white/50 backdrop-blur-xl focus:outline-none focus:border-[#1B4332]/30 transition-all font-black text-sm appearance-none cursor-pointer text-[#1B4332] hover:bg-white hover:shadow-md"
            >
              <option value="ALL">플랜: 전체</option>
              <option value="BASIC">BASIC (미구독)</option>
              <option value="PRO">PRO</option>
              <option value="PREMIUM">PREMIUM</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black/20 group-hover:text-[#1B4332] transition-colors">
              <ChevronRight size={14} className="rotate-90" />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={32} className="animate-spin text-[#1B4332]" />
        </div>
      ) : (
        <>
          <GlassCard className="p-0 border-none bg-transparent shadow-none">
            <div
              className="overflow-x-auto rounded-[28px] border bg-white/50 backdrop-blur-xl"
              style={{ borderColor: COLORS.border }}
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/[0.02] border-b" style={{ borderColor: COLORS.border }}>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                      사용자 정보
                    </th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                      가입일
                    </th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                      구독 정보
                    </th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                      레벨
                    </th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                      포인트
                    </th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                      기록 수
                    </th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40 text-right">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b transition-colors hover:bg-black/[0.01]"
                      style={{ borderColor: COLORS.border }}
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-black/[0.05] flex items-center justify-center font-black text-black/60 text-xs">
                            {u.id}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-[#1B4332]">
                                {u.nickname}
                              </span>
                              <span
                                className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                                  u.role === 'ROLE_ADMIN'
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-black/5 text-black/40'
                                }`}
                              >
                                {getRoleBadge(u.role)}
                              </span>
                            </div>
                            <p className="text-xs text-black/30 font-bold">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-black/60">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-8 py-5">{getPlanBadge(u.plan)}</td>
                      <td className="px-8 py-5 font-black text-[#2D6A4F]">Lv.{u.level}</td>
                      <td className="px-8 py-5 font-black text-[#E8A838]">
                        {u.points.toLocaleString()} P
                      </td>
                      <td className="px-8 py-5 font-bold text-black/60">{u.recordCount}건</td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => handleOpenUserDetail(u)}
                          className="p-2 rounded-xl hover:bg-black/5 text-black/20 hover:text-black/60 transition-colors"
                        >
                          <Settings size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

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

      <AnimatePresence>
        {showUserModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowUserModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full mx-4 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-[#1B4332]">유저 상세 정보</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 rounded-xl hover:bg-black/5 text-black/40 hover:text-black/60 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {loadingDetail ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw size={32} className="animate-spin text-[#1B4332]" />
                </div>
              ) : userDetail ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        이메일
                      </p>
                      <p className="text-sm font-bold text-black/80">{userDetail.email}</p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        닉네임
                      </p>
                      <p className="text-sm font-bold text-black/80">{userDetail.nickname}</p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        레벨
                      </p>
                      <p className="text-sm font-black text-[#2D6A4F]">Lv.{userDetail.level}</p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        경험치
                      </p>
                      <p className="text-sm font-bold text-black/80">
                        {userDetail.exp?.toLocaleString() || 0} EXP
                      </p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        포인트
                      </p>
                      <p className="text-sm font-black text-[#E8A838]">
                        {userDetail.points.toLocaleString()} P
                      </p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        기록 수
                      </p>
                      <p className="text-sm font-bold text-black/80">{userDetail.recordCount}건</p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        결제 횟수
                      </p>
                      <p className="text-sm font-bold text-black/80">
                        {userDetail.paymentCount || 0}회
                      </p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        총 결제 금액
                      </p>
                      <p className="text-sm font-bold text-black/80">
                        {userDetail.totalPaymentAmount?.toLocaleString() || 0}원
                      </p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        구독 플랜
                      </p>
                      <div>{getPlanBadge(userDetail.plan)}</div>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        가입일
                      </p>
                      <p className="text-sm font-bold text-black/80">
                        {formatDate(userDetail.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-black/[0.02] rounded-2xl p-6">
                    <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-4">
                      계정 설정 및 관리
                    </p>
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-black/60 mb-2">현재 역할</p>
                          <span
                            className={`inline-block text-xs font-black px-3 py-1.5 rounded-lg ${
                              userDetail.role === 'ROLE_ADMIN'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-black/5 text-black/40'
                            }`}
                          >
                            {userDetail.role === 'ROLE_ADMIN' ? 'ADMIN' : 'USER'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateUserRole(userDetail.id, 'ROLE_USER')}
                            disabled={userDetail.role === 'ROLE_USER'}
                            className="px-4 py-2 rounded-xl bg-black/5 text-black/60 text-xs font-black hover:bg-black/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            USER로 변경
                          </button>
                          <button
                            onClick={() => handleUpdateUserRole(userDetail.id, 'ROLE_ADMIN')}
                            disabled={userDetail.role === 'ROLE_ADMIN'}
                            className="px-4 py-2 rounded-xl bg-red-100 text-red-600 text-xs font-black hover:bg-red-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            ADMIN으로 변경
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-xl bg-red-100">
                        <Trash2 size={20} className="text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-red-900 mb-1">위험 구역</p>
                        <p className="text-xs text-red-700 mb-4">
                          사용자를 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.
                        </p>
                        <button
                          onClick={() => handleDeleteUser(userDetail.id, userDetail.email)}
                          className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-black hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <Trash2 size={14} />
                          회원 탈퇴시키기
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default UsersView;
