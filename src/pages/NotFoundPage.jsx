import { ArrowLeft, Compass } from 'lucide-react';
import PageSeo from '../components/seo/PageSeo';
import MagneticButton from '../components/ui/MagneticButton';
import './NotFoundPage.css';

export default function NotFoundPage() {
  return (
    <div className="not-found-page">
      <PageSeo
        title="Page Not Found | BIKER CAFE — ARNI"
        description="The requested page could not be found on the BIKER CAFE Arni website."
        robots="noindex, nofollow"
      />

      <section className="container section-pad not-found-card">
        <span className="eyebrow">404 // Route Not Found</span>
        <h1 className="not-found-card__title">
          ROUTE <span className="metallic-text">UNAVAILABLE</span>
        </h1>
        <p className="not-found-card__copy">
          The page you requested does not exist. Return to the BIKER CAFE Arni homepage or explore
          our AXOR helmet showroom.
        </p>
        <div className="not-found-card__actions">
          <MagneticButton to="/" variant="primary" icon={ArrowLeft}>
            Back to Home
          </MagneticButton>
          <MagneticButton to="/showroom" variant="silver" icon={Compass}>
            Explore Showroom
          </MagneticButton>
        </div>
      </section>
    </div>
  );
}
