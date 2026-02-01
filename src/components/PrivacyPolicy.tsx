import React from "react";
import { ArrowLeft } from "lucide-react";

interface Props {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8 md:p-12">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Privacy Policy
        </h1>
        <p className="text-gray-500 mb-8">Last updated: February 1, 2026</p>

        <div className="prose prose-orange max-w-none text-gray-600 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              1. Information We Collect
            </h2>
            <p>
              We collect information you provide directly to us, such as when
              you create an account, subscribe to our services, or communicate
              with us. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Account information (Name, Email)</li>
              <li>Payment information (Processed securely via Stripe)</li>
              <li>
                Support communications (Chat logs, photos uploaded for
                troubleshooting)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              2. How We Use Your Information
            </h2>
            <p>
              We use the information we collect to operate, maintain, and
              improve our services, including:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Processing transactions and sending related information.</li>
              <li>
                Providing technical support and AI-driven troubleshooting.
              </li>
              <li>Sending technical notices, updates, and support messages.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              3. Data Security
            </h2>
            <p>
              We implement reasonable security measures to protect your personal
              information. However, no security system is impenetrable and we
              cannot guarantee the security of our systems 100%.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              4. Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy, please
              contact us at support@techtriage.app.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
