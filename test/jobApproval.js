const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("JobApproval", function ()
{
    let JobApproval, jobApproval, hr, fieldManager, attacker;

    before(async function ()
    {
        [hr, fieldManager, attacker] = await ethers.getSigners();
        JobApproval = await ethers.getContractFactory("JobApproval");
        jobApproval = await JobApproval.deploy(hr.address, "Alice");
    });

    // Reset contract state before each test
    beforeEach(async function ()
    {
        // Re-deploy the contract to reset state
        jobApproval = await JobApproval.deploy(hr.address, "Alice");
    });

    // Test HR Manager CRUD
    describe("HR Manager CRUD", function ()
    {
        it("Should initialize with one HR manager", async function ()
        {
            const hrManagers = await jobApproval.listHRManagers();
            expect(hrManagers.length).to.equal(1);
            expect(hrManagers[0].id).to.equal(hr.address);
            expect(hrManagers[0].name).to.equal("Alice");
        });

        it("Should add a new HR manager", async function ()
        {
            await jobApproval.connect(hr).addHRManager(attacker.address, "Bob");
            const hrManagers = await jobApproval.listHRManagers();
            expect(hrManagers.length).to.equal(2);
            expect(hrManagers[1].id).to.equal(attacker.address);
            expect(hrManagers[1].name).to.equal("Bob");
        });

        it("Should not allow non-HR to add HR managers", async function ()
        {
            await expect(
                jobApproval.connect(attacker).addHRManager(attacker.address, "Bob")
            ).to.be.revertedWith("Only HR managers can perform this action");
        });

        it("Should update an HR manager's name", async function ()
        {
            await jobApproval.connect(hr).updateHRManager(hr.address, "Alice Smith");
            const hrManagers = await jobApproval.listHRManagers();
            expect(hrManagers[0].name).to.equal("Alice Smith");
        });

        it("Should remove an HR manager", async function ()
        {
            await jobApproval.connect(hr).addHRManager(attacker.address, "Bob");
            await jobApproval.connect(hr).removeHRManager(hr.address);
            const hrManagers = await jobApproval.listHRManagers();
            expect(hrManagers.length).to.equal(1);
            expect(hrManagers[0].id).to.equal(attacker.address);
        });
    });

    // Test Field Manager CRUD
    describe("Field Manager CRUD", function ()
    {
        beforeEach(async function ()
        {
            // Add a field manager for testing
            await jobApproval.connect(hr).addFieldManager(fieldManager.address, "Charlie", "IT", "charlie@example.com");
        });

        it("Should add a field manager", async function ()
        {
            const fieldManagers = await jobApproval.listFieldManagers();
            expect(fieldManagers.length).to.equal(1);
            expect(fieldManagers[0].id).to.equal(fieldManager.address);
            expect(fieldManagers[0].name).to.equal("Charlie");
            expect(fieldManagers[0].jobType).to.equal("IT");
            expect(fieldManagers[0].email).to.equal("charlie@example.com");
        });

        it("Should not allow non-HR to add field managers", async function ()
        {
            await expect(
                jobApproval.connect(attacker).addFieldManager(attacker.address, "Eve", "Finance", "eve@example.com")
            ).to.be.revertedWith("Only HR managers can perform this action");
        });

        it("Should update a field manager's details", async function ()
        {
            await jobApproval.connect(hr).updateFieldManager("IT", "Charlie Brown", "IT Support", "charlie.brown@example.com");
            const fieldManagers = await jobApproval.listFieldManagers();
            expect(fieldManagers[0].name).to.equal("Charlie Brown");
            expect(fieldManagers[0].jobType).to.equal("IT Support");
            expect(fieldManagers[0].email).to.equal("charlie.brown@example.com");
        });


        it("Should remove a field manager", async function ()
        {
            await jobApproval.connect(hr).removeFieldManager("IT");
            const fieldManagers = await jobApproval.listFieldManagers();
            expect(fieldManagers.length).to.equal(0);
        });
    });

    // Test Job Approval
    describe("Job Approval", function ()
    {
        beforeEach(async function ()
        {
            // Add a field manager for testing
            await jobApproval.connect(hr).addFieldManager(fieldManager.address, "Charlie", "IT", "charlie@example.com");
        });

        it("Should allow HR and Field Manager to sign a job approval", async function ()
        {
            const title = "Software Engineer";
            const description = "Develop Ethereum smart contracts";

            const jobHash = ethers.keccak256(ethers.toUtf8Bytes(title + description));

            // HR signs job
            const hrSignature = await hr.signMessage(ethers.getBytes(jobHash));

            // Field Manager signs job
            const fieldManagerSignature = await fieldManager.signMessage(ethers.getBytes(jobHash));

            // Verify job on-chain
            await jobApproval.verifyJob(title, description, "IT", hrSignature, fieldManagerSignature);

            // Check if job is approved
            const storedHash = await jobApproval.getMessageHash(title, description);
            expect(await jobApproval.approvedJobs(storedHash)).to.be.true;
        });

        it("Should fail if HR signature is incorrect", async function ()
        {
            const title = "Data Scientist";
            const description = "Analyze blockchain data";

            const jobHash = ethers.keccak256(ethers.toUtf8Bytes(title + description));

            // Attacker (not HR) signs job
            const fakeHrSignature = await attacker.signMessage(ethers.getBytes(jobHash));

            // Field Manager signs correctly
            const fieldManagerSignature = await fieldManager.signMessage(ethers.getBytes(jobHash));

            await expect(
                jobApproval.verifyJob(title, description, "IT", fakeHrSignature, fieldManagerSignature)
            ).to.be.revertedWith("Invalid HR signature");
        });

        it("Should fail if Field Manager signature is incorrect", async function ()
        {
            const title = "Blockchain Developer";
            const description = "Build and deploy smart contracts";

            const jobHash = ethers.keccak256(ethers.toUtf8Bytes(title + description));

            // HR signs correctly
            const hrSignature = await hr.signMessage(ethers.getBytes(jobHash));

            // Attacker (not field manager) signs job
            const fakeFieldManagerSignature = await attacker.signMessage(ethers.getBytes(jobHash));

            await expect(
                jobApproval.verifyJob(title, description, "IT", hrSignature, fakeFieldManagerSignature)
            ).to.be.revertedWith("Invalid Field Manager signature");
        });

        it("Should fail if no field manager is set for the job type", async function ()
        {
            const title = "Cybersecurity Expert";
            const description = "Monitor and protect blockchain infrastructure";

            const jobHash = ethers.keccak256(ethers.toUtf8Bytes(title + description));

            // HR signs correctly
            const hrSignature = await hr.signMessage(ethers.getBytes(jobHash));

            // Field Manager signs correctly
            const fieldManagerSignature = await fieldManager.signMessage(ethers.getBytes(jobHash));

            await expect(
                jobApproval.verifyJob(title, description, "Finance", hrSignature, fieldManagerSignature)
            ).to.be.revertedWith("No field manager assigned");
        });

        it("Should not allow duplicate job approvals", async function ()
        {
            const title = "DevOps Engineer";
            const description = "Automate deployment pipelines";

            const jobHash = ethers.keccak256(ethers.toUtf8Bytes(title + description));

            // HR and Field Manager sign correctly
            const hrSignature = await hr.signMessage(ethers.getBytes(jobHash));
            const fieldManagerSignature = await fieldManager.signMessage(ethers.getBytes(jobHash));

            await jobApproval.verifyJob(title, description, "IT", hrSignature, fieldManagerSignature);

            // Attempting to approve again should fail
            await expect(
                jobApproval.verifyJob(title, description, "IT", hrSignature, fieldManagerSignature)
            ).to.be.revertedWith("Job already approved");
        });

        it("Should store and retrieve job approvals correctly", async function ()
        {
            const title = "AI Engineer";
            const description = "Develop AI models for blockchain";

            const jobHash = ethers.keccak256(ethers.toUtf8Bytes(title + description));

            // HR and Field Manager sign correctly
            const hrSignature = await hr.signMessage(ethers.getBytes(jobHash));
            const fieldManagerSignature = await fieldManager.signMessage(ethers.getBytes(jobHash));

            await jobApproval.verifyJob(title, description, "IT", hrSignature, fieldManagerSignature);

            // Verify approval
            const storedHash = await jobApproval.getMessageHash(title, description);
            expect(await jobApproval.approvedJobs(storedHash)).to.be.true;
        });
    });
});
