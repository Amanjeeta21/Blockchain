
import BottomNote from "../components/layout/BottomNote";
import Footer from "../components/layout/Footer";
import Hero from "../components/layout/Hero";
import Navbar from "../components/layout/Navbar";
import NetworkStatus from "../components/dashboard/NetworkStatus";
import WalletOverview from "../components/dashboard/WalletOverview";
import TipSection from "../components/sections/TipSection";
import TokenSection from "../components/sections/TokenSection";
import TipHistory from "../components/TipHistory";

export default function Home() {
  return (
    <main className="page">
      <Navbar />

      <section className="hero-section">
        <Hero />

        <div className="hero-dashboard">
          <WalletOverview />
          <NetworkStatus />
        </div>
      </section>

      <section className="action-section">
        <div className="action-grid">
          <TokenSection />
          <TipSection />
        </div>
      </section>

      <TipHistory />

      <BottomNote />
      <Footer />
    </main>
  );
}
