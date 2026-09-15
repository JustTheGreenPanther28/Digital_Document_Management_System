// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EvidenceVaultRegistry
 * @notice Enterprise Tamper-Proof Blockchain Registry for Digital Evidence, Case Documents & Audit Trails.
 * Compliant with ISO/IEC 27037 and Section 65B of the Indian Evidence Act.
 */
contract EvidenceVaultRegistry {

    struct EvidenceRecord {
        string evidenceNumber;
        bytes32 sha256Hash;
        string storageUri;
        address custodian;
        uint256 blockTimestamp;
        bool exists;
    }

    struct DocumentRecord {
        string documentId;
        bytes32 sha256Hash;
        uint256 version;
        address uploader;
        uint256 blockTimestamp;
        bool exists;
    }

    struct AuditBatchRecord {
        bytes32 merkleRoot;
        uint256 eventCount;
        address auditor;
        uint256 blockTimestamp;
    }

    address public owner;
    uint256 public totalEvidenceAnchored;
    uint256 public totalDocumentsAnchored;
    uint256 public totalAuditBatches;

    // Mappings: identifier => Record
    mapping(string => EvidenceRecord) private evidenceRegistry;
    mapping(string => mapping(uint256 => DocumentRecord)) private documentRegistry;
    mapping(uint256 => AuditBatchRecord) private auditBatches;

    // Events emitted to EVM block log
    event EvidenceAnchored(
        string indexed evidenceNumber,
        bytes32 sha256Hash,
        address indexed custodian,
        uint256 timestamp,
        string storageUri
    );

    event DocumentAnchored(
        string indexed documentId,
        uint256 indexed version,
        bytes32 sha256Hash,
        address indexed uploader,
        uint256 timestamp
    );

    event AuditBatchAnchored(
        uint256 indexed batchId,
        bytes32 merkleRoot,
        uint256 eventCount,
        address indexed auditor,
        uint256 timestamp
    );

    event TamperDetected(
        string indexed identifier,
        bytes32 expectedHash,
        bytes32 providedHash,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only registry owner can execute this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Registers and anchors a digital evidence SHA-256 hash on the blockchain.
     */
    function registerEvidence(
        string memory evidenceNumber,
        bytes32 sha256Hash,
        string memory storageUri
    ) external returns (bytes32) {
        require(bytes(evidenceNumber).length > 0, "Evidence number cannot be empty");
        require(sha256Hash != bytes32(0), "SHA-256 hash cannot be zero");

        EvidenceRecord storage record = evidenceRegistry[evidenceNumber];
        require(!record.exists, "Evidence already anchored on blockchain");

        record.evidenceNumber = evidenceNumber;
        record.sha256Hash = sha256Hash;
        record.storageUri = storageUri;
        record.custodian = msg.sender;
        record.blockTimestamp = block.timestamp;
        record.exists = true;

        totalEvidenceAnchored++;

        emit EvidenceAnchored(evidenceNumber, sha256Hash, msg.sender, block.timestamp, storageUri);

        return keccak256(abi.encodePacked(evidenceNumber, sha256Hash, block.timestamp));
    }

    /**
     * @notice Anchors a case document version SHA-256 hash on the blockchain.
     */
    function recordDocument(
        string memory documentId,
        bytes32 sha256Hash,
        uint256 version
    ) external returns (bytes32) {
        require(bytes(documentId).length > 0, "Document ID cannot be empty");
        require(sha256Hash != bytes32(0), "SHA-256 hash cannot be zero");
        require(version > 0, "Version must be >= 1");

        DocumentRecord storage record = documentRegistry[documentId][version];
        require(!record.exists, "Document version already anchored on blockchain");

        record.documentId = documentId;
        record.sha256Hash = sha256Hash;
        record.version = version;
        record.uploader = msg.sender;
        record.blockTimestamp = block.timestamp;
        record.exists = true;

        totalDocumentsAnchored++;

        emit DocumentAnchored(documentId, version, sha256Hash, msg.sender, block.timestamp);

        return keccak256(abi.encodePacked(documentId, version, sha256Hash, block.timestamp));
    }

    /**
     * @notice Anchors a batch of audit events using their Merkle Root.
     */
    function recordAuditBatch(
        bytes32 merkleRoot,
        uint256 eventCount
    ) external returns (uint256) {
        require(merkleRoot != bytes32(0), "Merkle root cannot be zero");
        require(eventCount > 0, "Event count must be > 0");

        uint256 batchId = totalAuditBatches++;
        auditBatches[batchId] = AuditBatchRecord({
            merkleRoot: merkleRoot,
            eventCount: eventCount,
            auditor: msg.sender,
            blockTimestamp: block.timestamp
        });

        emit AuditBatchAnchored(batchId, merkleRoot, eventCount, msg.sender, block.timestamp);
        return batchId;
    }

    /**
     * @notice Verifies if the supplied evidence SHA-256 matches the immutable blockchain record.
     */
    function verifyEvidence(
        string memory evidenceNumber,
        bytes32 currentSha256Hash
    ) external view returns (
        bool verified,
        bytes32 onChainHash,
        uint256 anchoredTimestamp,
        address custodian,
        string memory storageUri
    ) {
        EvidenceRecord memory record = evidenceRegistry[evidenceNumber];
        if (!record.exists) {
            return (false, bytes32(0), 0, address(0), "");
        }

        bool matchResult = (record.sha256Hash == currentSha256Hash);
        return (
            matchResult,
            record.sha256Hash,
            record.blockTimestamp,
            record.custodian,
            record.storageUri
        );
    }

    /**
     * @notice Verifies if the supplied document version matches the on-chain record.
     */
    function verifyDocument(
        string memory documentId,
        uint256 version,
        bytes32 currentSha256Hash
    ) external view returns (
        bool verified,
        bytes32 onChainHash,
        uint256 anchoredTimestamp,
        address uploader
    ) {
        DocumentRecord memory record = documentRegistry[documentId][version];
        if (!record.exists) {
            return (false, bytes32(0), 0, address(0));
        }

        bool matchResult = (record.sha256Hash == currentSha256Hash);
        return (
            matchResult,
            record.sha256Hash,
            record.blockTimestamp,
            record.uploader
        );
    }
}
