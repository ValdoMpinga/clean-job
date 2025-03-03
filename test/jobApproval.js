const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("JobApproval", function ()
{
    let JobApproval, jobApproval, hr, fieldManager, attacker;

    before(async function ()
    {
        [hr, fieldManager, attacker] = await ethers.getSigners();
        JobApproval = await ethers.getContractFactory("JobApproval");
        jobApproval = await JobApproval.deploy(hr.address);
    });

    it("Should set field manager", async function ()
    {
        await jobApproval.setFieldManager("IT", fieldManager.address);
        expect(await jobApproval.fieldManagers("IT")).to.equal(fieldManager.address);
    });

    it("Should not allow non-HR to set field manager", async function ()
    {
        await expect(
            jobApproval.connect(attacker).setFieldManager("IT", attacker.address)
        ).to.be.revertedWith("Only HR can set field managers");
    });

    it("Should allow HR and Field Manager to sign a job approval", async function ()
    {
        const title = "Software Engineer";
        const description = "Develop Ethereum smart contracts";

        const jobHash = ethers.keccak256(ethers.toUtf8Bytes(title + description));

        // HR signs job
        const hrSignature = await hr.signMessage(ethers.getBytes(jobHash)); // ✅ Fixed

        // Field Manager signs job
        const fieldManagerSignature = await fieldManager.signMessage(ethers.getBytes(jobHash)); // ✅ Fixed

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
