import React from "react";
import { ArrowLeft } from "lucide-react";

interface Props {
  onBack: () => void;
}

export const TermsOfService: React.FC<Props> = ({ onBack }) => {
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
          Terms of Service
        </h1>
        <p className="text-gray-500 mb-8">Last updated: February 1, 2026</p>

        <div className="prose prose-orange max-w-none text-gray-600 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using TechTriage, you agree to be bound by these
              Terms. If you disagree with any part of the terms, then you may
              not access the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              2. Description of Service
            </h2>
            <p>
              TechTriage provides AI-assisted technical support services. While
              we strive for accuracy, our AI advice is provided "as is" and we
              do not guarantee that it will resolve every technical issue.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              3. Subscriptions
            </h2>
            <p>
              Some parts of the Service are billed on a subscription basis. You
              will be billed in advance on a recurring and periodic basis (such
              as monthly or annually).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              4. Limitation of Liability
            </h2>
            <p>
              In no event shall TechTriage, nor its directors, employees,
              partners, agents, suppliers, or affiliates, be liable for any
              indirect, incidental, special, consequential or punitive damages.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
