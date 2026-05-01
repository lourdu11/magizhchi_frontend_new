import { Helmet } from 'react-helmet-async';

export default function RefundPolicy() {
  return (
    <div className="container-custom py-16 max-w-4xl mx-auto">
      <Helmet>
        <title>Refund & Cancellation Policy — Magizhchi Garments</title>
      </Helmet>

      <h1 className="text-4xl font-bold text-text-primary mb-8">Refund & Cancellation Policy</h1>
      
      <div className="prose prose-slate max-w-none space-y-6 text-text-muted leading-relaxed">
        <p>Last Updated: April 28, 2026</p>

        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-3">1. Cancellation Policy</h2>
          <p>Orders can be cancelled within 24 hours of placement or until they have been shipped, whichever is earlier. Once an order is shipped, it cannot be cancelled. To cancel your order, please visit your dashboard or contact us at +91 73588 85452.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-3">2. Return Eligibility</h2>
          <p>We offer a 7-day return and exchange policy. To be eligible for a return, your item must be:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Unused and in the same condition that you received it.</li>
            <li>In the original packaging with all tags intact.</li>
            <li>Accompanied by the original receipt or proof of purchase.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-3">3. Refund Process</h2>
          <p>Once we receive and inspect your returned item, we will notify you of the approval or rejection of your refund. If approved, your refund will be processed immediately.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-3">4. Refund Timeline</h2>
          <p className="bg-premium-gold/10 p-4 border-l-4 border-premium-gold font-semibold text-text-primary">
            Approved refunds will be credited back to the original payment method (Credit Card/Debit Card/UPI) within 5–7 business days.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-3">5. Exchange Policy</h2>
          <p>If you need to exchange an item for a different size or color, please contact our support team. Exchanges are subject to stock availability.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-3">6. Shipping Costs for Returns</h2>
          <p>Customers are responsible for paying their own shipping costs for returning items. Shipping costs are non-refundable.</p>
        </section>
      </div>
    </div>
  );
}
