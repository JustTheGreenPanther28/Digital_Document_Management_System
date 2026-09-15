-- V5__blockchain_transactions.sql
-- SIH Problem 190 - Actual EVM Blockchain Transaction Receipts for Evidence, Documents & Audit Trail

CREATE TABLE IF NOT EXISTS blockchain_tx_receipts (
    id UUID PRIMARY KEY,
    tx_hash VARCHAR(100) UNIQUE NOT NULL,
    block_number BIGINT NOT NULL,
    contract_address VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- EVIDENCE, DOCUMENT, AUDIT_BATCH
    entity_id VARCHAR(100) NOT NULL,
    case_id UUID,
    sha256_hash VARCHAR(64) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    signer_address VARCHAR(100) NOT NULL,
    gas_used BIGINT NOT NULL,
    block_timestamp TIMESTAMP NOT NULL,
    network_name VARCHAR(100) NOT NULL DEFAULT 'EVM Forensic Trust Network',
    raw_payload_json TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blockchain_tx_entity ON blockchain_tx_receipts(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_hash ON blockchain_tx_receipts(tx_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_sha256 ON blockchain_tx_receipts(sha256_hash);
