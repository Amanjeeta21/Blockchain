"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useConfig } from "wagmi";
import { watchAccount } from "wagmi/actions";

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
  const config = useConfig();

  useEffect(
    () =>
      watchAccount(config, {
        onChange(account) {
          setVerifiedAddress((previous) =>
            account.isConnected &&
            account.address?.toLowerCase() === previous.toLowerCase()
              ? previous
              : "",
          );
        },
      }),
    [config],
  );

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
