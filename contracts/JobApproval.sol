// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract JobApproval {
    // HR manager address responsible for hiring and managing field managers
    address public hrManager;

    // Mapping to store field managers for specific job types (e.g., "IT", "Finance")
    mapping(string => address) public fieldManagers;

    // Mapping to store approved jobs using their hashes as keys
    mapping(bytes32 => bool) public approvedJobs;

    // Event emitted when a job is successfully approved
    event JobApproved(string title, string description, address hr, address fieldManager);

    // Constructor to initialize the contract with the HR manager's address
    constructor(address _hrManager) {
        hrManager = _hrManager;
    }

    /**
     * @dev Sets the field manager for a specific job type.
     * Only the HR manager can call this function.
     * @param jobType The type of job (e.g., "IT", "Finance").
     * @param manager The address of the field manager for the job type.
     */
    function setFieldManager(string memory jobType, address manager) public {
        require(msg.sender == hrManager, "Only HR can set field managers");
        fieldManagers[jobType] = manager;
    }

    /**
     * @dev Verifies a job by checking the HR and field manager signatures.
     * The job is approved if both signatures are valid.
     * @param title The title of the job.
     * @param description The description of the job.
     * @param jobType The type of job (e.g., "IT", "Finance").
     * @param hrSignature The HR manager's signature for the job.
     * @param fieldManagerSignature The field manager's signature for the job.
     */
    function verifyJob(
        string memory title, 
        string memory description, 
        string memory jobType, 
        bytes memory hrSignature, 
        bytes memory fieldManagerSignature
    ) public {
        // Ensure a field manager is assigned for the job type
        require(fieldManagers[jobType] != address(0), "No field manager assigned");

        // Generate the job hash from the title and description
        bytes32 jobHash = getMessageHash(title, description);

        // Generate the Ethereum signed message hash
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(jobHash);

        // Recover the signer addresses from the signatures
        address hrSigner = recoverSigner(ethSignedMessageHash, hrSignature);
        address fieldSigner = recoverSigner(ethSignedMessageHash, fieldManagerSignature);

        // Verify that the HR manager signed the job
        require(hrSigner == hrManager, "Invalid HR signature");

        // Verify that the field manager signed the job
        require(fieldSigner == fieldManagers[jobType], "Invalid Field Manager signature");

        // Mark the job as approved
        approvedJobs[jobHash] = true;

        // Emit an event to log the job approval
        emit JobApproved(title, description, hrManager, fieldSigner);
    }

    /**
     * @dev Generates a hash of the job title and description.
     * @param title The title of the job.
     * @param description The description of the job.
     * @return The keccak256 hash of the title and description.
     */
    function getMessageHash(string memory title, string memory description) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(title, description));
    }

    /**
     * @dev Generates the Ethereum signed message hash.
     * This is required to verify signatures in Ethereum.
     * @param messageHash The hash of the original message.
     * @return The keccak256 hash of the Ethereum signed message prefix and the message hash.
     */
    function getEthSignedMessageHash(bytes32 messageHash) public pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
    }

    /**
     * @dev Recovers the signer's address from the signed message hash and signature.
     * @param ethSignedMessageHash The Ethereum signed message hash.
     * @param signature The signature to recover the signer from.
     * @return The address of the signer.
     */
    function recoverSigner(bytes32 ethSignedMessageHash, bytes memory signature) public pure returns (address) {
        // Split the signature into its components (r, s, v)
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature);

        // Recover the signer's address using ecrecover
        return ecrecover(ethSignedMessageHash, v, r, s);
    }

    /**
     * @dev Splits a signature into its components (r, s, v).
     * @param sig The signature to split.
     * @return r The first 32 bytes of the signature.
     * @return s The second 32 bytes of the signature.
     * @return v The recovery identifier (final byte).
     */
    function splitSignature(bytes memory sig) public pure returns (bytes32 r, bytes32 s, uint8 v) {
        // Ensure the signature is 65 bytes long
        require(sig.length == 65, "Invalid signature length");

        // Use assembly to extract r, s, and v from the signature
        assembly {
            r := mload(add(sig, 32))  // First 32 bytes
            s := mload(add(sig, 64))  // Next 32 bytes
            v := byte(0, mload(add(sig, 96)))  // Final byte
        }
    }
}
