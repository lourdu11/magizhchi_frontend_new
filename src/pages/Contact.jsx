import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { adminService } from '../services';
import { useQuery } from '@tanstack/react-query';

export default function Contact() {
  const { data: settings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => adminService.getPublicSettings().then(r => r.data.data),
  });

  const store = settings?.store || {
    name: 'Magizhchi Garments',
    email: 'info@magizhchigarments.com',
    phone: '+91 73588 85452',
    address: 'Old Bus Stand, Thanjavur, Tamil Nadu — 613001',
    gstin: '33AAAAA0000A1Z5'
  };
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/contact', form);
      toast.success('Message sent! We\'ll get back to you within 24 hours.');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch {
      toast.error('Failed to send message. Please try WhatsApp or call us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-custom py-16">
      <Helmet>
        <title>Contact Us — Magizhchi Garments</title>
        <meta name="description" content="Get in touch with Magizhchi Garments. Visit our store, call us, or send a WhatsApp message." />
      </Helmet>

      <div className="text-center mb-12">
        <span className="text-xs font-bold tracking-widest text-premium-gold uppercase">Get In Touch</span>
        <h1 className="text-4xl font-bold text-text-primary mt-3 mb-4">We'd Love to Hear From You</h1>
        <p className="text-text-muted max-w-xl mx-auto">Have a question about sizing, orders, or anything else? Our team is happy to help.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
        {/* Contact Info */}
        <div className="space-y-6">
          <div className="bg-dark-gradient rounded-2xl p-4 md:p-8 text-white">
            <h2 className="text-xl font-bold text-premium-gold mb-6">Contact Information</h2>
            <div className="space-y-5">
              <a href={`tel:${store.phone.replace(/ /g, '')}`} className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-premium-gold/20 transition-colors">
                  <Phone size={18} className="text-premium-gold" />
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wider">Phone</p>
                  <p className="font-semibold text-white">{store.phone}</p>
                </div>
              </a>
              <a href={`mailto:${store.email}`} className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-premium-gold/20 transition-colors">
                  <Mail size={18} className="text-premium-gold" />
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wider">Email</p>
                  <p className="font-semibold text-white">{store.email}</p>
                </div>
              </a>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-premium-gold" />
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wider">Store Address</p>
                  <p className="font-semibold text-white">{store.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Clock size={18} className="text-premium-gold" />
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wider">Business Hours</p>
                  <p className="font-semibold text-white">Mon–Sun: 10:00 AM – 10:00 PM</p>
                  <p className="text-white/70 text-sm">Open all days including holidays</p>
                </div>
              </div>
            </div>

            <a
              href={`https://wa.me/${store.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 w-full flex items-center justify-center gap-3 bg-[#25D366] text-white py-3.5 px-4 sm:px-6 rounded-xl font-bold hover:bg-[#20BA5A] transition-colors"
            >
              <MessageCircle size={20} /> Chat on WhatsApp
            </a>
          </div>

          {/* Google Map Embed */}
          <div className="rounded-2xl overflow-hidden border border-border-light h-56">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7838.588253102026!2d79.13423255869142!3d10.7887700254237!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3baac70e16ccd65b%3A0xbfd89796d717efe9!2sMagizhchi%20garments!5e0!3m2!1sen!2sin!4v1777091157070!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Magizhchi Garments Location"
            />
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-2xl border border-border-light p-4 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-text-primary mb-6">Send Us a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-bold text-text-muted uppercase mb-1 block">Your Name</span>
                <input required className="w-full bg-light-bg border border-border-light rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-premium-gold" placeholder="Ravi Kumar" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-text-muted uppercase mb-1 block">Phone</span>
                <input type="tel" className="w-full bg-light-bg border border-border-light rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-premium-gold" placeholder="+91 9XXXXXXXXX" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-bold text-text-muted uppercase mb-1 block">Email</span>
              <input required type="email" className="w-full bg-light-bg border border-border-light rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-premium-gold" placeholder="your@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-text-muted uppercase mb-1 block">Subject</span>
              <select className="w-full bg-light-bg border border-border-light rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-premium-gold" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}>
                <option value="">Select a subject</option>
                <option>Order Inquiry</option>
                <option>Return / Exchange</option>
                <option>Product Question</option>
                <option>Bulk Order / Wholesale</option>
                <option>Other</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-text-muted uppercase mb-1 block">Message</span>
              <textarea required rows="5" className="w-full bg-light-bg border border-border-light rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-premium-gold resize-none" placeholder="Tell us how we can help you..." value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
            </label>
            <button type="submit" disabled={submitting} className="w-full btn-dark py-3.5 flex items-center justify-center gap-2 text-base">
              {submitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Send Message</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
