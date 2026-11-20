import Link from "next/link";

import LandingNavbar from "../components/layout/LandingNavbar";
import SignInButton from "../components/SignInButton";

const features = [
  {
    number: "01",
    title: "Ethereum-based",
    description:
      "Send ETH directly from your wallet on the Sepolia test network.",
  },
  {
    number: "02",
    title: "On-chain transparency",
    description:
      "Tips and their messages are recorded on-chain and can be verified.",
  },
  {
    number: "03",
    title: "Tips with a message",
    description:
      "Pair an ETH tip with a personal note to make your support more meaningful.",
  },
];

export default function Home() {
  return (
    <main className="landing-page">
      <LandingNavbar />

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow">
            <span className="landing-eyebrow-dot" />
            A SIMPLE WAY TO SUPPORT
          </p>
          <h1>
            Good ideas
            <br />
            deserve a <span>tip.</span>
          </h1>
          <p className="landing-description">
            TipJar makes it easy to send ETH tips with a personal message.
            Every tip is recorded on-chain, so your support stays transparent.
          </p>
          <div className="landing-actions">
            <SignInButton variant="primary" />
            <span className="landing-action-note">
              Verify your wallet to get started
            </span>
          </div>
          <p className="landing-gas-note">
            SIWE sign-in is a message signature, not a transaction. No gas
            required.
          </p>
        </div>

        <aside className="landing-preview" aria-label="How TipJar works">
          <div className="landing-preview-top">
            <span className="landing-preview-label">A TIP, ON-CHAIN</span>
            <span className="landing-preview-network">
              <span className="landing-eyebrow-dot" />
              SEPOLIA
            </span>
          </div>
          <div className="landing-preview-amount">0.05 ETH</div>
          <p className="landing-preview-message">
            “Thanks for making something worth supporting.”
          </p>
          <div className="landing-preview-divider" />
          <div className="landing-preview-footer">
            <span>MESSAGE INCLUDED</span>
            <span>PUBLICLY VERIFIABLE</span>
          </div>
          <div className="landing-preview-hash">
            <span className="landing-preview-hash-dot" />
            RECORDED ON ETHEREUM
          </div>
        </aside>
      </section>

      <section className="landing-how" aria-labelledby="landing-how-title">
        <div className="landing-section-heading">
          <div>
            <p className="landing-eyebrow">BUILT FOR OPEN SUPPORT</p>
            <h2 id="landing-how-title">A little support goes a long way.</h2>
          </div>
          <p>
            Sign in with your wallet, connect when you’re ready, and send a
            message with your tip.
          </p>
        </div>

        <div className="landing-features">
          {features.map((feature) => (
            <article className="landing-feature" key={feature.number}>
              <span className="landing-feature-number">{feature.number}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <Link href="/" className="landing-footer-brand">
          TIPJAR<span>.</span>
        </Link>
        <span>Built on Ethereum · Sepolia test network</span>
      </footer>
    </main>
  );
}
