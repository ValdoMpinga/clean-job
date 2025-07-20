# JobApproval Smart Contract

> Blockchain-based dual-signature verification system for validating job requirements through HR and technical expert approval

## Overview

The JobApproval smart contract addresses a critical problem in hiring: **unrealistic job requirements**. By implementing a blockchain-based dual-signature system, it ensures that job postings are validated by both HR teams and technical experts before publication, creating accountability and preventing impossible skill combinations.

### The Problem We Solve

- **HR Disconnect**: HR teams may not understand technical nuances
- **Unrealistic Expectations**: Requirements become wish lists rather than realistic needs  
- **No Accountability**: No verification system for published requirements
- **Technical Debt**: Jobs with impossible skill combinations waste everyone's time

### Our Solution

- **Dual Validation**: Both HR and technical experts must approve requirements
- **Immutable Records**: Blockchain provides permanent audit trail
- **Role Specialization**: Field managers validate specific job types
- **Cryptographic Proof**: Digital signatures ensure authenticity

## Features

### Core Functionality
- **Dual-Signature Workflow**: Requires approval from both HR and Field Managers
- **Role-Based Access Control**: Strict separation of responsibilities
- **Job Type Specialization**: Field managers assigned to specific technical domains
- **Immutable Audit Trail**: All approvals permanently recorded on blockchain

### Security Features
- **Email Verification**: Ensures unique manager identities
- **Cryptographic Signatures**: ECDSA signature verification
- **Access Control**: Only authorized managers can approve jobs
- **Anti-Replay Protection**: Prevents duplicate approvals


## Approval Workflow

**Job Creation → HR Review → HR Signature → Field Manager Review → Technical Signature → Blockchain Record → Job Approved**

1. **Job Creation**: HR drafts job requirements
2. **HR Approval**: HR manager cryptographically signs requirements  
3. **Technical Review**: Field manager validates technical feasibility
4. **Blockchain Record**: Approval permanently recorded on-chain

## Installation & Deployment

### Prerequisites
- Node.js v16+
- Hardhat or Truffle
- MetaMask or similar Web3 wallet

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/job-approval-contract.git
cd job-approval-contract
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure network settings**
```bash
cp .env.example .env
# Edit .env with your network configuration
```

4. **Deploy to testnet**
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Constructor Parameters
```solidity
constructor(address _hrManager, string memory _hrManagerName)
```

Deploy with initial HR manager:
```javascript
const contract = await JobApproval.deploy(
    "0x1234...", // HR Manager address
    "Alice Smith" // HR Manager name
);
```

## Usage Examples

### Adding Managers

```javascript
// Add HR Manager
await contract.addHRManager("0xABC...", "Bob Johnson");

// Add Field Manager for specific job type
await contract.addFieldManager(
    "0xDEF...", 
    "Carol Tech", 
    "Software Engineering",
    "carol@company.com"
);
```

### Job Verification

```javascript
// Verify job with dual signatures
await contract.verifyJob(
    "Senior Developer", // title
    "5+ years React, Node.js", // description  
    "Software Engineering", // jobType
    hrSignature, // HR signature bytes
    fieldManagerSignature // Field manager signature bytes
);
```

### Signature Generation

```javascript
// Generate message hash
const messageHash = await contract.getMessageHash(title, description);
const ethHash = await contract.getEthSignedMessageHash(messageHash);

// Sign with private key
const signature = await signer.signMessage(ethers.utils.arrayify(ethHash));
```

## Contract Functions

### Management Functions
| Function | Description | Access |
|----------|-------------|---------|
| `addHRManager(address, string)` | Add new HR manager | HR Only |
| `removeHRManager(address)` | Remove HR manager | HR Only |
| `addFieldManager(address, string, string, string)` | Add technical expert | HR Only |
| `removeFieldManager(string)` | Remove field manager | HR Only |

### Verification Functions
| Function | Description | Access |
|----------|-------------|---------|
| `verifyJob(...)` | Approve job with dual signatures | Public |
| `getMessageHash(string, string)` | Generate job hash | Public |
| `recoverSigner(bytes32, bytes)` | Recover signature address | Public |

### View Functions
| Function | Description | Returns |
|----------|-------------|---------|
| `listHRManagers()` | Get all HR managers | `HRManager[]` |
| `listFieldManagers()` | Get all field managers | `FieldManager[]` |
| `approvedJobs(bytes32)` | Check job approval status | `bool` |

## Security Considerations

- **Signature Verification**: Uses ECDSA recovery for authenticity
- **Role Validation**: Ensures only authorized managers can approve
- **Replay Protection**: Hash-based duplicate prevention
- **Email Uniqueness**: Prevents identity conflicts
- **Gas Optimization**: Efficient array operations

## Testing

```bash
# Run test suite
npx hardhat test

# Run with coverage
npx hardhat coverage

# Run on local network
npx hardhat node
```

## Gas Estimates

| Function | Estimated Gas |
|----------|---------------|
| Deploy Contract | ~2,500,000 |
| Add HR Manager | ~85,000 |
| Add Field Manager | ~120,000 |
| Verify Job | ~95,000 |

## Network Deployment

### Testnet Addresses
- **Sepolia**: `0x...` (Coming soon)
- **Goerli**: `0x...` (Coming soon)

### Mainnet
- **Ethereum**: Not yet deployed

## Contributing

We welcome contributions! Please see our Contributing Guidelines for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Related Projects

This smart contract is part of a larger humanization services ecosystem:
- **Job Requirement Validation**: LLaMA-powered bias detection
- **Bias Trigger Removal**: Automated fairness optimization
- **Web Interface**: User-friendly job analysis platform

## Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

## Acknowledgments

- Built with Hardhat
- Inspired by decentralized governance models
- Part of the effort to humanize hiring processes
