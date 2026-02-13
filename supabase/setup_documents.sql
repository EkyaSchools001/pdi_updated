-- 1. Create Documents Table
CREATE TABLE public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Path in Supabase storage
    requires_signature BOOLEAN DEFAULT FALSE,
    hash TEXT, -- SHA256 hash of the file
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Document Acknowledgements Table
CREATE TABLE public.document_acknowledgements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VIEWED', 'ACKNOWLEDGED', 'SIGNED')),
    viewed_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    document_hash TEXT, -- Snapshot hash at time of acknowledgement
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(document_id, teacher_id)
);

-- 3. Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_acknowledgements ENABLE ROW LEVEL SECURITY;

-- 4. Policies for documents
-- Admins can do everything
CREATE POLICY "Admins have full access to documents" ON public.documents
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Teachers can view documents assigned to them (via acknowledgements)
CREATE POLICY "Teachers can view assigned documents" ON public.documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.document_acknowledgements
            WHERE document_id = public.documents.id
            AND teacher_id = auth.uid()
        )
    );

-- 5. Policies for acknowledgements
-- Admins can do everything
CREATE POLICY "Admins have full access to acknowledgements" ON public.document_acknowledgements
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Teachers can view and update their own acknowledgements
CREATE POLICY "Teachers can manage their own acknowledgements" ON public.document_acknowledgements
    FOR ALL USING (teacher_id = auth.uid());

-- 6. Storage Bucket Setup (Instructions for Supabase UI)
-- Create a bucket named 'documents' in the Storage tab of Supabase.
-- Add policies to the storage bucket:
--   a. Give 'authenticated' users SELECT access to files in the 'documents' bucket.
--   b. Give 'service_role' or 'admin' users full access.
