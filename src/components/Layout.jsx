import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FilePlus,
  LogOut,
  Settings,
  FileText,
  User,
  Users
} from 'lucide-react';
import logo from '../assets/logo.png';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src={logo} alt="CNDES Logo" className="sidebar-logo" />
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => currentIndex(isActive)}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>

          <NavLink to="/entry" className={({ isActive }) => currentIndex(isActive)}>
            <FilePlus size={20} /> Nuevo Registro
          </NavLink>

          <NavLink to="/log" className={({ isActive }) => currentIndex(isActive)}>
            <FileText size={20} /> Log de Documentos
          </NavLink>

          {user?.role === 'Admin' && (
            <NavLink to="/users" className={({ isActive }) => currentIndex(isActive)}>
              <Users size={20} /> Usuarios
            </NavLink>
          )}


        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <User size={18} />
            <div className="user-details">
              <span>{user?.name}</span>
              <small>{user?.role}</small>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} /> Salir
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="content-header glass">
          <h1>{getContentTitle()}</h1>
        </header>
        <div className="content-body">
          {children}
        </div>
      </main>

      <style jsx>{`
        .layout {
          display: flex;
          height: 100vh;
          background: var(--color-bg);
        }

        .sidebar {
          width: var(--sidebar-width);
          background: #fff;
          color: var(--color-text);
          display: flex;
          flex-direction: column;
          padding: 24px;
          border-right: 1px solid #e2e8f0;
        }

        .sidebar-header {
          margin-bottom: 40px;
          text-align: center;
        }

        .sidebar-logo {
          max-width: 100%;
          height: auto;
          margin-bottom: 8px;
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sidebar-nav a {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          color: var(--color-text-light);
          text-decoration: none;
          border-radius: 8px;
          transition: var(--transition-fast);
          font-weight: 500;
        }

        .sidebar-nav a:hover {
          background: #f1f5f9;
          color: var(--color-primary);
        }

        .sidebar-nav a.active {
          background: var(--color-primary);
          color: white;
          box-shadow: var(--shadow-sm);
        }

        .sidebar-footer {
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          color: var(--color-text);
        }

        .user-details {
          display: flex;
          flex-direction: column;
        }

        .user-details span {
          font-size: 0.9rem;
          font-weight: 700;
        }

        .user-details small {
          font-size: 0.75rem;
          color: var(--color-text-light);
        }

        .logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px;
          background: #f1f5f9;
          color: var(--color-text);
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .logout-btn:hover {
          background: var(--color-error);
          color: white;
        }

        .main-content {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .content-header {
          height: var(--header-height);
          padding: 0 32px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid #e2e8f0;
          background: white;
        }

        .content-header h1 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--color-text);
        }

        .content-body {
          padding: 32px;
          flex: 1;
        }
      `}</style>
    </div>
  );

  function currentIndex(isActive) {
    return isActive ? 'active' : '';
  }

  function getContentTitle() {
    const path = window.location.pathname;
    if (path === '/') return 'Resumen General';
    if (path === '/entry') return 'Nuevo Registro de Documento';
    if (path === '/log') return 'Seguimiento de Documentos';
    if (path === '/users') return 'Gestión de Usuarios';
    return 'Sistema CNDES';
  }
};

export default Layout;
