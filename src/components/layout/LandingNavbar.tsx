"use client";

import Link from "next/link";

import SignInButton from "../SignInButton";

export default function LandingNavbar() {
  return (
    <header className="navbar landing-navbar">
      <Link href="/" className="brand" aria-label="TipJar home">
        <span className="brand-icon">T</span>
        <span className="brand-name">
          TIPJAR<span className="brand-dot">.</span>
        </span>
      </Link>

      <SignInButton />
    </header>
  );
}
