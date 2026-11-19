"use client";

import TipForm from "../TipForm";
import TipHistory from "../TipHistory";
import TipList from "../TipList";

export default function TipSection() {
  return (
    <>
      <TipForm />
      <TipList />
      <TipHistory />
    </>
  );
}
