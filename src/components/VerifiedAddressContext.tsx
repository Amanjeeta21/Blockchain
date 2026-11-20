"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

type VerifiedAddressContextValue = {
  verifiedAddress: string;
  setVerifiedAddress: Dispatch<SetStateAction<string>>;
};

const VerifiedAddressContext =
  createContext<VerifiedAddressContextValue | null>(null);

export function VerifiedAddressProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [verifiedAddress, setVerifiedAddress] = useState("");

  return (
    <VerifiedAddressContext.Provider
      value={{ verifiedAddress, setVerifiedAddress }}
    >
      {children}
    </VerifiedAddressContext.Provider>
  );
}

export function useVerifiedAddress() {
  const context = useContext(VerifiedAddressContext);

  if (!context) {
    throw new Error(
      "useVerifiedAddress must be used within VerifiedAddressProvider.",
    );
  }

  return context;
}
