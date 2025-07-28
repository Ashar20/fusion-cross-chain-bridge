const hre = require("hardhat");
const fs = require("fs");

async function main() {
  // Get the escrow factory address from deployment JSON
  const deployment = JSON.parse(fs.readFileSync("complete-1inch-system-deployment.json", "utf8"));
  const escrowFactoryAddress = deployment.escrowFactory.address;

  console.log("Deploying Gasless1inchResolver with escrowFactory:", escrowFactoryAddress);

  const Gasless1inchResolver = await hre.ethers.getContractFactory("Gasless1inchResolver");
  const resolver = await Gasless1inchResolver.deploy(escrowFactoryAddress);
  await resolver.waitForDeployment();

  console.log("Gasless1inchResolver deployed to:", resolver.target);

  // Save deployment info
  const deploymentInfo = {
    gaslessResolver: {
      address: resolver.target,
      escrowFactory: escrowFactoryAddress,
      network: hre.network.name,
      timestamp: new Date().toISOString(),
    }
  };
  fs.writeFileSync(
    "gasless-resolver-deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("Deployment info saved to gasless-resolver-deployment.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 