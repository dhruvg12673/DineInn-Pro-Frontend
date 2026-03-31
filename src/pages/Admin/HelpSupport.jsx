import React, { useState } from 'react';
import { 
  Mail, Phone, Clock, 
  ChevronDown, ChevronUp, Search, 
  MessageCircle, Info,
  Youtube, Instagram, Linkedin 
} from 'lucide-react';
import './HelpSupportCard.css';

const HelpSupport = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const faqs = [
    {
      question: "How do I update my menu in real-time?",
      answer: "Navigate to Operations > Menu Editor. You can add dishes, update prices, or toggle items on/off instantly. Changes reflect on the Guest Menu immediately after saving."
    },
    {
      question: "How does the 'Call Waiter' system work?",
      answer: "When a guest clicks 'Call Waiter' on their mobile, an alert is sent to your Admin Panel and logged in the Notification Logs. Ensure your system volume is on for audio alerts."
    },
    {
      question: "Can I manage different restaurant sections?",
      answer: "Yes! Use the Table Manager to create categories like 'AC,' 'Non-AC,' or 'Rooftop.' Each category can house specific tables for better organization."
    },
    {
      question: "How do guests add tips to their bill?",
      answer: "Guests select 'Add Tip' on their landing page, choose a waiter, and enter an amount. This is linked to their active Order ID and appears on your Billing Page automatically."
    },
    {
      question: "Where can I view daily revenue and sales?",
      answer: "Go to Reports > Dashboard. This section provides live analytics, total sales volume, and customer feedback trends."
    },
    {
      question: "What if a table shows 'No Active Order'?",
      answer: "Verify the guest has placed an order. If the issue persists, check the 'Order Manager' to ensure the table session is active and linked to the correct category."
    }
  ];

  const socialLinks = [
    { name: 'YouTube', icon: <Youtube size={20} />, url: 'https://www.youtube.com/channel/UC75zeYtPn7MUJQxKZMyAccA', class: 'yt' },
    { name: 'Instagram', icon: <Instagram size={20} />, url: 'https://www.instagram.com/dineinnpro', class: 'ig' },
    { name: 'LinkedIn', icon: <Linkedin size={20} />, url: 'https://www.linkedin.com/company/dineinnpro', class: 'li' }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="hs-pleasant-container">
      <header className="hs-pleasant-header">
        <div className="hs-pleasant-header-content">
          <div className="hs-status-pill">
            <span className="hs-dot-pulse"></span> System Online
          </div>
          <h1>Help & Support</h1>
          <p>We're here to help you get the most out of DineInnPro™</p>
          
          <div className="hs-search-wrapper">
            <Search className="hs-search-icon" size={20} />
            <input 
              type="text" 
              placeholder="Search for help (billing, menu, tables...)" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="hs-pleasant-wrapper">
        <div className="hs-main-layout">
          <section className="hs-faq-section">
            <h2 className="hs-section-title">Common Questions</h2>
            <div className="hs-accordion">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, index) => (
                  <div 
                    key={index} 
                    className={`hs-accordion-item ${activeIndex === index ? 'active' : ''}`}
                    onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                  >
                    <div className="hs-accordion-header">
                      <span>{faq.question}</span>
                      {activeIndex === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                    {activeIndex === index && (
                      <div className="hs-accordion-content">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="hs-no-results">No matches found for your search.</div>
              )}
            </div>
          </section>

          <aside className="hs-contact-sidebar">
            <div className="hs-contact-box">
              <div className="hs-box-icon"><Phone size={20} /></div>
              <div className="hs-box-text">
                <span className="hs-box-label">Call Support</span>
                <span className="hs-box-value">+91 9324175216</span>
              </div>
            </div>

            <div className="hs-contact-box">
              <div className="hs-box-icon"><Mail size={20} /></div>
              <div className="hs-box-text">
                <span className="hs-box-label">Email Us</span>
                <span className="hs-box-value">dineinnpro@gmail.com</span>
              </div>
            </div>

            <div className="hs-social-section">
              <span className="hs-social-title">Follow Our Community</span>
              <div className="hs-social-grid">
                {socialLinks.map((social) => (
                  <a 
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`hs-social-btn ${social.class}`}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            
          </aside>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;