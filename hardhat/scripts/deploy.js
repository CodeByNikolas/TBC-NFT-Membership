const hre = require("hardhat");

async function main() {
  // Get the contract factory
  const TBCNFT = await hre.ethers.getContractFactory("TBCNFT");

  // Get the signer (connected wallet)
  const [signer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", signer.address);

  // Deploy the contract
  const nft = await TBCNFT.deploy(
    "TBC Membership NFT", // name
    "TBC",              // symbol
    signer.address,     // initial owner
    "ipfs://"          // base URI
  );

  await nft.waitForDeployment();
  console.log("TBCNFT deployed to:", await nft.getAddress());

  // Wait for a few block confirmations
  await nft.deploymentTransaction().wait(5);
  console.log("Confirmed 5 blocks");

  // Verify the contract
  try {
    await hre.run("verify:verify", {
      address: await nft.getAddress(),
      constructorArguments: [
        "TBC Membership NFT",
        "TBC",
        signer.address,
        "ipfs://"
      ],
    });
    console.log("Contract verified successfully");
  } catch (error) {
    console.error("Error verifying contract:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 