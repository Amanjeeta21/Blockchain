"use client";

import ApproveTokens from "../ApproveTokens";
import SendTokens from "../SendTokens";
import TokenBalance from "../TokenBalance";
import TransferFrom from "../TransferFrom";

export default function TokenSection() {
  return (
    <>
      <TokenBalance />
      <SendTokens />
      <ApproveTokens />
      <TransferFrom />
    </>
  );
}
