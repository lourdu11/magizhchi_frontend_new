import { Helmet } from 'react-helmet-async';

export default function TermsAndConditions() {
  return (
    <div className="container-custom py-16 max-w-4xl mx-auto">
      <Helmet>
        <title>Terms & Conditions — Magizhchi Garments</title>
      </Helmet>

      <h1 className="text-4xl font-bold text-text-primary mb-8">Terms & Conditions</h1>
      
      <div className="prose prose-slate max-w-none space-y-6 text-text-muted leading-relaxed">
        <p>Last Updated: April 28, 2026</p>

        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-3">1. Agreement to Terms</h2>
          <p>By accessing or using the Magizhchi Garments website, you agree to be bound by these Terms and Conditions and all applicable laws and regulations.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-3">2. Use License</h2>
          <p>Permission is granted to temporarily download one copy of the materials (information or software) on Magizhchi Garments' website for personal, non-commercial transitory viewing only.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-3">3. Payment Terms</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>All prices are listed in Indian Rupees (INR) and are inclusive of GST unless stated otherwise.</li>
            <li>Payment must be made in full at the time of placing an order through our secure payment gateway (Razorpay) or via Cash on Delivery where applicable.</li>
            <li>We reserve the right to cancel any order if we suspect fraudulent activity.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-3">4. Intellectual Property</h2>
          <p>The content, logos, and designs on this website are the intellectual property of Magizhchi Garments. Any unauthorized use is strictly prohibited.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-3">5. Disclaimer</h2>
          <p>The materials on Magizhchi Garments' website are provided on an 'as is' basis. Magizhchi Garments makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-3">6. Governing Law</h2>
          <p>These terms and conditions are governed by and construed in accordance with the laws of India and you irrevocably submit to the exclusive jurisdiction of the courts in Tamil Nadu.</p>
        </section>
      </div>
    </div>
  );
}
