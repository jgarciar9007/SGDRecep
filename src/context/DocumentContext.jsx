import React, { createContext, useContext, useState, useEffect } from 'react';

const DocumentContext = createContext();

export const useDocuments = () => {
    const context = useContext(DocumentContext);
    if (!context) {
        throw new Error('useDocuments must be used within a DocumentProvider');
    }
    return context;
};

export const DocumentProvider = ({ children }) => {
    // Documents State
    const [documents, setDocuments] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [externalEntities, setExternalEntities] = useState([]);

    // Counters State for Auto-Numbering
    const [counters, setCounters] = useState({
        salida: 0,
        interno: 0,
        year: new Date().getFullYear()
    });

    const API_URL = '/api/documents';

    // Load Entities
    const fetchEntities = async () => {
        try {
            const [deptsRes, extRes] = await Promise.all([
                fetch('/api/departments'),
                fetch('/api/external-entities')
            ]);
            const deptsData = await deptsRes.json();
            const extData = await extRes.json();

            if (deptsData.message === 'success') setDepartments(deptsData.data);
            if (extData.message === 'success') setExternalEntities(extData.data);
        } catch (error) {
            console.error("Error loading entities:", error);
        }
    };

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
        fetchEntities();
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

    const addDepartment = async (name) => {
        try {
            const response = await fetch('/api/departments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            if (response.ok) {
                await fetchEntities();
                return true;
            }
        } catch (error) {
            console.error("Error adding department:", error);
        }
        return false;
    };

    const addExternalEntity = async (name) => {
        try {
            const response = await fetch('/api/external-entities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            if (response.ok) {
                await fetchEntities();
                return true;
            }
        } catch (error) {
            console.error("Error adding external entity:", error);
        }
        return false;
    };

    const addDocument = async (doc) => {
        let newId = doc.id;
        if (!newId) {
            const maxId = documents.reduce((max, d) => {
                const num = parseInt(d.id, 10);
                return !isNaN(num) && num > max ? num : max;
            }, 0);
            newId = String(maxId + 1).padStart(3, '0');
        }

        const newDoc = {
            ...doc,
            id: newId
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
                return true;
            } else {
                console.error("Failed to save document");
                alert("Error al guardar en base de datos local");
                return false;
            }
        } catch (error) {
            console.error("Error saving document:", error);
            alert("Error de conexión con la base de datos");
            return false;
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
            departments,
            externalEntities,
            addDepartment,
            addExternalEntity
        }}>
            {children}
        </DocumentContext.Provider>
    );
};
