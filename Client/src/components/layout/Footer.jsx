import { Link } from 'react-router-dom';
import { ChevronRight, Instagram, Linkedin, Mail, MessageCircle, Twitter } from 'lucide-react';

// Shared reusable Footer — rendered once by PublicLayout, so every public
// page (Home, Events, Schedule, About, Feedback, Login, etc.) automatically
// sits above the single page-wide LiquidEther background rendered by
// PublicLayout. Do not add a per-section LiquidBackground here.
export function Footer() {
  return (
    <footer className="glass-footer eventsphere-footer">
      <div className="container eventsphere-footer__inner">
        <div className="eventsphere-footer__grid">
          <div className="eventsphere-footer__brand">
            <Link to="/" className="eventsphere-footer__logo"><img src="/logo.jpg" alt="" /><span><b>Event</b>Sphere</span></Link>
            <p>Discover expos, connect with exhibitors, and run the floor from one beautiful console.</p>
            <a href="mailto:hello@eventsphere.com" className="eventsphere-footer__email"><Mail size={15} /> hello@eventsphere.com</a>
          </div>
          <div>
            <h3>Explore</h3>
            <Link to="/events">Events <ChevronRight size={14} /></Link>
            <Link to="/schedule">Sessions <ChevronRight size={14} /></Link>
            <Link to="/about">About EventSphere <ChevronRight size={14} /></Link>
          </div>
          <div>
            <h3>Account</h3>
            <Link to="/login">Sign in <ChevronRight size={14} /></Link>
            <Link to="/register">Create account <ChevronRight size={14} /></Link>
            <Link to="/profile">Your profile <ChevronRight size={14} /></Link>
          </div>
          <div className="eventsphere-footer__connect">
            <h3>Stay connected</h3>
            <p>Get closer to the experiences that matter.</p>
            <div className="eventsphere-footer__socials">
              <a href="https://instagram.com" aria-label="Instagram"><Instagram size={16} /></a>
              <a href="https://linkedin.com" aria-label="LinkedIn"><Linkedin size={16} /></a>
              <a href="https://twitter.com" aria-label="Twitter"><Twitter size={16} /></a>
              <Link to="/feedback" aria-label="Feedback"><MessageCircle size={16} /></Link>
            </div>
          </div>
        </div>
      </div>
      <div className="eventsphere-footer__bottom">
        <div className="container"><span>© {new Date().getFullYear()} EventSphere</span><span>Built for meaningful connections.</span><span>Privacy · Terms</span></div>
      </div>
    </footer>
  );
}
