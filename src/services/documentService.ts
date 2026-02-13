export type DocumentStatus = 'PENDING' | 'VIEWED' | 'ACKNOWLEDGED' | 'SIGNED';

export interface Document {
    id: string;
    title: string;
    file_path: string;
    requires_signature: boolean;
    hash: string;
    created_at: string;
}

export interface DocumentAcknowledgement {
    id: string;
    document_id: string;
    teacher_id: string;
    status: DocumentStatus;
    viewed_at?: string;
    acknowledged_at?: string;
    ip_address?: string;
    document_hash?: string;
    created_at: string;
    document?: Document;
}

// Mock data for development
const mockDocuments: Document[] = [
    {
        id: "1",
        title: "Code of Conduct 2025",
        file_path: "documents/code-of-conduct.pdf",
        requires_signature: true,
        hash: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
        created_at: "2025-01-15T10:00:00Z",
    },
    {
        id: "2",
        title: "Safety Guidelines",
        file_path: "documents/safety-guidelines.pdf",
        requires_signature: false,
        hash: "b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1",
        created_at: "2025-01-10T09:00:00Z",
    },
    {
        id: "3",
        title: "Data Privacy Policy",
        file_path: "documents/data-privacy.pdf",
        requires_signature: true,
        hash: "c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2",
        created_at: "2024-12-20T08:00:00Z",
    },
    {
        id: "4",
        title: "Professional Development Guidelines",
        file_path: "documents/pd-guidelines.pdf",
        requires_signature: false,
        hash: "d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3",
        created_at: "2025-02-01T11:00:00Z",
    },
];

let mockAcknowledgements: DocumentAcknowledgement[] = [
    {
        id: "ack1",
        document_id: "1",
        teacher_id: "1",
        status: "PENDING",
        created_at: "2025-01-16T10:00:00Z",
        document: mockDocuments[0],
    },
    {
        id: "ack2",
        document_id: "2",
        teacher_id: "1",
        status: "ACKNOWLEDGED",
        viewed_at: "2025-01-12T10:30:00Z",
        acknowledged_at: "2025-01-12T10:35:00Z",
        ip_address: "192.168.1.100",
        document_hash: mockDocuments[1].hash,
        created_at: "2025-01-11T09:00:00Z",
        document: mockDocuments[1],
    },
    {
        id: "ack3",
        document_id: "3",
        teacher_id: "1",
        status: "SIGNED",
        viewed_at: "2024-12-22T09:15:00Z",
        acknowledged_at: "2024-12-22T09:20:00Z",
        ip_address: "192.168.1.100",
        document_hash: mockDocuments[2].hash,
        created_at: "2024-12-21T08:00:00Z",
        document: mockDocuments[2],
    },
    {
        id: "ack4",
        document_id: "4",
        teacher_id: "1",
        status: "VIEWED",
        viewed_at: "2025-02-02T11:15:00Z",
        created_at: "2025-02-02T11:00:00Z",
        document: mockDocuments[3],
    },
];

export const documentService = {
    async getTeacherAcknowledgements(teacherId: string) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Return mock data filtered by teacher ID
        return mockAcknowledgements.filter(ack => ack.teacher_id === teacherId);
    },

    async markAsViewed(acknowledgementId: string) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));

        // Update mock data
        const ack = mockAcknowledgements.find(a => a.id === acknowledgementId);
        if (ack && ack.status === 'PENDING') {
            ack.status = 'VIEWED';
            ack.viewed_at = new Date().toISOString();
        }
    },

    async acknowledgeDocument(acknowledgementId: string, documentHash: string) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Get IP address
        let ipAddress = 'unknown';
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            ipAddress = data.ip;
        } catch (e) {
            console.warn("Could not fetch IP address", e);
            ipAddress = '127.0.0.1'; // Fallback
        }

        // Update mock data
        const ack = mockAcknowledgements.find(a => a.id === acknowledgementId);
        if (ack) {
            ack.status = 'ACKNOWLEDGED';
            ack.acknowledged_at = new Date().toISOString();
            ack.ip_address = ipAddress;
            ack.document_hash = documentHash;
        }
    },

    async getDocumentPublicUrl(filePath: string) {
        // Return a placeholder PDF URL for demo
        // In production, this would return the actual file URL
        return "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
    }
};
