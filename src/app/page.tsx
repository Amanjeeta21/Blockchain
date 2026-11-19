import BottomNote from "../components/layout/BottomNote";
import Footer from "../components/layout/Footer";
import Hero from "../components/layout/Hero";
import Navbar from "../components/layout/Navbar";
import NetworkStatus from "../components/dashboard/NetworkStatus";
import WalletOverview from "../components/dashboard/WalletOverview";
import TipSection from "../components/sections/TipSection";
import TokenSection from "../components/sections/TokenSection";

export default function Home() {
  return (
    <main className="page">
      <Navbar />
      <Hero />

      <section className="dashboard">
        <WalletOverview />
        <NetworkStatus />
      </section>

      <TokenSection />
      <TipSection />
      <BottomNote />
      <Footer />
    </main>
  );
}
