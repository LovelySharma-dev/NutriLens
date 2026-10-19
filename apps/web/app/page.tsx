import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ProblemSection from './components/ProblemSection';
import PipelineSection from './components/PipelineSection';
import FooterSection from './components/FooterSection';

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#07080d] text-slate-100">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <PipelineSection />
      <FooterSection />
    </main>
  );
}
