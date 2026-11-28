import { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { CustomerAuthProvider } from './context/CustomerAuthContext';
import { CustomerDataProvider } from './context/CustomerDataContext';
import { SmartEnquiryProvider } from './context/SmartEnquiryContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import PageTransition from './components/layout/PageTransition';
import ScrollToTop from './components/layout/ScrollToTop';
import WhatsAppFloat from './components/ui/WhatsAppFloat';
import CartDrawer from './components/ui/CartDrawer';
import AiRiderAssistant from './components/assistant/AiRiderAssistant';

const CinematicIntro = lazy(() => import('./components/intro/CinematicIntro'));
const HomePage = lazy(() => import('./pages/HomePage'));
const ShowroomPage = lazy(() => import('./pages/ShowroomPage'));
const HelmetDetailPage = lazy(() => import('./pages/HelmetDetailPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const HelmetFinderPage = lazy(() => import('./pages/HelmetFinderPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const INTRO_STORAGE_KEY = 'biker_cafe_intro_seen';

function RouteFallback() {
  return (
    <div
      style={{
        minHeight: '55vh',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--silver-muted)',
      }}
    >
      Loading Showroom View...
    </div>
  );
}

function AnimatedRoutes({ introActive }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <Suspense fallback={<RouteFallback />}>
                <HomePage introActive={introActive} />
              </Suspense>
            </PageTransition>
          }
        />
        <Route
          path="/showroom"
          element={
            <PageTransition>
              <Suspense fallback={<RouteFallback />}>
                <ShowroomPage />
              </Suspense>
            </PageTransition>
          }
        />
        <Route
          path="/showroom/:id"
          element={
            <PageTransition>
              <Suspense fallback={<RouteFallback />}>
                <HelmetDetailPage />
              </Suspense>
            </PageTransition>
          }
        />
        <Route
          path="/about"
          element={
            <PageTransition>
              <Suspense fallback={<RouteFallback />}>
                <AboutPage />
              </Suspense>
            </PageTransition>
          }
        />
        <Route
          path="/contact"
          element={
            <PageTransition>
              <Suspense fallback={<RouteFallback />}>
                <ContactPage />
              </Suspense>
            </PageTransition>
          }
        />
        <Route
          path="/wishlist"
          element={
            <PageTransition>
              <Suspense fallback={<RouteFallback />}>
                <WishlistPage />
              </Suspense>
            </PageTransition>
          }
        />
        <Route
          path="/helmet-finder"
          element={
            <PageTransition>
              <Suspense fallback={<RouteFallback />}>
                <HelmetFinderPage />
              </Suspense>
            </PageTransition>
          }
        />
        <Route
          path="/cart"
          element={
            <PageTransition>
              <Suspense fallback={<RouteFallback />}>
                <CartPage />
              </Suspense>
            </PageTransition>
          }
        />
        <Route
          path="/checkout"
          element={
            <PageTransition>
              <Suspense fallback={<RouteFallback />}>
                <CheckoutPage />
              </Suspense>
            </PageTransition>
          }
        />
        <Route
          path="/community"
          element={
            <PageTransition>
              <Suspense fallback={<RouteFallback />}>
                <CommunityPage />
              </Suspense>
            </PageTransition>
          }
        />
        <Route
          path="/compare"
          element={
            <PageTransition>
              <Suspense fallback={<RouteFallback />}>
                <ComparePage />
              </Suspense>
            </PageTransition>
          }
        />
        <Route
          path="/profile"
          element={
            <PageTransition>
              <Suspense fallback={<RouteFallback />}>
                <ProfilePage />
              </Suspense>
            </PageTransition>
          }
        />
        <Route
          path="/admin"
          element={
            <PageTransition>
              <Suspense fallback={<RouteFallback />}>
                <AdminPage />
              </Suspense>
            </PageTransition>
          }
        />
        <Route
          path="*"
          element={
            <PageTransition>
              <Suspense fallback={<RouteFallback />}>
                <NotFoundPage />
              </Suspense>
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return !sessionStorage.getItem(INTRO_STORAGE_KEY);
    } catch {
      return true;
    }
  });

  const handleIntroComplete = () => {
    try {
      sessionStorage.setItem(INTRO_STORAGE_KEY, '1');
    } catch {
      // Ignore storage errors in restricted contexts
    }
    setShowIntro(false);
  };

  return (
    <ThemeProvider>
      <CustomerAuthProvider>
        <CustomerDataProvider>
          <SmartEnquiryProvider>
            <CartProvider>
              <MotionConfig reducedMotion="user">
                <BrowserRouter>
                  <ScrollToTop />
                  {showIntro && (
                    <Suspense
                      fallback={
                        <div
                          style={{ position: 'fixed', inset: 0, zIndex: 120, background: '#000000' }}
                          aria-hidden="true"
                        />
                      }
                    >
                      <CinematicIntro onComplete={handleIntroComplete} />
                    </Suspense>
                  )}

                  <div className="app-shell">
                    {/* Skip-to-main keyboard navigation link */}
                    <a href="#main-content" className="skip-to-main">Skip to main content</a>
                    <Navbar />
                    <main id="main-content">
                      <AnimatedRoutes introActive={showIntro} />
                    </main>
                    <Footer />
                    {!showIntro && (
                      <>
                        <WhatsAppFloat />
                        <AiRiderAssistant />
                      </>
                    )}
                    <CartDrawer />
                  </div>
                </BrowserRouter>
              </MotionConfig>
            </CartProvider>
          </SmartEnquiryProvider>
        </CustomerDataProvider>
      </CustomerAuthProvider>
    </ThemeProvider>
  );
}
