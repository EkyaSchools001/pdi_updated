import api from '@/lib/api';

export type DocumentStatus = 'PENDING' | 'VIEWED' | 'ACKNOWLEDGED' | 'SIGNED';

export interface Document {
    id: string;
    title: string;
    description?: string;
    fileUrl: string; // Changed from file_path to match DB
    fileName: string;
    fileSize: number;
    requiresSignature: boolean; // Changed from requires_signature
    version: string;
    hash?: string;
    createdAt: string; // Changed from created_at
    createdBy?: { fullName: string };
    assignedTo?: number; // Count for UI
    acknowledged?: number; // Count for UI
    pending?: number; // Count for UI
    status?: string; // 'Active' | 'Draft'
}

export interface DocumentAcknowledgement {
    id: string;
    documentId: string; // Changed from document_id
    teacherId: string; // Changed from teacher_id
    status: DocumentStatus;
    viewedAt?: string; // Changed from viewed_at
    acknowledgedAt?: string; // Changed from acknowledged_at
    ipAddress?: string; // Changed from ip_address
    documentHash?: string; // Changed from document_hash
    createdAt: string; // Changed from created_at
    document?: Document;
    teacher?: { fullName: string; email: string };
}

export const documentService = {
    // Admin: Get all documents
    async getAllDocuments() {
        try {
            const response = await api.get('/documents');
            const docs = response.data.data.documents;

            // Transform data to match UI expectations if needed
            // The backend returns documents with included acknowledgements
            // We can calculate stats here
            return docs.map((doc: any) => ({
                ...doc,
                assignedTo: doc.acknowledgements ? doc.acknowledgements.length : 0,
                acknowledged: doc.acknowledgements ? doc.acknowledgements.filter((a: any) => a.status === 'ACKNOWLEDGED' || a.status === 'SIGNED').length : 0,
                pending: doc.acknowledgements ? doc.acknowledgements.filter((a: any) => a.status === 'PENDING' || a.status === 'VIEWED').length : 0,
                status: 'Active' // Default to Active since we don't have drafting yet
            }));
        } catch (error) {
            console.error('Error fetching documents:', error);
            throw error;
        }
    },

    // Admin: Upload document
    // NOTE: This now handles the file upload as well
    async uploadDocument(data: {
        title: string;
        description: string;
        version: string;
        requiresSignature: boolean;
        file: File;
    }) {
        try {
            // 1. Upload the file first
            const formData = new FormData();
            formData.append('file', data.file);

            const uploadResponse = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const { fileUrl, fileName, fileSize } = uploadResponse.data.data;

            // 2. Create document record
            const docData = {
                title: data.title,
                description: data.description,
                version: data.version,
                requiresSignature: data.requiresSignature,
                fileUrl: fileUrl,
                fileName: fileName,
                fileSize: fileSize
            };

            const response = await api.post('/documents/upload', docData);
            return response.data.data.document;
        } catch (error) {
            console.error('Error uploading document:', error);
            throw error;
        }
    },

    // Admin: Assign document
    async assignDocument(documentId: string, teacherIds: string[]) {
        try {
            const response = await api.post('/documents/assign', {
                documentId,
                teacherIds
            });
            return response.data;
        } catch (error) {
            console.error('Error assigning document:', error);
            throw error;
        }
    },

    // Admin: Delete document
    async deleteDocument(id: string) {
        try {
            await api.delete(`/documents/${id}`);
        } catch (error) {
            console.error('Error deleting document:', error);
            throw error;
        }
    },

    // Admin: Get all acknowledgements (tracking)
    // Currently backend doesn't have a specific route for this, but we can aggregate from getAllDocuments
    // Or add a new route. For now, we'll derive it in the component or fetch if needed.

    // Teacher: Get assigned documents
    async getTeacherAcknowledgements(teacherId: string) {
        try {
            const response = await api.get('/documents/teacher/acknowledgements');
            return response.data.data.acknowledgements;
        } catch (error) {
            console.error('Error fetching teacher acknowledgements:', error);
            throw error;
        }
    },

    // Teacher: Mark as viewed
    async markAsViewed(acknowledgementId: string) {
        try {
            await api.post(`/documents/acknowledgements/${acknowledgementId}/view`);
        } catch (error) {
            console.error('Error marking as viewed:', error);
            throw error;
        }
    },

    // Teacher: Acknowledge
    async acknowledgeDocument(acknowledgementId: string, documentHash: string) {
        try {
            await api.post(`/documents/acknowledgements/${acknowledgementId}/acknowledge`, {
                hash: documentHash
            });
        } catch (error) {
            console.error('Error acknowledging document:', error);
            throw error;
        }
    },

    async getDocumentPublicUrl(filePath: string) {
        // If it's a full URL, return it
        if (filePath.startsWith('http')) return filePath;

        // If it's a relative path starting with /uploads, prepend API URL base (or just server base)
        // Since api.ts handles base URL for API calls, we need the base URL for static files.
        // Assuming uploads are served from the same host as API
        const apiBase = api.defaults.baseURL || '';
        // Remove /api/v1 if present to get root
        const rootBase = apiBase.replace('/api/v1', '');

        return `${rootBase}${filePath}`;
    }
};
