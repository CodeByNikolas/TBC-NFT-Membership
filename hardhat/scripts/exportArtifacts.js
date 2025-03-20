const fs = require('fs');
const path = require('path');

async function main() {
  // Get the contract artifact
  const artifactPath = path.join(__dirname, '../artifacts/contracts/TBCNFT.sol/TBCNFT.json');
  const artifact = require(artifactPath);

  // Get the source code
  const sourcePath = path.join(__dirname, '../contracts/TBCNFT.sol');
  const sourceCode = fs.readFileSync(sourcePath, 'utf8');

  // Create the output directory if it doesn't exist
  const outputDir = path.join(__dirname, '../../src/contracts');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write the contract data
  const contractData = {
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    sourceCode
  };

  fs.writeFileSync(
    path.join(outputDir, 'TBCNFT.json'),
    JSON.stringify(contractData, null, 2)
  );

  console.log('Contract artifacts exported successfully!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 