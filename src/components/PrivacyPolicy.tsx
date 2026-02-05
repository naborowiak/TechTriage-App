import React from "react";
import { ArrowLeft } from "lucide-react";

interface Props {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<Props> = ({ onBack }) => {
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
            Privacy Policy
          </h1>
          <p className="text-text-muted">Last Updated: February 1, 2026</p>
        </div>

        <div className="prose prose-invert max-w-none text-text-secondary text-sm leading-relaxed">
          <p className="bg-electric-indigo/10 p-4 rounded-lg border border-electric-indigo/30 text-electric-cyan font-medium mb-8">
            Smart Tek Labs ("TotalAssist", "we", "us") is committed to
            protecting your personal information. This policy describes how we
            collect, use, and disclose data when you use our AI-powered support
            platform.
          </p>

          <h3 className="text-white font-bold text-lg mt-8 mb-4">
            1. Information We Collect
          </h3>
          <p>
            We collect information to provide our diagnostic and support
            services:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>
              <strong className="text-white">Account Data:</strong> Name, email address, and password
              hash (we do not store raw passwords).
            </li>
            <li>
              <strong className="text-white">Diagnostic Content:</strong> Photos, video streams, and
              text descriptions of your technical issues uploaded to our chat
              interface.
            </li>
            <li>
              <strong className="text-white">Device Metadata:</strong> IP address, browser type, and
              operating system information used for security and debugging.
            </li>
            <li>
              <strong className="text-white">Payment Information:</strong> We use Stripe to process
              payments. We do not store your full credit card number on our
              servers.
            </li>
          </ul>

          <h3 className="text-white font-bold text-lg mt-8 mb-4">
            2. Device Permissions (Camera & Microphone)
          </h3>
          <p>
            To use features like "Scout Snapshot" or "Live Video Support," our web
            application may request access to your device's camera and
            microphone. You may revoke these permissions at any time via your
            browser settings.
            <strong className="text-white"> Note:</strong> Denying permissions will limit Scout AI's
            ability to visually diagnose your issue.
          </p>

          <h3 className="text-white font-bold text-lg mt-8 mb-4">
            3. How We Use Your Information
          </h3>
          <p>We use your data for the following specific purposes:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>
              To provide immediate, AI-driven technical support responses.
            </li>
            <li>
              To analyze uploaded videos and generate diagnostic reports using
              Scout AI (Video Diagnostic feature).
            </li>
            <li>
              To improve our AI models (anonymized chat logs may be used to
              train our models to be more accurate).
            </li>
            <li>To detect and prevent fraud, abuse, or security breaches.</li>
            <li>
              To communicate with you about your subscription status and
              billing.
            </li>
          </ul>

          <h3 className="text-white font-bold text-lg mt-8 mb-4">
            4. Data Sharing and Third Parties
          </h3>
          <p>
            We do not sell your personal data. We only share data with trusted
            service providers necessary to operate the business:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>
              <strong className="text-white">Stripe:</strong> For payment processing and subscription
              management.
            </li>
            <li>
              <strong className="text-white">Google Cloud / AWS / Supabase:</strong> For secure cloud
              hosting and database storage.
            </li>
            <li>
              <strong className="text-white">AI Providers (e.g., Google Gemini):</strong> To
              generate the technical support responses. Data sent to these
              providers is strictly for processing your request.
            </li>
            <li>
              <strong className="text-white">Legal Requirements:</strong> We may disclose information
              if required by law, subpoena, or other legal process.
            </li>
          </ul>

          <h3 className="text-white font-bold text-lg mt-8 mb-4">
            5. Data Retention
          </h3>
          <p>
            We retain your personal information only as long as necessary to
            provide the Service and fulfill the purposes outlined in this
            policy. If you delete your account, we will delete your personal
            identification data, though we may retain anonymized diagnostic logs
            for system improvement.
          </p>

          <h3 className="text-white font-bold text-lg mt-8 mb-4">
            6. Security
          </h3>
          <p>
            We use industry-standard encryption (TLS/SSL) for data in transit
            and at rest. However, no method of transmission over the Internet is
            100% secure. You are responsible for keeping your account password
            complex and secure.
          </p>

          <h3 className="text-white font-bold text-lg mt-8 mb-4">
            7. Children's Privacy
          </h3>
          <p>
            Our Service is not directed to individuals under the age of 18. We
            do not knowingly collect personal information from children. If we
            become aware that a child has provided us with personal information,
            we will take steps to delete such information.
          </p>

          <h3 className="text-white font-bold text-lg mt-8 mb-4">
            8. International Users
          </h3>
          <p>
            TotalAssist is operated from the United States. If you are accessing
            the Service from outside the U.S., please be aware that your
            information will be transferred to, stored, and processed in the
            United States where our servers are located.
          </p>

          <h3 className="text-white font-bold text-lg mt-8 mb-4">
            9. Changes to this Policy
          </h3>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page
            and updating the "Last Updated" date.
          </p>

          <div className="mt-12 pt-8 border-t border-midnight-700">
            <p className="font-bold text-white">Contact Us</p>
            <p>
              If you have questions about this policy or your data rights,
              please contact our Privacy Officer:
            </p>
            <p className="text-electric-indigo font-medium">
              privacy@totalassist.tech
            </p>
            <p className="text-text-muted mt-2">
              Smart Tek Labs
              <br />
              St. Louis, MO, USA
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
