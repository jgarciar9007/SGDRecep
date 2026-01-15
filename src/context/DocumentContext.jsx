import React, { createContext, useContext, useState, useEffect } from 'react';

const DocumentContext = createContext();

export const useDocuments = () => {
    const context = useContext(DocumentContext);
    if (!context) {
        throw new Error('useDocuments must be used within a DocumentProvider');
    }
    return context;
};

// Master Data Catalogs
export const DEPARTMENTS = [
    'Presidencia CNDES',
    'Secretaría General',
    'Gabinete Técnico',
    'Administración y Finanzas',
    'Recursos Humanos',
    'Comunicación y Relaciones Públicas',
    'Informática y Tecnología',
    'Planificación Estratégica',
    'Cooperación Internacional',
    'Archivo y Documentación'
];

export const EXTERNAL_ENTITIES = [
    'Presidencia de la República',
    'Ministerio de Hacienda',
    'Ministerio de Asuntos Exteriores',
    'Banco Mundial',
    'FMI',
    'PNUD',
    'Embajadas',
    'GE Proyectos',
    'Empresas Privadas',
    'Particulares'
];

export const DocumentProvider = ({ children }) => {
    // Documents State
    const [documents, setDocuments] = useState([]);

    // Counters State for Auto-Numbering (We'll still fetch this or just compute from docs)
    // For simplicity, we will computer counters from the loaded documents to avoid a separate table for now,
    // or just maintain local state that refreshes on load.
    const [counters, setCounters] = useState({
        salida: 0,
        interno: 0,
        year: new Date().getFullYear()
    });

    const API_URL = '/api/documents';

    // Load Documents from API
    const fetchDocuments = async () => {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Failed to fetch');
            const result = await response.json();
            const docs = result.data;
            setDocuments(docs);

            // Recalculate counters based on fetched docs
            const currentYear = new Date().getFullYear();
            let maxSalida = 0;
            let maxInterno = 0;

            docs.forEach(doc => {
                // Parse docNumber "CNDES/SAL/2026/001"
                if (doc.type === 'Salida' && doc.docNumber) {
                    const parts = doc.docNumber.split('/');
                    if (parts.length === 4 && parseInt(parts[2]) === currentYear) {
                        const num = parseInt(parts[3]);
                        if (num > maxSalida) maxSalida = num;
                    }
                }
                if (doc.type === 'Interno' && doc.docNumber) {
                    const parts = doc.docNumber.split('/');
                    if (parts.length === 4 && parseInt(parts[2]) === currentYear) {
                        const num = parseInt(parts[3]);
                        if (num > maxInterno) maxInterno = num;
                    }
                }
            });

            setCounters({
                salida: maxSalida,
                interno: maxInterno,
                year: currentYear
            });

        } catch (error) {
            console.error("Error loading documents:", error);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const generateNextDocNumber = (type) => {
        const year = new Date().getFullYear();
        if (type === 'Salida') {
            const next = counters.salida + 1;
            return `CNDES/SAL/${year}/${String(next).padStart(3, '0')}`;
        } else if (type === 'Interno') {
            const next = counters.interno + 1;
            return `CNDES/INT/${year}/${String(next).padStart(3, '0')}`;
        }
        return '';
    };

    const addDocument = async (doc) => {
        const newDoc = {
            ...doc,
            id: doc.id || String(documents.length + 1).padStart(3, '0')
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newDoc)
            });

            if (response.ok) {
                // Optimistic update or refetch
                await fetchDocuments();
            } else {
                console.error("Failed to save document");
                alert("Error al guardar en base de datos local");
            }
        } catch (error) {
            console.error("Error saving document:", error);
            alert("Error de conexión con la base de datos");
        }
    };

    const deleteDocument = async (id) => {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setDocuments(prev => prev.filter(doc => doc.id !== id));
            }
        } catch (err) {
            console.error("Error deleting:", err);
        }
    };

    const updateDocument = async (id, updatedFields) => {
        // We need merge with existing because PUT usually expects full or we handle partial in backend
        // Our backend handles partial update for known fields but good to send full
        const oldDoc = documents.find(d => d.id === id);
        const merged = { ...oldDoc, ...updatedFields };

        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(merged)
            });
            if (response.ok) {
                await fetchDocuments();
            }
        } catch (err) {
            console.error("Error updating:", err);
        }
    };

    const getNextOrderNumber = () => {
        return String(documents.length + 1).padStart(3, '0');
    };

    return (
        <DocumentContext.Provider value={{
            documents,
            addDocument,
            deleteDocument,
            updateDocument,
            getNextOrderNumber,
            generateNextDocNumber,
            departments: DEPARTMENTS,
            externalEntities: EXTERNAL_ENTITIES
        }}>
            {children}
        </DocumentContext.Provider>
    );
};
