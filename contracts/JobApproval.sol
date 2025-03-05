// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract JobApproval {
    // Struct to store HR manager details
    struct HRManager {
        address id;
        string name;
    }

    // Struct to store Field Manager details
    struct FieldManager {
        address id;
        string name;
        string jobType;
        string email; // Added email field
    }

    // Array to store job types for field managers
    string[] public jobTypes;

    // Array to store HR managers
    HRManager[] public hrManagers;

    // Mapping to store field managers for specific job types
    mapping(string => FieldManager) public fieldManagers;

    // Mapping to store approved jobs using their hashes as keys
    mapping(bytes32 => bool) public approvedJobs;

    // Mapping to ensure email uniqueness
    mapping(string => bool) public emailExists;

    // Event emitted when a job is successfully approved
    event JobApproved(
        string title,
        string description,
        address hr,
        address fieldManager
    );

    // Event emitted when an HR manager is added
    event HRManagerAdded(address hrManager, string name);

    // Event emitted when an HR manager is removed
    event HRManagerRemoved(address hrManager);

    // Event emitted when an HR manager is updated
    event HRManagerUpdated(address hrManager, string newName);

    // Event emitted when a field manager is added
    event FieldManagerAdded(
        address fieldManager,
        string name,
        string jobType,
        string email
    );

    // Event emitted when a field manager is removed
    event FieldManagerRemoved(address fieldManager);

    // Event emitted when a field manager is updated
    event FieldManagerUpdated(
        address fieldManager,
        string newName,
        string newJobType,
        string newEmail
    );

    // Modifier to restrict access to HR managers only
    modifier onlyHRManager() {
        bool isHRManager = false;
        for (uint i = 0; i < hrManagers.length; i++) {
            if (hrManagers[i].id == msg.sender) {
                isHRManager = true;
                break;
            }
        }
        require(isHRManager, "Only HR managers can perform this action");
        _;
    }

    // Constructor to initialize the contract with at least one HR manager
    constructor(address _hrManager, string memory _hrManagerName) {
        hrManagers.push(HRManager(_hrManager, _hrManagerName));
        emit HRManagerAdded(_hrManager, _hrManagerName);
    }

    // Function to add an HR manager
    function addHRManager(
        address _hrManager,
        string memory _name
    ) public onlyHRManager {
        hrManagers.push(HRManager(_hrManager, _name));
        emit HRManagerAdded(_hrManager, _name);
    }

    // Function to remove an HR manager
    function removeHRManager(address _hrManager) public onlyHRManager {
        for (uint i = 0; i < hrManagers.length; i++) {
            if (hrManagers[i].id == _hrManager) {
                // Remove the HR manager from the array
                hrManagers[i] = hrManagers[hrManagers.length - 1];
                hrManagers.pop();
                emit HRManagerRemoved(_hrManager);
                break;
            }
        }
    }

    // Function to update an HR manager's name
    function updateHRManager(
        address _hrManager,
        string memory _newName
    ) public onlyHRManager {
        for (uint i = 0; i < hrManagers.length; i++) {
            if (hrManagers[i].id == _hrManager) {
                hrManagers[i].name = _newName;
                emit HRManagerUpdated(_hrManager, _newName);
                break;
            }
        }
    }

    // Function to list all HR managers
    function listHRManagers() public view returns (HRManager[] memory) {
        return hrManagers;
    }

    // Function to add a field manager
    function addFieldManager(
        address _fieldManager,
        string memory _name,
        string memory _jobType,
        string memory _email
    ) public onlyHRManager {
        require(
            fieldManagers[_jobType].id == address(0),
            "Field manager already exists for this job type"
        );
        require(!emailExists[_email], "Email already exists");
        fieldManagers[_jobType] = FieldManager(
            _fieldManager,
            _name,
            _jobType,
            _email
        );
        emailExists[_email] = true;
        jobTypes.push(_jobType);
        emit FieldManagerAdded(_fieldManager, _name, _jobType, _email);
    }

    // Function to remove a field manager
    function removeFieldManager(string memory _jobType) public onlyHRManager {
        require(
            fieldManagers[_jobType].id != address(0),
            "Field manager does not exist"
        );
        address fieldManagerAddress = fieldManagers[_jobType].id;
        string memory email = fieldManagers[_jobType].email;
        delete fieldManagers[_jobType];
        delete emailExists[email];
        // Remove the job type from the jobTypes array
        for (uint i = 0; i < jobTypes.length; i++) {
            if (
                keccak256(abi.encodePacked(jobTypes[i])) ==
                keccak256(abi.encodePacked(_jobType))
            ) {
                jobTypes[i] = jobTypes[jobTypes.length - 1];
                jobTypes.pop();
                break;
            }
        }
        emit FieldManagerRemoved(fieldManagerAddress);
    }

    // Function to update a field manager's details
    function updateFieldManager(
        string memory _jobType,
        string memory _newName,
        string memory _newJobType,
        string memory _newEmail
    ) public onlyHRManager {
        require(
            fieldManagers[_jobType].id != address(0),
            "Field manager does not exist"
        );
        require(!emailExists[_newEmail], "Email already exists");

        address fieldManagerAddress = fieldManagers[_jobType].id;
        string memory oldEmail = fieldManagers[_jobType].email;

        // Update the email mapping
        delete emailExists[oldEmail];
        emailExists[_newEmail] = true;

        // Remove the old job type from the jobTypes array
        for (uint i = 0; i < jobTypes.length; i++) {
            if (
                keccak256(abi.encodePacked(jobTypes[i])) ==
                keccak256(abi.encodePacked(_jobType))
            ) {
                jobTypes[i] = jobTypes[jobTypes.length - 1];
                jobTypes.pop();
                break;
            }
        }

        // Add the new job type to the jobTypes array
        jobTypes.push(_newJobType);

        // Update the field manager's details
        fieldManagers[_newJobType] = FieldManager(
            fieldManagerAddress,
            _newName,
            _newJobType,
            _newEmail
        );
        if (
            keccak256(abi.encodePacked(_jobType)) !=
            keccak256(abi.encodePacked(_newJobType))
        ) {
            delete fieldManagers[_jobType];
        }

        emit FieldManagerUpdated(
            fieldManagerAddress,
            _newName,
            _newJobType,
            _newEmail
        );
    }

    // Function to list all field managers
    function listFieldManagers() public view returns (FieldManager[] memory) {
        FieldManager[] memory managers = new FieldManager[](jobTypes.length);
        for (uint i = 0; i < jobTypes.length; i++) {
            managers[i] = fieldManagers[jobTypes[i]];
        }
        return managers;
    }

    // Function to verify a job (unchanged from original)
    function verifyJob(
        string memory title,
        string memory description,
        string memory jobType,
        bytes memory hrSignature,
        bytes memory fieldManagerSignature
    ) public {
        require(
            fieldManagers[jobType].id != address(0),
            "No field manager assigned"
        );

        bytes32 jobHash = getMessageHash(title, description);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(jobHash);

        // Check if the job has already been approved
        require(!approvedJobs[jobHash], "Job already approved");

        address hrSigner = recoverSigner(ethSignedMessageHash, hrSignature);
        address fieldSigner = recoverSigner(
            ethSignedMessageHash,
            fieldManagerSignature
        );

        bool isHRManager = false;
        for (uint i = 0; i < hrManagers.length; i++) {
            if (hrManagers[i].id == hrSigner) {
                isHRManager = true;
                break;
            }
        }
        require(isHRManager, "Invalid HR signature");

        require(
            fieldSigner == fieldManagers[jobType].id,
            "Invalid Field Manager signature"
        );

        approvedJobs[jobHash] = true;
        emit JobApproved(title, description, hrSigner, fieldSigner);
    }
    
    // Helper functions (unchanged from original)
    function getMessageHash(
        string memory title,
        string memory description
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(title, description));
    }

    function getEthSignedMessageHash(
        bytes32 messageHash
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    messageHash
                )
            );
    }

    function recoverSigner(
        bytes32 ethSignedMessageHash,
        bytes memory signature
    ) public pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature);
        return ecrecover(ethSignedMessageHash, v, r, s);
    }

    function splitSignature(
        bytes memory sig
    ) public pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "Invalid signature length");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }
}
