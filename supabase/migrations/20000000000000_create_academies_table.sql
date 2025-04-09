-- Create academies table
CREATE TABLE IF NOT EXISTS public.academies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_name VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    street VARCHAR(255) NOT NULL,
    neighborhood VARCHAR(255) NOT NULL,
    zip_code VARCHAR(9) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.academies ENABLE ROW LEVEL SECURITY;

-- Policy para permitir acesso somente a administradores
CREATE POLICY "Admins can do anything" ON public.academies
    USING (auth.uid() IN (
        SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    ))
    WITH CHECK (auth.uid() IN (
        SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    ));

-- Policy para permitir que donos de academia vejam apenas sua própria academia
CREATE POLICY "Academy owners can view their own academy" ON public.academies
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy para permitir que usuários autenticados insiram academias
CREATE POLICY "Authenticated users can insert academies" ON public.academies
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Criar índices para melhorar desempenho
CREATE INDEX IF NOT EXISTS academies_user_id_idx ON public.academies(user_id);
CREATE INDEX IF NOT EXISTS academies_created_by_idx ON public.academies(created_by);
CREATE INDEX IF NOT EXISTS academies_cnpj_idx ON public.academies(cnpj);
CREATE INDEX IF NOT EXISTS academies_email_idx ON public.academies(email);

-- Triggers para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW; 
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_academies_modtime 
BEFORE UPDATE ON public.academies 
FOR EACH ROW 
EXECUTE PROCEDURE update_modified_column(); 