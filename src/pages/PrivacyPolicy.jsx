import { Helmet } from 'react-helmet-async';

export default function PrivacyPolicy() {
  return (
    <div className="container-custom py-16 max-w-4xl mx-auto">
      <Helmet>
        <title>Privacy Policy — Magizhchi Garments</title>
      </Helmet>

      <h1 className="text-4xl font-bold text-text-primary mb-8">Privacy Policy</h1>
      
      <div className="prose prose-slate max-w-none space-y-6 text-text-muted leading-relaxed">
        <p>Last Updated: April 28, 2026</p>

        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-3">1. Information Collection</h2>
          <p>We collect information from you when you register on our site, place an order, or subscribe to our newsletter. The data collected includes your name, email address, mailing address, and phone number.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-3">2. Data Usage</h2>
          <p>Any of the information we collect from you may be used in one of the following ways:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>To personalize your experience and better respond to your individual needs.</li>
            <li>To improve our website based on the feedback we receive from you.</li>
            <li>To process transactions quickly and securely.</li>
            <li>To send periodic emails regarding your order or other products and services.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-3">3. Payment Security</h2>
          <p>We do not store your credit card or payment information on our servers. All payments are processed through <strong>Razorpay</strong>, a secure and encrypted payment gateway that complies with PCI-DSS standards.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-3">4. Cookies</h2>
          <p>We use cookies to help us remember and process the items in your shopping cart and understand your preferences for future visits.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-3">5. Disclosure to Third Parties</h2>
          <p>We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted third parties who assist us in operating our website, conducting our business, or servicing you, so long as those parties agree to keep this information confidential.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-3">6. Contact Us</h2>
          <p>If there are any questions regarding this privacy policy, you may contact us using the information below:</p>
          <p className="mt-2 font-semibold text-text-primary">
            Magizhchi Garments<br />
            Email: info@magizhchi.com<br />
            Phone: +91 73588 85452
          </p>
        </section>
      </div>
    </div>
  );
}
