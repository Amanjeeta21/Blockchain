
import { network } from "hardhat";

async function main() {
  const { viem } = await network.create({
    network: "localhost",
  });

  const [owner] = await viem.getWalletClients();

  const tipJar = await viem.getContractAt(
    "TipJar",
    "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  );

  const balanceBefore = await viem.getPublicClient().then(
    (client) => client.getBalance({ address: tipJar.address }),
  );

  console.log("Balance before withdrawal:", balanceBefore.toString(), "wei");

  const hash = await tipJar.write.withdraw({
    account: owner.account,
  });

  const publicClient = await viem.getPublicClient();

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const balanceAfter = await publicClient.getBalance({
    address: tipJar.address,
  });

  console.log("Transaction hash:", hash);
  console.log("Gas used:", receipt.gasUsed.toString());
  console.log("Balance after withdrawal:", balanceAfter.toString(), "wei");
}

main().catch(console.error);
