-- Contract Management System schema (PostgreSQL)
CREATE TABLE IF NOT EXISTS parties (
  id BIGSERIAL PRIMARY KEY, name VARCHAR(180) NOT NULL, party_type VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (party_type IN ('customer','supplier','partner','other')),
  email VARCHAR(254), phone VARCHAR(40), tax_code VARCHAR(40), address TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_parties_tax_code ON parties(tax_code) WHERE tax_code IS NOT NULL AND tax_code <> '';
CREATE TABLE IF NOT EXISTS contracts (
  id BIGSERIAL PRIMARY KEY, contract_code VARCHAR(40) NOT NULL UNIQUE, title VARCHAR(220) NOT NULL, party_id BIGINT REFERENCES parties(id) ON DELETE SET NULL,
  contract_type VARCHAR(30) NOT NULL DEFAULT 'service' CHECK (contract_type IN ('service','purchase','sales','employment','lease','nda','other')),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','active','completed','expired','terminated')),
  start_date DATE, end_date DATE, value NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (value >= 0), currency CHAR(3) NOT NULL DEFAULT 'VND', description TEXT,
  owner_name VARCHAR(160), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_contracts_party ON contracts(party_id);
CREATE TABLE IF NOT EXISTS contract_events (id BIGSERIAL PRIMARY KEY, contract_id BIGINT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE, event_type VARCHAR(40) NOT NULL, note TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
INSERT INTO parties(name,party_type,email,phone,tax_code,address) VALUES
('Công ty TNHH Sao Việt','customer','contact@saoviet.example','0901001001','0101234567','Hà Nội'),
('Công ty Cổ phần Minh Long','supplier','hello@minhlong.example','0902002002','0107654321','Thái Nguyên') ON CONFLICT DO NOTHING;
INSERT INTO contracts(contract_code,title,party_id,contract_type,status,start_date,end_date,value,currency,description,owner_name) VALUES
('HD-2026-001','Hợp đồng cung cấp dịch vụ CNTT',(SELECT id FROM parties WHERE name='Công ty TNHH Sao Việt'),'service','active','2026-01-01','2026-12-31',185000000,'VND','Bảo trì và hỗ trợ hệ thống CNTT','Nguyễn Minh Anh'),
('HD-2026-002','Hợp đồng cung ứng thiết bị',(SELECT id FROM parties WHERE name='Công ty Cổ phần Minh Long'),'purchase','review','2026-09-01','2026-11-30',72000000,'VND','Cung cấp thiết bị văn phòng','Trần Quốc Huy'),
('HD-2026-003','Thỏa thuận bảo mật thông tin',(SELECT id FROM parties WHERE name='Công ty TNHH Sao Việt'),'nda','draft','2026-10-01','2027-10-01',0,'VND','Bảo mật thông tin hai bên','Lê Thu Hà') ON CONFLICT(contract_code) DO NOTHING;
