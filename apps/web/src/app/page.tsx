import { HeroSection } from '@/components/Landing/HeroSection';
import { FeaturesSection } from '@/components/Landing/FeaturesSection';
import { CTASection } from '@/components/Landing/CTASection';
import { Footer } from '@/components/Landing/Footer';

/**
 * Landing page for NCLEX 311 featuring hero section, features,
 * call-to-action, and footer.
 */
export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </>
  );
}
