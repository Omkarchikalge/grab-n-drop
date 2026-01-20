import Navbar from '@/components/layout/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import TechStackSection from '@/components/landing/TechStackSection';
import FooterSection from '@/components/landing/FooterSection';
import ParticleField from '@/components/3d/ParticleField';

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* 3D Particle background */}
      <ParticleField />
      
      {/* Navigation */}
      <Navbar />
      
      {/* Main content */}
      <main>
        <HeroSection />
        <HowItWorksSection />
        <TechStackSection />
      </main>
      
      {/* Footer */}
      <FooterSection />
    </div>
  );
};

export default Index;
