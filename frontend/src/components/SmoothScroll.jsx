import { useEffect } from 'react';
import Lenis from 'lenis';
import { useLocation } from 'react-router-dom';

const SmoothScroll = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smoothHover: true,
      smoothWheel: true,
    });

    // Reset scroll position on route change
    lenis.scrollTo(0, { immediate: true });

    const handleScroll = (time) => {
      lenis.raf(time);
      requestAnimationFrame(handleScroll);
    };
    requestAnimationFrame(handleScroll);

    return () => {
      lenis.destroy();
    };
  }, [location.pathname]);

  return children;
};

export default SmoothScroll;
