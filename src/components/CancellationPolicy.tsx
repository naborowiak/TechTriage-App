import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface Props { onBack: () => void; }

export const CancellationPolicy: React.FC<Props> = ({ onBack }) => (
  <div className="min-h-screen bg-midnight-950 pt-24 pb-12 px-6">
    <div className="max-w-3xl mx-auto bg-midnight-800 rounded-2xl border border-midnight-700 p-8 md:p-12">
      <button onClick={onBack} className="flex items-center gap-2 text-text-secondary hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>

      <h1 className="text-3xl font-bold text-white mb-2">Cancellation & Refund Policy</h1>
      <p className="text-text-muted mb-8">Last updated: February 2026</p>

      <div className="prose prose-invert max-w-none text-text-secondary space-y-6">
        <section>
          <h2 className="text-xl font-bold text-white mb-3">1. Cancel Anytime</h2>
          <p>You may cancel your TotalAssist subscription at any time via your Dashboard or by contacting support. There are no cancellation fees or lock-in contracts.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">2. Prorated Refunds (Upgrades & Downgrades)</h2>
          <p>If you change your plan (e.g., upgrade from Home to Pro) in the middle of a billing cycle, charges will be prorated immediately. You will only pay the difference for the remaining days in the month.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">3. Refund Policy</h2>
          <p>If you are unsatisfied with our service, you may request a full refund within the first 30 days of your initial subscription. After 30 days, cancellations will prevent future billing, but previous months are non-refundable.</p>
        </section>
      </div>
    </div>
  </div>
);
