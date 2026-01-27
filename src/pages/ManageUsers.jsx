import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Key, Shield, Check, X, Search } from 'lucide-react';
import Modal from '../components/Modal';

const ManageUsers = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [selectedUser, setSelectedUser] = useState(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/users');
                const data = await response.json();
                if (response.ok) {
                    setUsers(data.data);
                } else {
                    console.error("Error fetching users:", data.error);
                }
            } catch (error) {
                console.error("Error connecting to server:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleOpenPasswordModal = (user) => {
        setSelectedUser(user);
        setNewPassword('');
        setMessage({ type: '', text: '' });
        setIsPasswordModalOpen(true);
    };

    const handleUpdatePassword = async () => {
        if (!newPassword.trim()) {
            setMessage({ type: 'error', text: 'La contraseña no puede estar vacía.' });
            return;
        }

        try {
            const response = await fetch(`/api/users/${selectedUser.username}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Contraseña actualizada correctamente.' });
                setTimeout(() => {
                    setIsPasswordModalOpen(false);
                    setMessage({ type: '', text: '' });
                }, 1500);
            } else {
                setMessage({ type: 'error', text: data.error || 'Error al actualizar.' });
            }
        } catch (error) {
            console.error(error); // Log it or use 'error' in state if needed
            setMessage({ type: 'error', text: 'Error de conexión.' });
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!user || user.role !== 'Admin') {
        return (
            <div className="access-denied">
                <Shield size={64} className="text-red-500 mb-4" />
                <h2>Acceso Denegado</h2>
                <p>Solo los administradores pueden acceder a esta sección.</p>
            </div>
        );
    }

    return (
        <div className="manage-users-page animate-fade-in">
            <div className="actions-bar glass">
                <div className="search-box">
                    <Search size={20} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar usuarios..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="stats">
                    <span className="badge">{users.length} Usuarios</span>
                </div>
            </div>

            <div className="users-grid">
                {loading ? (
                    <div className="loading">Cargando usuarios...</div>
                ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                        <div key={u.username} className="user-card glass">
                            <div className="user-header">
                                <div className="user-avatar-placeholder">
                                    <User size={24} />
                                </div>
                                <div className="user-info-card">
                                    <h3>{u.name}</h3>
                                    <span className="user-role">{u.role}</span>
                                    <span className="user-username">@{u.username}</span>
                                </div>
                            </div>
                            <div className="user-actions">
                                <button
                                    onClick={() => handleOpenPasswordModal(u)}
                                    className="action-btn"
                                >
                                    <Key size={16} /> Cambiar Contraseña
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-results">
                        <User size={48} className="text-gray-300 mb-2" />
                        <p>No se encontraron usuarios.</p>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                title={`Cambiar Contraseña: ${selectedUser?.username}`}
                type="prompt"
                footer={
                    <>
                        <button onClick={() => setIsPasswordModalOpen(false)} className="btn-secondary">
                            Cancelar
                        </button>
                        <button onClick={handleUpdatePassword} className="btn-primary">
                            <Check size={18} /> Guardar
                        </button>
                    </>
                }
            >
                <div className="password-form">
                    <p className="mb-4 text-sm text-gray-500">
                        Ingrese la nueva contraseña para el usuario <strong>{selectedUser?.name}</strong>.
                    </p>
                    <div className="form-group">
                        <label>Nueva Contraseña</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Ingrese nueva contraseña"
                            autoFocus
                        />
                    </div>

                    {message.text && (
                        <div className={`message ${message.type}`}>
                            {message.type === 'error' ? <X size={16} /> : <Check size={16} />}
                            {message.text}
                        </div>
                    )}
                </div>
            </Modal>

            <style jsx>{`
                .manage-users-page {
                    max-width: 1200px;
                    margin: 0 auto;
                }
                
                .actions-bar {
                    margin-bottom: 24px;
                    padding: 16px 24px;
                    border-radius: 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: white;
                }

                .search-box {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: #f1f5f9;
                    padding: 10px 16px;
                    border-radius: 8px;
                    width: 300px;
                }

                .search-box input {
                    border: none;
                    background: transparent;
                    outline: none;
                    width: 100%;
                    font-size: 0.95rem;
                }

                .badge {
                    background: var(--color-primary-light, #e0e7ff);
                    color: var(--color-primary, #4f46e5);
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 600;
                }

                .users-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 24px;
                }

                .user-card {
                    background: white;
                    border-radius: 16px;
                    padding: 24px;
                    transition: all 0.2s;
                    border: 1px solid rgba(255,255,255,0.5);
                }

                .user-card:hover {
                    box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1);
                    transform: translateY(-2px);
                }

                .user-header {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 20px;
                }

                .user-avatar-placeholder {
                    width: 50px;
                    height: 50px;
                    background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
                    color: white;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
                }

                .user-info-card h3 {
                    margin: 0 0 4px 0;
                    font-size: 1.1rem;
                    color: #1e293b;
                }

                .user-role {
                    display: inline-block;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-weight: 700;
                    color: #64748b;
                    background: #f1f5f9;
                    padding: 2px 8px;
                    border-radius: 4px;
                    margin-right: 8px;
                }

                .user-username {
                    font-size: 0.85rem;
                    color: #94a3b8;
                }

                .user-actions {
                    border-top: 1px solid #f1f5f9;
                    padding-top: 16px;
                    display: flex;
                    justify-content: flex-end;
                }

                .action-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    color: #475569;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                }

                .action-btn:hover {
                    background: white;
                    border-color: #cbd5e1;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                    color: #1e293b;
                }

                .form-group {
                    margin-bottom: 16px;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    color: #334155;
                }

                .form-group input {
                    width: 100%;
                    padding: 10px 14px;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: all 0.2s;
                }

                .form-group input:focus {
                    outline: none;
                    border-color: #6366f1;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
                }

                .btn-secondary, .btn-primary {
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                }

                .btn-secondary {
                    background: white;
                    border: 1px solid #e2e8f0;
                    color: #64748b;
                }

                .btn-secondary:hover {
                    background: #f8fafc;
                    color: #1e293b;
                }

                .btn-primary {
                    background: #4f46e5;
                    border: none;
                    color: white;
                }

                .btn-primary:hover {
                    background: #4338ca;
                    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
                }

                .message {
                    padding: 10px;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 10px;
                }

                .message.error {
                    background: #fef2f2;
                    color: #ef4444;
                    border: 1px solid #fee2e2;
                }

                .message.success {
                    background: #f0fdf4;
                    color: #16a34a;
                    border: 1px solid #dcfce7;
                }

                .access-denied {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 50vh;
                    text-align: center;
                }

                .access-denied h2 {
                    font-size: 1.5rem;
                    margin-bottom: 8px;
                    color: #1e293b;
                }

                .access-denied p {
                    color: #64748b;
                }
            `}</style>
        </div>
    );
};

export default ManageUsers;
