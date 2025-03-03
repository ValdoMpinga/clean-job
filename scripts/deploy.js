const hre = require("hardhat");

async function main()
{
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contract with account:", deployer.address);

    const JobRequirementApproval = await hre.ethers.getContractFactory("JobRequirementApproval");
    const contract = await JobRequirementApproval.deploy(deployer.address);

    await contract.deployed();

    console.log("Contract deployed at:", contract.address);
}

main().catch((error) =>
{
    console.error(error);
    process.exitCode = 1;
});
