import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authService } from '../../services';
import { useAuthStore } from '../../store';

export default function StaffLogin() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authService.login(identifier, password);
      if (!['staff', 'admin'].includes(data.data.user.role)) {
        return toast.error('No staff access for this account');
      }
      setAuth(data.data.user, data.data.accessToken);
      toast.success(`Welcome, ${data.data.user.name}!`);
      navigate('/staff');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl">
        <div className="text-center mb-6">
          <div className="font-display text-2xl font-bold tracking-[0.2em]">MAGIZHCHI</div>
          <p className="text-text-muted text-xs uppercase tracking-[0.4em] mt-1">Staff Portal</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            placeholder="Email or Phone"
            className="input"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            className="input"
          />
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Logging in...' : 'Staff Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
