import Navbar from "@/components/landing/Navbar";
import ScrollExperience from "@/components/landing/ScrollExperience";
import MobileExperience from "@/components/landing/MobileExperience";
import FinalCTA from "@/components/landing/FinalCTA";

export default function LandingPage() {
  return (
    <main id="top" className="relative overflow-x-clip">
      <Navbar />
      {/* Cinematic pinned experience: wide screens with motion allowed. */}
      <div className="hidden cine:block">
        <ScrollExperience />
      </div>
      {/* Stacked experience: phones, tablets in portrait, reduced motion. */}
      <div className="cine:hidden">
        <MobileExperience />
      </div>
      <FinalCTA />
    </main>
  );
}
