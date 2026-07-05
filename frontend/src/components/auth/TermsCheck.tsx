import { Check } from 'lucide-react';

interface TermsCheckProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  required?: boolean;
  children: React.ReactNode;
}

export function TermsCheck({ checked, onChange, required, children }: TermsCheckProps) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-start gap-3 text-left w-full group">
      <div className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center mt-0.5 transition-all duration-200"
        style={{
          background: checked ? '#E8A838' : '#f8faf9',
          border: checked ? '2px solid #E8A838' : '1.5px solid rgba(26,43,39,0.1)',
        }}>
        {checked && <Check size={11} strokeWidth={3} color="#1B4332" />}
      </div>
      <span className="text-sm leading-relaxed transition-colors group-hover:text-[#1A2B27]" style={{ color: 'rgba(26,43,39,0.6)' }}>
        {children}{required && <span style={{ color: '#E85D5D' }}> *</span>}
      </span>
    </button>
  );
}
