
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseEther } from "viem";

import { network } from "hardhat";

describe("TipJar", async function () {
  const { viem } = await network.create();

  const publicClient = await viem.getPublicClient();
  const [owner, user] = await viem.getWalletClients();
  if (!owner || !user) {
    throw new Error("Expected owner and user wallet clients");
  }

  it("Should update the contract balance and tip count", async function () {
    const tipJar = await viem.deployContract("TipJar");

    const tipAmount = parseEther("0.1");

    await tipJar.write.tip(["Great work!"], {
      account: user.account,
      value: tipAmount,
    });

    const balance = await publicClient.getBalance({
      address: tipJar.address,
    });

    const tipCount = await tipJar.read.getTipCount();

    assert.equal(balance, tipAmount);
    assert.equal(tipCount, 1n);
  });

  it("Should emit the TipSent event when a user sends a tip", async function () {
    const tipJar = await viem.deployContract("TipJar");

    const tipAmount = parseEther("0.1");
    const message = "Keep building!";

    await viem.assertions.emitWithArgs(
      tipJar.write.tip([message], {
        account: user.account,
        value: tipAmount,
      }),
      tipJar,
      "TipSent",
      [user.account.address, tipAmount, message],
    );
  });

  it("Should prevent a non-owner from withdrawing", async function () {
    const tipJar = await viem.deployContract("TipJar");

    await assert.rejects(
      tipJar.write.withdraw({
        account: user.account,
      }),
    );
  });

  it("Should allow the owner to withdraw the full balance", async function () {
    const tipJar = await viem.deployContract("TipJar");

    const tipAmount = parseEther("0.5");

    await tipJar.write.tip(["Owner withdrawal test"], {
      account: user.account,
      value: tipAmount,
    });

    await viem.assertions.emitWithArgs(
      tipJar.write.withdraw(),
      tipJar,
      "Withdrawn",
      [owner.account.address, tipAmount],
    );

    const balance = await publicClient.getBalance({
      address: tipJar.address,
    });

    assert.equal(balance, 0n);
  });
});
