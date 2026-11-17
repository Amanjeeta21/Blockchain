import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("QuantekToken", async function () {
  const { viem } = await network.create();
  const [deployer, user] = await viem.getWalletClients();

  async function deployToken() {
    return viem.deployContract("QuantekToken");
  }

  it("Should have a total supply of 1,000,000 QTK", async function () {
    const token = await deployToken();
    const decimals = await token.read.decimals();
    const expectedSupply = 1_000_000n * 10n ** BigInt(decimals);

    assert.equal(await token.read.totalSupply(), expectedSupply);
  });

  it("Should give the entire initial supply to the deployer", async function () {
    const token = await deployToken();
    const decimals = await token.read.decimals();
    const expectedSupply = 1_000_000n * 10n ** BigInt(decimals);

    assert.equal(
      await token.read.balanceOf([deployer.account.address]),
      expectedSupply,
    );
  });

  it("Should transfer QTK between accounts", async function () {
    const token = await deployToken();
    const decimals = await token.read.decimals();
    const amount = 100n * 10n ** BigInt(decimals);
    const initialSupply = 1_000_000n * 10n ** BigInt(decimals);

    await token.write.transfer([user.account.address, amount], {
      account: deployer.account,
    });

    assert.equal(await token.read.balanceOf([user.account.address]), amount);

    assert.equal(
      await token.read.balanceOf([deployer.account.address]),
      initialSupply - amount,
    );
  });
});