import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, FileUp, Calendar, Hash, ArrowRight, Camera, Building, User, Save, Trash2, Paperclip } from 'lucide-react';
import { useDocuments } from '../context/DocumentContext';
import { useNavigate, useParams } from 'react-router-dom';
import Modal from '../components/Modal';

const DocumentEntry = () => {
    const { addDocument, updateDocument, documents, getNextOrderNumber, generateNextDocNumber, departments, externalEntities } = useDocuments();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        registrationDate: new Date().toISOString().split('T')[0],
        type: 'Entrada', // 'Entrada', 'Salida', 'Interno'
        docNumber: '',
        docDate: new Date().toISOString().split('T')[0],
        origin: '',
        destination: '',
        summary: '',
        observations: '',
    });

    const [nextOrder, setNextOrder] = useState('...');
    const [attachments, setAttachments] = useState([]); // Array of file objects or metadata

    // Modal states
    const [newEntityModal, setNewEntityModal] = useState({
        isOpen: false,
        field: '',
        isInternal: false,
        name: ''
    });
    const [alertModal, setAlertModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onClose: null
    });

    // Initial setup & Load Data for Edit
    useEffect(() => {
        if (isEditMode) {
            const docToEdit = documents.find(d => d.id === id);
            if (docToEdit) {
                setFormData(docToEdit);
                setNextOrder(docToEdit.id);
                // Load existing attachments. If legacy 'fileName' exists, convert to array
                if (docToEdit.attachments) {
                    setAttachments(docToEdit.attachments);
                } else if (docToEdit.fileName) {
                    setAttachments([{ name: docToEdit.fileName, size: 0, type: 'legacy' }]);
                }
            } else {
                setAlertModal({
                    isOpen: true,
                    title: 'Error',
                    message: 'Documento no encontrado',
                    onClose: () => navigate('/log')
                });
            }
        } else {
            setNextOrder(getNextOrderNumber());
        }
    }, [id, documents, isEditMode, getNextOrderNumber, navigate]);

    // React to Type changes (Only if NOT editing)
    useEffect(() => {
        if (isEditMode) return;

        if (formData.type === 'Salida' || formData.type === 'Interno') {
            const nextNum = generateNextDocNumber(formData.type);
            setFormData(prev => ({ ...prev, docNumber: nextNum }));
        } else {
            setFormData(prev => ({ ...prev, docNumber: '' }));
        }
        // Reset Origin/Dest on type switch to avoid invalid states
        setFormData(prev => ({ ...prev, origin: '', destination: '' }));
    }, [formData.type, generateNextDocNumber, isEditMode]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);

            const newAttachments = await Promise.all(files.map(file => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        resolve({
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            lastModified: file.lastModified,
                            url: reader.result // Store Base64 content
                        });
                    };
                    reader.readAsDataURL(file);
                });
            }));

            setAttachments(prev => [...prev, ...newAttachments]);
        }
    };

    const handleRemoveAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const docData = {
            ...formData,
            status: 'Completado',
            attachments: attachments,
            // Keep legacy fileName for compatibility if needed, or take the first one
            fileName: attachments.length > 0 ? attachments[0].name : null
        };

        if (isEditMode) {
            updateDocument(id, docData);
            setAlertModal({
                isOpen: true,
                title: 'Éxito',
                message: 'Registro actualizado correctamente',
                onClose: () => navigate('/log')
            });
        } else {
            const success = await addDocument(docData);
            if (success) {
                setAlertModal({
                    isOpen: true,
                    title: 'Éxito',
                    message: 'Documento registrado con éxito',
                    onClose: () => navigate('/log')
                });
            }
        }
    };

    // Helper to determine input type (Text vs Select) based on form state
    const { addDepartment, addExternalEntity } = useDocuments();

    const handleAddNewEntity = (field, isInternal) => {
        setNewEntityModal({
            isOpen: true,
            field,
            isInternal,
            name: ''
        });
    };

    const confirmNewEntity = async () => {
        const { field, isInternal, name } = newEntityModal;
        if (name && name.trim()) {
            const success = isInternal
                ? await addDepartment(name.trim())
                : await addExternalEntity(name.trim());

            if (success) {
                setFormData(prev => ({ ...prev, [field]: name.trim() }));
                setNewEntityModal(prev => ({ ...prev, isOpen: false }));
            } else {
                setAlertModal({
                    isOpen: true,
                    title: 'Atención',
                    message: 'Error al añadir. Es posible que el nombre ya exista.'
                });
            }
        }
    };

    const renderEntityInput = (field, label, isInternal) => {
        const options = isInternal ? departments : externalEntities;

        return (
            <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ margin: 0 }}>{label}</label>
                    <button
                        type="button"
                        onClick={() => handleAddNewEntity(field, isInternal)}
                        className="add-inline-btn"
                        title={`Añadir nuevo ${isInternal ? 'departamento' : 'entidad'}`}
                    >
                        + Nuevo
                    </button>
                </div>
                <div className="input-icon">
                    {isInternal ? <Building size={16} /> : <User size={16} />}
                    <select
                        name={field}
                        value={formData[field]}
                        onChange={handleInputChange}
                        required
                        className="custom-select"
                    >
                        <option value="">Seleccione...</option>
                        {options.map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="entry-container"
        >
            <form onSubmit={handleSubmit} className="entry-form">
                <div className="form-header glass mb-4">
                    <div className="header-content">
                        <h2>{isEditMode ? 'Editar Registro' : 'Nuevo Registro'}</h2>
                        <div className="next-number">
                            <span>{isEditMode ? 'Nº Orden:' : 'Siguiente Nº Orden:'}</span>
                            <strong>{nextOrder}</strong>
                        </div>
                    </div>
                </div>

                <div className="form-section glass">
                    <h3>Datos Generales</h3>
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Fecha de Registro</label>
                            <div className="input-icon">
                                <Calendar size={16} />
                                <input
                                    type="date"
                                    name="registrationDate"
                                    value={formData.registrationDate}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Tipo de Flujo</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                                disabled={isEditMode}
                                style={{ opacity: isEditMode ? 0.7 : 1 }}
                            >
                                <option value="Entrada">Entrada (Externo → CNDES)</option>
                                <option value="Salida">Salida (CNDES → Externo)</option>
                                <option value="Interno">Interno (Memorándum)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid-2">
                        <div className="form-group">
                            <label>Nº Documento {formData.type !== 'Entrada' && '(Automático)'}</label>
                            <div className="input-icon">
                                <Hash size={16} />
                                <input
                                    name="docNumber"
                                    value={formData.docNumber}
                                    onChange={handleInputChange}
                                    placeholder={formData.type === 'Entrada' ? "Ej: REF-2026-001" : "Generado autom."}
                                    readOnly={formData.type !== 'Entrada' || isEditMode}
                                    className={(formData.type !== 'Entrada' || isEditMode) ? 'locked-input' : ''}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Fecha del Documento</label>
                            <div className="input-icon">
                                <Calendar size={16} />
                                <input
                                    type="date"
                                    name="docDate"
                                    value={formData.docDate}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid-2">
                        {/* Dynamic Origin/Destination inputs based on flow logic */}
                        {formData.type === 'Entrada' && (
                            <>
                                {renderEntityInput('origin', 'Procedencia (Remitente)', false)}
                                {renderEntityInput('destination', 'Destino (Departamento)', true)}
                            </>
                        )}
                        {formData.type === 'Salida' && (
                            <>
                                {renderEntityInput('origin', 'Procedencia (Departamento)', true)}
                                {renderEntityInput('destination', 'Destino (Receptor)', false)}
                            </>
                        )}
                        {formData.type === 'Interno' && (
                            <>
                                {renderEntityInput('origin', 'De (Departamento)', true)}
                                {renderEntityInput('destination', 'Para (Departamento)', true)}
                            </>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Extracto de Contenido (Resumen)</label>
                        <textarea
                            name="summary"
                            rows="2"
                            value={formData.summary}
                            onChange={handleInputChange}
                            placeholder="Breve descripción del contenido..."
                            required
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label>Observaciones</label>
                        <textarea
                            name="observations"
                            rows="2"
                            value={formData.observations}
                            onChange={handleInputChange}
                            placeholder="Notas adicionales..."
                        ></textarea>
                    </div>
                </div>

                <div className="form-section glass mt-4">
                    <h3>Archivos Adjuntos</h3>

                    {/* Attachments List */}
                    {attachments.length > 0 && (
                        <div className="attachments-list mb-4">
                            {attachments.map((file, index) => (
                                <div key={index} className="attachment-item">
                                    <div className="file-info">
                                        <Paperclip size={16} className="text-secondary" />
                                        <span className="file-name">{file.name}</span>
                                        {file.size > 0 && <span className="file-size">({(file.size / 1024).toFixed(0)} KB)</span>}
                                    </div>
                                    <button
                                        type="button"
                                        className="remove-btn"
                                        onClick={() => handleRemoveAttachment(index)}
                                        title="Eliminar adjunto"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="file-upload">
                        <input
                            type="file"
                            accept=".pdf,image/*"
                            id="file-input"
                            capture="environment" // Trigger camera on mobile
                            onChange={handleFileChange}
                            hidden
                            multiple // Allow selecting multiple files
                        />
                        <label htmlFor="file-input" className="file-label">
                            <div className="upload-placeholder">
                                <Camera size={32} />
                                <span>{isEditMode ? 'Añadir más archivos' : 'Escanear o subir archivos'}</span>
                                <small className="text-muted">PDF o Imágenes (Cámara)</small>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="form-actions mt-4">
                    <button type="submit" className="submit-btn" disabled={!formData.origin || !formData.destination}>
                        {isEditMode ? 'Actualizar Registro' : 'Guardar Registro'} <Save size={18} />
                    </button>
                </div>
            </form>

            {/* Modal para Añadir Entidad */}
            <Modal
                isOpen={newEntityModal.isOpen}
                onClose={() => setNewEntityModal(prev => ({ ...prev, isOpen: false }))}
                title={`Añadir ${newEntityModal.isInternal ? 'Departamento' : 'Entidad Externa'}`}
                type="prompt"
                footer={(
                    <>
                        <button
                            className="btn-modal-cancel"
                            onClick={() => setNewEntityModal(prev => ({ ...prev, isOpen: false }))}
                        >
                            Cancelar
                        </button>
                        <button
                            className="btn-modal-confirm"
                            onClick={confirmNewEntity}
                            disabled={!newEntityModal.name.trim()}
                        >
                            Añadir
                        </button>
                    </>
                )}
            >
                <div className="modal-prompt-body">
                    <label>Nombre del nuevo {newEntityModal.isInternal ? 'departamento' : 'lugar'}:</label>
                    <input
                        type="text"
                        value={newEntityModal.name}
                        onChange={(e) => setNewEntityModal(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Escriba el nombre..."
                        autoFocus
                    />
                </div>
            </Modal>

            {/* Modal de Alerta/Éxito */}
            <Modal
                isOpen={alertModal.isOpen}
                onClose={() => {
                    if (alertModal.onClose) alertModal.onClose();
                    setAlertModal(prev => ({ ...prev, isOpen: false }));
                }}
                title={alertModal.title}
                type="alert"
                footer={(
                    <button
                        className="btn-modal-confirm"
                        onClick={() => {
                            if (alertModal.onClose) alertModal.onClose();
                            setAlertModal(prev => ({ ...prev, isOpen: false }));
                        }}
                    >
                        Aceptar
                    </button>
                )}
            >
                <p>{alertModal.message}</p>
            </Modal>

            <style jsx>{`
        .entry-container { max-width: 800px; margin: 0 auto; }
        .form-header { padding: 20px 24px; background: white; border-radius: 12px; margin-bottom: 24px; }
        .header-content { display: flex; justify-content: space-between; align-items: center; }
        .header-content h2 { margin: 0; color: var(--color-primary); font-size: 1.5rem; }
        .next-number { background: #f1f5f9; padding: 8px 16px; border-radius: 8px; display: flex; gap: 8px; align-items: center; font-size: 0.9rem; }
        .next-number strong { color: var(--color-primary); font-size: 1.1rem; }
        .form-section { padding: 32px; border-radius: 12px; background: white; box-shadow: var(--shadow-sm); }
        h3 { font-size: 1.1rem; margin-bottom: 24px; color: var(--color-text); border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 20px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; color: var(--color-text-light); }
        .input-icon { position: relative; display: flex; align-items: center; }
        .input-icon svg { position: absolute; left: 12px; color: #94a3b8; z-index: 10; }
        input, select, textarea { width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.95rem; transition: all 0.2s; background: white; }
        .input-icon input, .input-icon select { padding-left: 36px; }
        input:focus, select:focus, textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1); outline: none; }
        .locked-input { background-color: #f1f5f9; color: #64748b; cursor: not-allowed; font-family: monospace; font-weight: 600; }
        
        .file-upload { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 32px; text-align: center; transition: var(--transition-fast); background: #f8fafc; cursor: pointer; }
        .file-upload:hover { border-color: var(--color-secondary); background: #f0fdf4; }
        .file-label { cursor: pointer; width: 100%; }
        .upload-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--color-text-light); }
        
        .attachments-list { display: flex; flex-direction: column; gap: 8px; }
        .attachment-item { display: flex; justify-content: space-between; align-items: center; background: #eff6ff; padding: 12px; border-radius: 8px; border: 1px solid #bfdbfe; }
        .file-info { display: flex; align-items: center; gap: 10px; overflow: hidden; }
        .file-name { font-weight: 600; color: #1e40af; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .file-size { color: #60a5fa; font-size: 0.8rem; }
        .remove-btn { background: none; border: none; cursor: pointer; color: #ef4444; padding: 4px; border-radius: 4px; display: flex; align-items: center; }
        .remove-btn:hover { background: #fee2e2; }

        .submit-btn { width: 100%; padding: 16px; background: var(--color-primary); color: white; border-radius: 10px; font-weight: 700; font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 12px; cursor: pointer; transition: transform 0.1s; border: none; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); background: #047857; }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        
        .mt-4 { margin-top: 24px; }
        .mb-4 { margin-bottom: 24px; }
        .add-inline-btn { background: none; border: none; color: var(--color-primary); font-size: 0.75rem; font-weight: 700; cursor: pointer; padding: 2px 8px; border-radius: 4px; border: 1px solid var(--color-primary); transition: all 0.2s; }
        .add-inline-btn:hover { background: var(--color-primary); color: white; }

        /* Modal specific buttons */
        .btn-modal-confirm { padding: 8px 20px; background: var(--color-primary); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .btn-modal-cancel { padding: 8px 20px; background: white; border: 1px solid #e2e8f0; color: #64748b; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .btn-modal-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
        .modal-prompt-body { display: flex; flex-direction: column; gap: 12px; }
        .modal-prompt-body label { font-size: 0.85rem; font-weight: 600; color: #64748b; }

        .text-success { color: var(--color-secondary); }
        .text-secondary { color: #3b82f6; }
        .text-muted { color: #94a3b8; font-size: 0.8rem; }
        @media (max-width: 600px) { .grid-2 { grid-template-columns: 1fr; } }
      `}</style>
        </motion.div>
    );
};

export default DocumentEntry;
