/*
  # Create simulacoes table for Casa Programada

  1. New Tables
    - `simulacoes`
      - `id` (uuid, primary key)
      - Client data fields (nome, email, whatsapp, etc.)
      - Property data fields (tipo_imovel, valor_imovel, etc.)
      - Financing calculation results
      - Consortium calculation results
      - Metadata (data_simulacao, ip_address, user_agent)

  2. Security
    - Enable RLS on `simulacoes` table
    - Add policy for public insert (anyone can create simulations)
    - Add policy for authenticated read (admin access)
*/

CREATE TABLE IF NOT EXISTS simulacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Client data
  cliente_nome text NOT NULL,
  cliente_email text NOT NULL,
  cliente_whatsapp text NOT NULL,
  cliente_profissao text,
  cliente_cpf text,
  cliente_endereco text,
  cliente_numero text,
  cliente_cep text,
  
  -- Property data
  tipo_imovel text NOT NULL,
  valor_imovel numeric NOT NULL,
  entrada numeric DEFAULT 0,
  fgts numeric DEFAULT 0,
  renda_familiar numeric NOT NULL,
  aluguel_atual numeric DEFAULT 0,
  
  -- Financing results
  fin_credito numeric NOT NULL,
  fin_parcelas integer NOT NULL,
  fin_valor_parcela numeric NOT NULL,
  fin_total numeric NOT NULL,
  fin_taxa_anual numeric NOT NULL,
  
  -- Consortium results
  cons_credito numeric NOT NULL,
  cons_parcelas integer NOT NULL,
  cons_valor_parcela numeric NOT NULL,
  cons_total numeric NOT NULL,
  cons_taxa_adm numeric NOT NULL,
  
  -- Metadata
  data_simulacao timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE simulacoes ENABLE ROW LEVEL SECURITY;

-- Policy for public insert (anyone can create simulations)
CREATE POLICY "Anyone can insert simulations"
  ON simulacoes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy for authenticated read (admin access)
CREATE POLICY "Authenticated users can read simulations"
  ON simulacoes
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for authenticated delete (admin can delete)
CREATE POLICY "Authenticated users can delete simulations"
  ON simulacoes
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_simulacoes_data_simulacao ON simulacoes(data_simulacao DESC);
CREATE INDEX IF NOT EXISTS idx_simulacoes_cliente_email ON simulacoes(cliente_email);
CREATE INDEX IF NOT EXISTS idx_simulacoes_cliente_nome ON simulacoes(cliente_nome);
CREATE INDEX IF NOT EXISTS idx_simulacoes_tipo_imovel ON simulacoes(tipo_imovel);