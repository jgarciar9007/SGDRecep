import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, Lock, User, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(username, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="login-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="login-card glass"
      >
        <div className="login-header">
          <div className="logo-container-img">
            <img src={logo} alt="CNDES Logo" className="brand-logo" />
          </div>
          <h2>Gestión Documental</h2>
          <p>Bienvenido al Sistema de Registro</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label><User size={18} /> Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej: admin"
              required
            />
          </div>

          <div className="input-group">
            <label><Lock size={18} /> Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="error-message"
            >
              <AlertCircle size={16} /> {error}
            </motion.div>
          )}

          <button type="submit" className="login-btn">
            Entrar <LogIn size={18} />
          </button>
        </form>
      </motion.div>

      <style jsx>{`
        .login-container {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--color-primary) 0%, #001a33 100%);
          padding: 20px;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          padding: 40px;
          border-radius: 16px;
          box-shadow: var(--shadow-lg);
          color: #000;
          background: rgba(255, 255, 255, 0.95);
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .brand-logo {
          max-width: 180px;
          height: auto;
          margin-bottom: 16px;
        }

        h2 {
          font-size: 1.5rem;
          margin-bottom: 4px;
          color: var(--color-primary);
        }

        .login-header p {
          color: var(--color-text-light);
          font-size: 0.9rem;
          font-weight: 500;
        }

        .input-group {
          margin-bottom: 20px;
        }

        .input-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          margin-bottom: 8px;
          color: var(--color-text);
          font-weight: 600;
        }

        .input-group input {
          background: #fff;
          border: 1px solid #cbd5e1;
          color: var(--color-text);
          padding: 12px 16px;
        }

        .login-btn {
          width: 100%;
          padding: 14px;
          background: var(--color-secondary);
          color: white;
          border-radius: 8px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 10px;
        }

        .login-btn:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--color-error);
          font-size: 0.85rem;
          margin-bottom: 16px;
          padding: 10px;
          background: rgba(190, 18, 60, 0.1);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
