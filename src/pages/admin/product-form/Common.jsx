import { Tag, Info } from 'lucide-react';

export const SectionHeader = ({ title, subtitle }) => (
  <div>
    <h3 className="text-xl font-black text-charcoal tracking-tight uppercase leading-none">{title}</h3>
    <p className="text-[9px] text-text-muted font-bold uppercase tracking-[0.2em] mt-2">{subtitle}</p>
  </div>
);

export const InputField = ({ label, value, onChange, placeholder, type = "text", icon: Icon, required, disabled }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between ml-1">
      <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{label} {required && <span className="text-red-500">*</span>}</label>
    </div>
    <div className="relative group">
      {Icon && <Icon className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-premium-gold transition-colors" size={16} />}
      <input
        type={type}
        disabled={disabled}
        className={`w-full bg-white border border-border-light shadow-sm rounded-2xl ${Icon ? 'pl-16' : 'px-5'} py-4 font-black text-xs text-charcoal placeholder:text-text-muted/40 focus:ring-4 focus:ring-premium-gold/10 transition-all outline-none`}
        placeholder={placeholder}
        value={value === 0 ? 0 : (value || '')}
        onChange={e => {
          const val = e.target.value;
          if (type === 'number') {
            // Allow empty string so user can clear the input
            if (val === '') return onChange('');
            onChange(Number(val));
          } else {
            onChange(val);
          }
        }}
      />
    </div>
  </div>
);

export const SelectField = ({ label, value, options, onChange, icon: Icon }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">{label}</label>
    <div className="relative group">
       {Icon && <Icon className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-premium-gold transition-colors" size={16} />}
       <select 
          className={`w-full bg-white border border-border-light shadow-sm rounded-2xl ${Icon ? 'pl-16' : 'px-5'} py-4 font-black text-xs text-charcoal uppercase appearance-none outline-none focus:ring-4 focus:ring-premium-gold/10 transition-all`}
          value={value} 
          onChange={e => onChange(e.target.value)}
       >
          {options.map(opt => (
             <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>
          ))}
       </select>
    </div>
  </div>
);

export const StockSummaryBox = ({ label, value, color }) => (
  <div className={`p-4 sm:p-4 sm:p-6 rounded-[2rem] border-2 ${color} bg-white flex flex-col items-center justify-center text-center`}>
    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">{label}</span>
    <span className="text-2xl font-black text-charcoal">{value.toLocaleString()}</span>
  </div>
);
