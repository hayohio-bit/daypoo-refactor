import { Search as SearchIcon } from 'lucide-react';

type FilterMode = 'all' | 'favorite' | 'visited';

interface ToiletSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filter: FilterMode;
  onFilterChange: (filter: FilterMode) => void;
}

export function ToiletSearchBar({ searchQuery, onSearchChange, filter, onFilterChange }: ToiletSearchBarProps) {
  return (
    <div className="absolute top-[150px] md:top-[170px] left-1/2 -translate-x-1/2 z-20 w-full px-4" style={{ maxWidth: '600px' }}>
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={{ border: '1.5px solid transparent', background: '#fff', boxShadow: '0 4px 24px rgba(27,67,50,0.15)' }}>
        <SearchIcon size={16} style={{ color: '#7a9e8a' }} />
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="화장실 검색"
          className="flex-1 outline-none text-sm placeholder:text-[#7a9e8a]/60"
          style={{ background: 'transparent', color: '#1A2B27' }}
        />
      </div>
      <div className="flex gap-2 mt-2 justify-center">
        {(['all', 'favorite', 'visited'] as FilterMode[]).map((f) => (
          <button 
            key={f} 
            onClick={() => onFilterChange(f)} 
            className="px-4 py-1.5 rounded-full text-xs font-bold transition-all" 
            style={{ 
              background: filter === f ? '#1B4332' : 'rgba(255,255,255,0.9)', 
              color: filter === f ? '#fff' : '#2D6A4F', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
            }}
          >
            {f === 'all' ? '전체' : f === 'favorite' ? '즐겨찾기' : '내 기록'}
          </button>
        ))}
      </div>
    </div>
  );
}
