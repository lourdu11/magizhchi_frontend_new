import { Helmet } from 'react-helmet-async';

export default function ShippingPolicy() {
  return (
    <div className="container-custom py-16 max-w-4xl mx-auto">
      <Helmet>
        <title>Shipping Policy — Magizhchi Garments</title>
      </Helmet>

      <h1 className="text-4xl font-bold text-text-primary mb-8">Shipping Policy</h1>
      
      <div className="prose prose-slate max-w-none space-y-6 text-text-muted leading-relaxed">
        <p>Last Updated: April 28, 2026</p>

        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-3">1. Order Processing</h2>
          <p>All orders are processed within 1–2 business days. Orders are not shipped or delivered on Sundays or public holidays.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-3">2. Shipping Rates & Delivery Estimates</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-border-light">
              <thead>
                <tr className="bg-light-bg">
                  <th className="p-3 border border-border-light font-bold">Region</th>
                  <th className="p-3 border border-border-light font-bold">Estimated Delivery</th>
                  <th className="p-3 border border-border-light font-bold">Charges</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border border-border-light">Tamil Nadu</td>
                  <td className="p-3 border border-border-light">2–4 Business Days</td>
                  <td className="p-3 border border-border-light">₹50 (Free over ₹999)</td>
                </tr>
                <tr>
                  <td className="p-3 border border-border-light">Metro Cities</td>
                  <td className="p-3 border border-border-light">3–5 Business Days</td>
                  <td className="p-3 border border-border-light">₹50 (Free over ₹999)</td>
                </tr>
                <tr>
                  <td className="p-3 border border-border-light">Rest of India</td>
                  <td className="p-3 border border-border-light">5–7 Business Days</td>
                  <td className="p-3 border border-border-light">₹50 (Free over ₹999)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-3">3. Shipment Confirmation & Order Tracking</h2>
          <p>You will receive a Shipment Confirmation email and a WhatsApp notification containing your tracking number(s) once your order has shipped. The tracking number will be active within 24 hours.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-3">4. Courier Partners</h2>
          <p>We partner with reliable courier services including Delhivery, BlueDart, and Ecom Express to ensure your garments reach you safely and on time.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-3">5. Damages</h2>
          <p>Magizhchi Garments is not liable for any products damaged or lost during shipping. If you received your order damaged, please contact the shipment carrier to file a claim. Please save all packaging materials and damaged goods before filing a claim.</p>
        </section>
      </div>
    </div>
  );
}
