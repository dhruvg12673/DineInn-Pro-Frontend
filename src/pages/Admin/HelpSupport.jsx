// HelpSupportCard.jsx
import React from 'react';
import { 
  HelpCircle, 
  Mail, 
  Phone, 
  MessageCircle, 
  FileText, 
  Clock,
  Facebook,
  Instagram,
  Twitter,
  Send,
  Headphones
} from 'lucide-react';
import './HelpSupportCard.css';

const HelpSupportCard = () => {
  const faqs = [
    {
      question: "How can I place an order?",
      answer: "Simply browse our products, add items to your cart, and proceed to checkout. Follow the step-by-step process to complete your purchase."
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept all major credit cards, PayPal, Apple Pay, Google Pay, and bank transfers for your convenience."
    },
    {
      question: "How do I track my order?",
      answer: "Once your order ships, you'll receive a tracking number via email. Use this number on our tracking page or the carrier's website."
    },
    {
      question: "How can I cancel my order?",
      answer: "Orders can be cancelled within 1 hour of placement. Contact our support team immediately for assistance with cancellations."
    },
    {
      question: "What if I have an issue with my order?",
      answer: "Contact our support team right away. We're committed to resolving any issues quickly and ensuring your satisfaction."
    }
  ];

  const handleLiveChat = () => {
    // Placeholder for live chat functionality
    alert('Live chat would open here');
  };

  const handleSupportTicket = () => {
    // Placeholder for support ticket submission
    alert('Support ticket form would open here');
  };

  return (
    <div className="hsc-help-support-card">
      <div className="hsc-card-header">
        <h1 className="hsc-card-title">Help & Support</h1>
        <p className="hsc-card-subtitle">We're here to help! Your satisfaction is our priority.</p>
      </div>
      
      <div className="hsc-card-content">
        <div className="hsc-faqs-section">
          <h2 className="hsc-section-title">
            <HelpCircle className="hsc-section-icon" />
            Frequently Asked Questions
          </h2>
          
          <div className="hsc-faqs-list">
            {faqs.map((faq, index) => (
              <div key={index} className="hsc-faq-item">
                <h3 className="hsc-faq-question">{faq.question}</h3>
                <p className="hsc-faq-answer">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="hsc-contact-section">
          <h2 className="hsc-section-title">
            <Headphones className="hsc-section-icon" />
            Contact Us
          </h2>
          
          <div className="hsc-contact-info">
            <div className="hsc-contact-item">
              <Mail className="hsc-contact-icon" />
              <p className="hsc-contact-text">
                <a href="mailto:support@example.com" className="hsc-contact-link">
                  support@example.com
                </a>
              </p>
            </div>
            
            <div className="hsc-contact-item">
              <Phone className="hsc-contact-icon" />
              <p className="hsc-contact-text">
                <a href="tel:+18001234567" className="hsc-contact-link">
                  +1-800-123-4567
                </a>
              </p>
            </div>
          </div>
          
          <div className="hsc-operating-hours">
            <h4>Operating Hours</h4>
            <p>Monday - Friday: 9:00 AM - 5:00 PM EST<br />
               Saturday - Sunday: 10:00 AM - 2:00 PM EST</p>
          </div>
          
          <div className="hsc-action-buttons">
            <button 
              className="hsc-btn hsc-btn-primary"
              onClick={handleLiveChat}
            >
              <MessageCircle className="hsc-btn-icon" />
              Start Live Chat
            </button>
            
            <button 
              className="hsc-btn hsc-btn-secondary"
              onClick={handleSupportTicket}
            >
              <FileText className="hsc-btn-icon" />
              Submit Support Ticket
            </button>
          </div>
          
          <div className="hsc-social-media">
            <h4 className="hsc-social-title">Follow Us</h4>
            <div className="hsc-social-links">
              <a 
                href="https://facebook.com/example" 
                className="hsc-social-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <Facebook className="hsc-social-icon" />
              </a>
              
              <a 
                href="https://www.instagram.com/dineinnpro/" 
                className="hsc-social-link"
                target="https://www.instagram.com/dineinnpro/"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <Instagram className="hsc-social-icon" />
              </a>
              
              <a 
                href="https://twitter.com/example" 
                className="hsc-social-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
              >
                <Twitter className="hsc-social-icon" />
              </a>
            </div>
          </div>
          
          <div className="hsc-helpful-tip">
            <p className="hsc-tip-text">
              💡 Need immediate help? Try our live chat for the fastest response!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupportCard;