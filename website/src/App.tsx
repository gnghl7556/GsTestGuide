import { useEffect } from 'react';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Workflow } from './components/Workflow';
import { TechStack } from './components/TechStack';
import { Footer } from './components/Footer';

export default function App() {
  useEffect(() => {
    const revealEls = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    revealEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Hero />
      <Features />
      <Workflow />
      <TechStack />
      <Footer />
    </div>
  );
}
