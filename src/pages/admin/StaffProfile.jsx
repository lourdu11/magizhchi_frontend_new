import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store';
import { useMutation } from '@tanstack/react-query';
import { UserCircle, Mail, Phone, Save, Loader2, KeyRound } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { Helmet } from 'react-helmet-async';

export default function StaffProfile() {
  const { user, setAuth, token } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => api.put('/users/profile', data).then(res => res.data),
    onSuccess: (res) => {
      // res.data contains the updated user object
      setAuth(res.data, token);
      toast.success('Profile updated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      email: formData.email,
      phone: formData.phone,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <Helmet>
        <title>Account Settings | Magizhchi Control Console</title>
      </Helmet>

      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#DADCE0] shadow-sm flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
          <UserCircle size={40} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#202124] tracking-tight">{user?.name || 'User Profile'}</h1>
          <p className="text-[#5F6368] font-medium mt-1">Manage your account email and phone number</p>
          <div className="mt-3 inline-flex px-3 py-1 bg-[#F1F3F4] text-[#202124] rounded-full text-[10px] font-black uppercase tracking-widest">
            {user?.role === 'admin' ? 'Administrator' : 'Staff Member'}
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-[#DADCE0] shadow-sm space-y-8">
        <div>
          <h2 className="text-lg font-black text-[#202124] mb-4">Contact Information</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black text-[#5F6368] uppercase tracking-widest mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-[#202124]"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-[#5F6368] uppercase tracking-widest mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-[#202124]"
                  placeholder="Enter 10-digit number"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#F1F3F4] flex justify-end">
          <button
            type="submit"
            disabled={updateProfileMutation.isLoading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
          >
            {updateProfileMutation.isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Save Changes
          </button>
        </div>
      </form>
      
      {/* Read-Only Security Section for Visual Polish */}
      <div className="bg-[#F8F9FA] p-6 sm:p-8 rounded-3xl border border-[#DADCE0]">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white border border-[#DADCE0] rounded-xl shrink-0">
            <KeyRound size={20} className="text-[#5F6368]" />
          </div>
          <div>
            <h3 className="font-bold text-[#202124]">Password & Security</h3>
            <p className="text-sm text-[#5F6368] mt-1">To change your password, please sign out and use the "Forgot Password" option on the login screen. This ensures maximum security.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
