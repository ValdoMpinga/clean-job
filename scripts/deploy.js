const hre = require("hardhat");

async function main()
{
    const [hr] = await hre.ethers.getSigners();

    console.log("Deploying JobApproval contract with HR:", hr.address);

    // Get the contract factory
    const JobApproval = await hre.ethers.getContractFactory("JobApproval");
    console.log("Contract factory loaded");

    // Deploy the contract
    console.log("Deploying contract...");
    const jobApproval = await JobApproval.deploy(hr.address, "Alice");

    // Wait for deployment to complete
    await jobApproval.waitForDeployment();

    // Fetch the deployment transaction (Ethers v6 way)
    const deploymentTransaction = jobApproval.deploymentTransaction();

    if (!deploymentTransaction)
    {
        throw new Error("deploymentTransaction is undefined");
    }

    // Log deployment details
    console.log("JobApproval deployed to:", await jobApproval.getAddress());
    console.log("Deployment transaction hash:", deploymentTransaction.hash);
}

main().catch((error) =>
{
    console.error(error);
    process.exitCode = 1;
});
