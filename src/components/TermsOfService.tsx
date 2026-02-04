import React from "react";
import { ArrowLeft } from "lucide-react";

interface Props {
  onBack: () => void;
}

export const TermsOfService: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-midnight-950 pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto bg-midnight-800 rounded-2xl border border-midnight-700 p-8 md:p-12">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-text-secondary hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="border-b border-midnight-700 pb-6 mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Terms of Service
          </h1>
          <p className="text-text-muted">Last Updated: February 1, 2026</p>
        </div>

        <div className="prose prose-invert max-w-none text-text-secondary text-sm leading-relaxed">
          <p className="bg-scout-purple/10 p-4 rounded-lg border border-scout-purple/30 text-scout-glow font-medium mb-8">
            PLEASE READ THESE TERMS CAREFULLY. THEY CONTAIN A MANDATORY
            ARBITRATION PROVISION AND CLASS ACTION WAIVER.
          </p>

          <h3 className="text-white font-bold text-lg mt-8 mb-4">
            1. Acceptance of Terms
          </h3>
          <p>
            Welcome to TotalAssist. By accessing our website (totalassist.tech),
            using our AI chat interface, or purchasing a subscription
            (collectively, the "Service"), you agree to be bound by these Terms
            of Service ("Terms"). If you do not agree, you must not access or
            use the Service. You represent that you are at least 18 years old
            and have the legal authority to enter into this agreement.
          </p>

          <h3 className="text-white font-bold text-lg mt-8 mb-4">
            2. The TotalAssist Service
          </h3>
          <p>
            TotalAssist provides technical support assistance primarily through
            Scout, our Artificial Intelligence ("AI") assistant.
            <strong className="text-white"> You acknowledge and agree that:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>
              The Service uses AI to generate troubleshooting steps. AI systems
              can hallucinate or provide inaccurate information.
            </li>
            <li>
              Any advice, instructions, or diagnostics provided by Scout AI
              are for informational purposes only.
            </li>
            <li>
              You are solely responsible for evaluating the safety and relevance
              of the advice before performing any physical actions on your
              devices.
            </li>
            <li>
              Smart Tek Labs is not responsible for data loss, hardware damage, or
              personal injury resulting from your execution of AI-suggested
              steps.
            </li>
          </ul>

          <h3 className="text-white font-bold text-lg mt-8 mb-4">
            3. Accounts and Security
          </h3>
          <p>
            You are responsible for maintaining the confidentiality of your
            account credentials. You notify us immediately of any unauthorized
            use of your account. Smart Tek Labs reserves the right to terminate
            accounts that share credentials or abuse the service.
          </p>

          <h3 className="text-white font-bold text-lg mt-8 mb-4">
            4. Subscriptions and Billing
          </h3>
          <p>
            <strong className="text-white">4.1. Recurring Billing.</strong> By purchasing a
            Subscription (e.g., "Home" or "Pro"), you authorize us to charge
            your payment method on a recurring basis (monthly or annually) until
            you cancel.
          </p>
          <p>
            <strong className="text-white">4.2. Cancellation.</strong> You may cancel your subscription
            at any time via your Dashboard. Cancellation stops future billing
            but does not refund previous payments, except as provided in our
            Refund Policy.
          </p>
          <p>
            <strong className="text-white">4.3. Price Changes.</strong> We reserve the right to adjust
            pricing for our service or any components thereof in any manner and
            at any time. Any price changes will take effect following notice to
            you.
          </p>

          <h3 className="text-white font-bold text-lg mt-8 mb-4">
            5. User Conduct
          </h3>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>
              Use the Service for any illegal purpose or in violation of any
              local, state, or federal law.
            </li>
            <li>
              Upload invalid data, viruses, worms, or other software agents
              through the Service.
            </li>
            <li>
              Harass, abuse, or harm another person, including our support
              agents (if applicable).
            </li>
            <li>
              Reverse engineer or attempt to steal the AI prompts or underlying
              technology of TotalAssist.
            </li>
          </ul>

          <h3 className="text-white font-bold text-lg mt-8 mb-4">
            6. Intellectual Property
          </h3>
          <p>
            The Service and its original content (excluding content provided by
            users), features, and functionality are and will remain the
            exclusive property of Smart Tek Labs and its licensors. By
            uploading images or text to the Service ("User Content"), you grant
            Smart Tek Labs a worldwide, non-exclusive, royalty-free license to use,
            reproduce, and process that content solely for the purpose of
            providing and improving the Service (e.g., training our AI models).
          </p>

          <h3 className="text-white font-bold text-lg mt-8 mb-4">
            7. Disclaimer of Warranties
          </h3>
          <p className="uppercase text-text-muted">
            THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS.
            SMART TEK LABS EXPRESSLY DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER
            EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
            NON-INFRINGEMENT. WE DO NOT GUARANTEE THAT SCOUT AI ADVICE WILL FIX
            YOUR PROBLEM.
          </p>

          <h3 className="text-white font-bold text-lg mt-8 mb-4">
            8. Limitation of Liability
          </h3>
          <p className="uppercase text-text-muted">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL SMART TEK LABS
            BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
            PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES. IN NO EVENT
            SHALL SMART TEK LABS' AGGREGATE LIABILITY EXCEED THE GREATER OF ONE
            HUNDRED U.S. DOLLARS ($100.00) OR THE AMOUNT YOU PAID SMART TEK LABS, IF
            ANY, IN THE PAST SIX MONTHS.
          </p>

          <h3 className="text-white font-bold text-lg mt-8 mb-4">
            9. Governing Law
          </h3>
          <p>
            These Terms shall be governed and construed in accordance with the
            laws of the State of Missouri, United States, without regard to its
            conflict of law provisions. Our failure to enforce any right or
            provision of these Terms will not be considered a waiver of those
            rights.
          </p>

          <h3 className="text-white font-bold text-lg mt-8 mb-4">
            10. Changes to Terms
          </h3>
          <p>
            We reserve the right, at our sole discretion, to modify or replace
            these Terms at any time. If a revision is material, we will try to
            provide at least 30 days' notice prior to any new terms taking
            effect. What constitutes a material change will be determined at our
            sole discretion.
          </p>

          <div className="mt-12 pt-8 border-t border-midnight-700">
            <p className="font-bold text-white">Contact Us</p>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="text-electric-indigo">legal@totalassist.tech</p>
          </div>
        </div>
      </div>
    </div>
  );
};
