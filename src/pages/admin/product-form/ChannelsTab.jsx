import { useProductForm } from './FormContext';
import { SectionHeader } from './Common';
import { Globe, ShoppingCart, CheckCircle2 } from 'lucide-react';

const ChannelCard = ({ icon: Icon, title, desc, active, onToggle, color }) => (
  <button 
    onClick={onToggle}
    className={`p-5 md:p-10 rounded-[3rem] border-2 transition-all text-left flex flex-col gap-6 group relative overflow-hidden ${active ? 'border-charcoal bg-white shadow-2xl' : 'border-border-light bg-light-bg/30 grayscale opacity-60'}`}
  >
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} shadow-inner group-hover:scale-110 transition-transform`}>
      <Icon size={24} />
    </div>
    <div>
      <h4 className="text-sm font-black text-charcoal uppercase tracking-tight">{title}</h4>
      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-2 leading-relaxed">{desc}</p>
    </div>
    {active && <CheckCircle2 className="absolute top-8 right-8 text-premium-gold" size={24} />}
  </button>
);

export default function ChannelsTab() {
  const { state, dispatch } = useProductForm();
  const { formData } = state;

  const setField = (field, value) => dispatch({ type: 'SET_FIELD', field, value });

  return (
    <div className="space-y-12">
      <SectionHeader title="Channel Distribution" subtitle="Control visibility across platforms" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ChannelCard 
          icon={Globe} 
          title="Online Storefront" 
          desc="Visible on customer-facing website and mobile app." 
          active={formData.isOnlineProduct} 
          onToggle={() => setField('isOnlineProduct', !formData.isOnlineProduct)}
          color="text-green-600 bg-green-50"
        />
        <ChannelCard 
          icon={ShoppingCart} 
          title="Offline Billing" 
          desc="Enable for POS scanning and manual bills." 
          active={formData.isBillingProduct} 
          onToggle={() => setField('isBillingProduct', !formData.isBillingProduct)}
          color="text-orange-600 bg-orange-50"
        />
      </div>
    </div>
  );
}
