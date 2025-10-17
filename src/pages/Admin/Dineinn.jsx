import React from 'react';
import './aboutus.css';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  QrCode, 
  MenuSquare, 
  CreditCard, 
  ChefHat, 
  Car, 
  Package, 
  Users, 
  BarChart3, 
  MessageSquare, 
  Megaphone, 
  Shield, 
  UserCheck, 
  Wifi, 
  Bell, 
  Monitor,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Check,
  Star
} from 'lucide-react';

const AboutUs = () => {
  const features = [
    { icon: QrCode, title: "Table-side QR Ordering", description: "Contactless ordering experience for customers" },
    { icon: MenuSquare, title: "Digital Menu Management", description: "Easy-to-update digital menus with rich media" },
    { icon: CreditCard, title: "POS & Billing System", description: "Comprehensive point-of-sale and billing solution" },
    { icon: ChefHat, title: "Kitchen Order Management", description: "Streamlined kitchen operations and order tracking" },
    { icon: Car, title: "Valet Parking Tracker", description: "Efficient valet service management system" },
    { icon: Package, title: "Inventory & Stock Alerts", description: "Real-time inventory tracking and low-stock alerts" },
    { icon: Users, title: "Staff & Attendance Module", description: "Complete staff management and attendance tracking" },
    { icon: BarChart3, title: "Real-time Analytics Dashboard", description: "Comprehensive business insights and reporting" },
    { icon: MessageSquare, title: "Customer Feedback & Ratings", description: "Collect and manage customer reviews and ratings" },
    { icon: Megaphone, title: "Polls and Announcements", description: "Admin tools for customer engagement" },
    { icon: Shield, title: "Secure Login & Access Control", description: "Enterprise-grade security and authentication" },
    { icon: UserCheck, title: "Multi-user Role Permissions", description: "Granular access control for different staff roles" },
    { icon: Wifi, title: "Offline Capability", description: "Continuous operations even without internet" },
    { icon: Bell, title: "WhatsApp/Email Notifications", description: "Automated customer and staff notifications" },
    { icon: Monitor, title: "Cross-platform Support", description: "Works seamlessly on mobile and desktop" }
  ];

  const plans = [
    {
      name: "Starter Plan",
      price: "₹499",
      period: "/month",
      features: ["QR Ordering", "Digital Menu", "Basic POS", "Customer Support", "Mobile App Access"],
      popular: false
    },
    {
      name: "Business Plan",
      price: "₹1,499",
      period: "/month",
      features: ["All Starter Features", "Analytics Dashboard", "Staff Attendance", "Inventory Management", "Kitchen Management", "Email Support"],
      popular: true
    },
    {
      name: "Enterprise Plan",
      price: "₹2,999",
      period: "/month",
      features: ["All Business Features", "Custom Integrations", "24x7 Priority Support", "Advanced Analytics", "Multi-location Support", "Dedicated Account Manager"],
      popular: false
    }
  ];

  const socialLinks = [
    { icon: Facebook, url: "#", name: "Facebook" },
    { icon: Instagram, url: "#", name: "Instagram" },
    { icon: Twitter, url: "#", name: "Twitter" },
    { icon: Linkedin, url: "#", name: "LinkedIn" },
    { icon: Youtube, url: "#", name: "YouTube" }
  ];

  return (
    <div className="dineinn-about">
      {/* Hero Section */}
      <section className="dineinn-hero">
        <div className="dineinn-container">
          <div className="dineinn-hero-content">
            <div className="dineinn-logo">
              <div className="dineinn-logo-icon">
                <ChefHat size={48} />
              </div>
              <h1 className="dineinn-company-name">DineInnPro</h1>
            </div>
            <p className="dineinn-tagline">Empowering Restaurants with Smart, Seamless, and Scalable Technology</p>
            <div className="dineinn-hero-description">
              <p>
                At DineInnPro, we believe that technology should enhance the dining experience, not complicate it. 
                Our mission is to provide restaurants with cutting-edge SaaS solutions that streamline operations, 
                boost efficiency, and create memorable experiences for both staff and customers.
              </p>
              <p>
                Founded with the vision of transforming the restaurant industry through innovation, we are committed 
                to delivering solutions that grow with your business and adapt to the ever-changing hospitality landscape.
              </p>
            </div>
            <div className="dineinn-company-info">
              <div className="dineinn-info-item">
                <strong>Founded:</strong> 2023
              </div>
              <div className="dineinn-info-item">
                <strong>Founders:</strong> Dhruv Gothi
              </div>
              <div className="dineinn-info-item">
                <strong>Headquarters:</strong> Mumbai, Maharashtra, India
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="dineinn-features">
        <div className="dineinn-container">
          <h2 className="dineinn-section-title">Our Features</h2>
          <p className="dineinn-section-subtitle">Comprehensive solutions designed for modern restaurants</p>
          <div className="dineinn-features-grid">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="dineinn-feature-card">
                  <div className="dineinn-feature-icon">
                    <IconComponent size={32} />
                  </div>
                  <h3 className="dineinn-feature-title">{feature.title}</h3>
                  <p className="dineinn-feature-description">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="dineinn-pricing">
        <div className="dineinn-container">
          <h2 className="dineinn-section-title">Our Plans & Pricing</h2>
          <p className="dineinn-section-subtitle">Choose the perfect plan for your restaurant</p>
          <div className="dineinn-pricing-grid">
            {plans.map((plan, index) => (
              <div key={index} className={`dineinn-pricing-card ${plan.popular ? 'dineinn-popular' : ''}`}>
                {plan.popular && <div className="dineinn-popular-badge">Most Popular</div>}
                <h3 className="dineinn-plan-name">{plan.name}</h3>
                <div className="dineinn-plan-price">
                  <span className="dineinn-price">{plan.price}</span>
                  <span className="dineinn-period">{plan.period}</span>
                </div>
                <ul className="dineinn-plan-features">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="dineinn-plan-feature">
                      <Check size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className="dineinn-plan-button">
                  {plan.popular ? 'Start Free Trial' : 'Subscribe Now'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="dineinn-contact">
        <div className="dineinn-container">
          <h2 className="dineinn-section-title">Contact Us</h2>
          <p className="dineinn-section-subtitle">Get in touch with our team</p>
          <div className="dineinn-contact-content">
            <div className="dineinn-contact-info">
              <div className="dineinn-contact-item">
                <Mail size={24} />
                <div>
                  <h4>Email</h4>
                  <p>support@dineinnpro.com</p>
                </div>
              </div>
              <div className="dineinn-contact-item">
                <Phone size={24} />
                <div>
                  <h4>Phone</h4>
                  <p>+91 98765 43210</p>
                </div>
              </div>
              <div className="dineinn-contact-item">
                <MapPin size={24} />
                <div>
                  <h4>Address</h4>
                  <p>123 Business Park, Andheri East<br />Mumbai, Maharashtra 400069</p>
                </div>
              </div>
              <div className="dineinn-contact-item">
                <Clock size={24} />
                <div>
                  <h4>Support Hours</h4>
                  <p>Mon–Sat: 9AM–8PM<br />Sunday: Closed</p>
                </div>
              </div>
            </div>
            <div className="dineinn-contact-form">
              <h3>Send us a message</h3>
              <div className="dineinn-form-container">
                <div className="dineinn-form-group">
                  <input type="text" placeholder="Your Name" className="dineinn-form-input" />
                </div>
                <div className="dineinn-form-group">
                  <input type="email" placeholder="Your Email" className="dineinn-form-input" />
                </div>
                <div className="dineinn-form-group">
                  <textarea placeholder="Your Message" rows="5" className="dineinn-form-textarea"></textarea>
                </div>
                <button className="dineinn-form-button">Send Message</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media Section */}
      <section className="dineinn-social">
        <div className="dineinn-container">
          <h2 className="dineinn-section-title">Connect With Us</h2>
          <p className="dineinn-section-subtitle">Follow us on social media for updates and news</p>
          <div className="dineinn-social-links">
            {socialLinks.map((social, index) => {
              const IconComponent = social.icon;
              return (
                <a key={index} href={social.url} className="dineinn-social-link" aria-label={social.name}>
                  <IconComponent size={24} />
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="dineinn-footer">
        <div className="dineinn-container">
          <div className="dineinn-footer-content">
            <div className="dineinn-footer-logo">
              <ChefHat size={32} />
              <span>DineInnPro</span>
            </div>
            <p>&copy; 2024 DineInnPro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;