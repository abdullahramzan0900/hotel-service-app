import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gem, LogIn } from 'lucide-react';
import { login } from '../api/client';
import { useAuth } from '../context/AuthContext';
import '../styles/login.scss';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(username, password);
      signIn(data.token, data.user);
      navigate('/admin');
    } catch (err) {
      setError(err?.response?.data?.error || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card card" onSubmit={handleSubmit}>
        <div className="login-brand"><Gem size={32} /></div>
        <h1>Grand Sapphire Hotel</h1>
        <p className="muted">Staff Dashboard Login</p>

        <div className="field">
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error && <div className="login-error">{error}</div>}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? <span className="spinner" /> : <><LogIn size={16} /> Sign In</>}
        </button>
      </form>
    </div>
  );
}
