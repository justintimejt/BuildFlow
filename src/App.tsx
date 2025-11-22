import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { CanvasPage } from './pages/CanvasPage';
import { LoadingAnimation } from './components/ui/loading-animation';
import { NavigationProvider, useNavigationContext } from './contexts/NavigationContext';

function AppRoutes() {
  const location = useLocation();
  const { isNavigating, setIsNavigating } = useNavigationContext();

  useEffect(() => {
    if (isNavigating) {
      const timer = setTimeout(() => {
        setIsNavigating(false);
      }, 1000); // Show loading for 1 second

      return () => clearTimeout(timer);
    }
  }, [location.pathname, isNavigating, setIsNavigating]);

  return (
    <>
      <AnimatePresence mode="wait">
        {isNavigating ? (
          <LoadingAnimation key="loading" />
        ) : (
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/canvas" element={<CanvasPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </AnimatePresence>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <NavigationProvider>
        <AppRoutes />
      </NavigationProvider>
    </BrowserRouter>
  );
}

export default App;

