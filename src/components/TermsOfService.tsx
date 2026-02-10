import React from "react";
import { ArrowLeft, AlertTriangle } from "lucide-react";

interface Props {
  onBack: () => void;
}

export const TermsOfService: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-light-50 dark:bg-midnight-950 pt-24 pb-12 px-6 transition-colors">
      <div className="max-w-4xl mx-auto bg-white dark:bg-midnight-800 rounded-2xl border border-light-300 dark:border-midnight-700 p-8 md:p-12 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="border-b border-light-300 dark:border-midnight-700 pb-6 mb-8">
          <h1 className="text-3xl font-bold text-text-primary dark:text-white mb-2">
            Terms of Service
          </h1>
          <p className="text-text-muted">Last Updated: February 5, 2026</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none text-text-secondary text-sm leading-relaxed">
          {/* Important Notice Banner */}
          <div className="bg-scout-purple/10 p-4 rounded-lg border border-scout-purple/30 mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-scout-purple shrink-0 mt-0.5" />
              <div>
                <p className="text-scout-purple font-bold mb-1">IMPORTANT LEGAL NOTICE</p>
                <p className="text-text-secondary text-xs">
                  PLEASE READ THESE TERMS CAREFULLY. THEY CONTAIN IMPORTANT INFORMATION ABOUT YOUR RIGHTS AND OBLIGATIONS, INCLUDING A MANDATORY ARBITRATION PROVISION, CLASS ACTION WAIVER, AND LIMITATIONS ON LIABILITY. BY USING TOTALASSIST, YOU AGREE TO BE BOUND BY THESE TERMS.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1 */}
          <h3 className="text-text-primary dark:text-white font-bold text-lg mt-8 mb-4">
            1. Acceptance of Terms
          </h3>
          <p>
            Welcome to TotalAssist, operated by Smart Tek Labs ("Company," "we," "us," or "our").
            By accessing our website at totalassist.tech, using our AI-powered support services,
            mobile applications, or purchasing any subscription or credits (collectively, the "Service"),
            you ("User," "you," or "your") agree to be bound by these Terms of Service ("Terms"),
            our Privacy Policy, and any additional terms that apply to specific features.
          </p>
          <p className="mt-3">
            <strong className="text-text-primary dark:text-white">Eligibility:</strong> You must be at least 18 years old and have the legal capacity to enter into a binding agreement. If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization to these Terms.
          </p>

          {/* Section 2 */}
          <h3 className="text-text-primary dark:text-white font-bold text-lg mt-8 mb-4">
            2. Description of Service
          </h3>
          <p>
            TotalAssist provides AI-powered technical support assistance through "Scout," our artificial intelligence assistant. The Service includes:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-3">
            <li><strong className="text-text-primary dark:text-white">Chat Support:</strong> Text-based AI conversations for troubleshooting tech issues</li>
            <li><strong className="text-text-primary dark:text-white">Photo Analysis:</strong> Photo-based visual diagnosis of devices and error messages</li>
            <li><strong className="text-text-primary dark:text-white">Voice Support:</strong> Voice-powered interactive support sessions</li>
            <li><strong className="text-text-primary dark:text-white">Live Video Support:</strong> Real-time video diagnostic sessions with AI guidance</li>
            <li><strong className="text-text-primary dark:text-white">Diagnostic Reports:</strong> PDF summaries of support sessions emailed to you</li>
          </ul>

          {/* Section 3 - AI Disclaimer */}
          <h3 className="text-text-primary dark:text-white font-bold text-lg mt-8 mb-4">
            3. AI Service Disclaimer
          </h3>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 my-4">
            <p className="text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">Critical Acknowledgment</p>
            <p className="text-text-secondary text-sm">
              YOU EXPRESSLY ACKNOWLEDGE AND AGREE THAT SCOUT IS AN ARTIFICIAL INTELLIGENCE SYSTEM AND NOT A HUMAN TECHNICIAN, ELECTRICIAN, PLUMBER, OR OTHER LICENSED PROFESSIONAL.
            </p>
          </div>
          <p><strong className="text-text-primary dark:text-white">3.1. Nature of AI Advice.</strong> You understand and agree that:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>AI systems can "hallucinate" or generate incorrect, incomplete, or misleading information</li>
            <li>All advice, instructions, diagnostics, and recommendations from Scout are for <strong>informational purposes only</strong></li>
            <li>Scout's responses are generated algorithmically and may not account for your specific circumstances, local codes, or safety requirements</li>
            <li>The Service does not replace professional consultation from licensed electricians, plumbers, HVAC technicians, or other qualified professionals</li>
          </ul>

          <p className="mt-4"><strong className="text-text-primary dark:text-white">3.2. Your Responsibility.</strong> Before acting on any AI-generated advice, you are solely responsible for:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Evaluating whether the advice is appropriate and safe for your specific situation</li>
            <li>Determining if the task requires a licensed professional</li>
            <li>Following all applicable safety guidelines, manufacturer instructions, and local building codes</li>
            <li>Backing up data before making any changes to electronic devices</li>
            <li>Turning off power/water/gas before working on relevant systems</li>
          </ul>

          <p className="mt-4"><strong className="text-text-primary dark:text-white">3.3. No Professional Relationship.</strong> Use of TotalAssist does not create any professional-client, contractor, or fiduciary relationship between you and Smart Tek Labs.</p>

          {/* Section 4 - Safety Warning */}
          <h3 className="text-text-primary dark:text-white font-bold text-lg mt-8 mb-4">
            4. Safety Warning
          </h3>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 my-4">
            <p className="text-red-500 font-bold text-xs uppercase tracking-wider mb-2">Safety First</p>
            <p className="text-text-secondary text-sm">
              WORKING WITH ELECTRICITY, GAS, PLUMBING, HVAC SYSTEMS, AND ELECTRONIC DEVICES CAN BE DANGEROUS. IMPROPER REPAIRS CAN RESULT IN PROPERTY DAMAGE, PERSONAL INJURY, OR DEATH. WHEN IN DOUBT, ALWAYS CONSULT A LICENSED PROFESSIONAL.
            </p>
          </div>
          <p>
            Smart Tek Labs is <strong>not liable</strong> for any property damage, data loss, personal injury, death, or other harm resulting from your decision to follow AI-generated advice. You assume all risk associated with implementing any suggestions provided by Scout.
          </p>

          {/* Section 5 - Accounts */}
          <h3 className="text-text-primary dark:text-white font-bold text-lg mt-8 mb-4">
            5. Account Registration and Security
          </h3>
          <p><strong className="text-text-primary dark:text-white">5.1. Account Creation.</strong> To access certain features, you must create an account by providing accurate, current, and complete information. You may register using email/password or through third-party authentication providers (e.g., Google OAuth).</p>

          <p className="mt-3"><strong className="text-text-primary dark:text-white">5.2. Account Security.</strong> You are responsible for:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Maintaining the confidentiality of your login credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately at support@totalassist.tech if you suspect unauthorized access</li>
          </ul>

          <p className="mt-3"><strong className="text-text-primary dark:text-white">5.3. Account Termination.</strong> We reserve the right to suspend or terminate accounts that:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Share credentials with multiple users</li>
            <li>Abuse the Service or violate these Terms</li>
            <li>Engage in fraudulent activity</li>
            <li>Remain inactive for more than 24 months</li>
          </ul>

          {/* Section 6 - Subscriptions */}
          <h3 className="text-text-primary dark:text-white font-bold text-lg mt-8 mb-4">
            6. Subscriptions and Billing
          </h3>
          <p><strong className="text-text-primary dark:text-white">6.1. Subscription Plans.</strong> We offer the following subscription tiers:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Free:</strong> Limited access (5 chat sessions, 2 photo analyses per month)</li>
            <li><strong>Home ($25/month or $228/year):</strong> Unlimited chat and photo analysis, 2 included video sessions/month</li>
            <li><strong>Pro ($59/month or $588/year):</strong> All Home features plus 5 video sessions/month, multi-home support, priority support</li>
          </ul>

          <p className="mt-4"><strong className="text-text-primary dark:text-white">6.2. Free Trial.</strong> We may offer a 7-day free trial of paid features. At the end of the trial period, your subscription will automatically convert to a paid subscription unless you cancel before the trial ends. You will be charged the applicable subscription fee at the start of your first billing period.</p>

          <p className="mt-4"><strong className="text-text-primary dark:text-white">6.3. Recurring Billing.</strong> By purchasing a subscription, you authorize Smart Tek Labs to charge your payment method on a recurring basis (monthly or annually, depending on your selection) until you cancel. Subscription fees are billed in advance of each billing period.</p>

          <p className="mt-4"><strong className="text-text-primary dark:text-white">6.4. Credit Packs.</strong> In addition to subscriptions, you may purchase one-time credit packs for video diagnostic sessions:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Single Video Diagnostic: $5 (1 credit)</li>
            <li>Video Diagnostic 3-Pack: $12 (3 credits, save $3)</li>
          </ul>
          <p className="mt-2">Credits do not expire and are non-refundable once purchased.</p>

          <p className="mt-4"><strong className="text-text-primary dark:text-white">6.5. Price Changes.</strong> We reserve the right to modify pricing at any time. Price changes for existing subscribers will take effect at the start of the next billing cycle following at least 30 days' notice.</p>

          {/* Section 7 - Cancellation and Refunds */}
          <h3 className="text-text-primary dark:text-white font-bold text-lg mt-8 mb-4">
            7. Cancellation and Refund Policy
          </h3>
          <p><strong className="text-text-primary dark:text-white">7.1. Cancellation.</strong> You may cancel your subscription at any time through your Dashboard settings or by contacting support@totalassist.tech. Upon cancellation:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Your subscription will remain active until the end of the current billing period</li>
            <li>You will not be charged for subsequent billing periods</li>
            <li>You will retain access to paid features until your current period ends</li>
            <li>Your account will revert to the Free tier after the paid period expires</li>
          </ul>

          <p className="mt-4"><strong className="text-text-primary dark:text-white">7.2. Refund Policy.</strong></p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Monthly subscriptions:</strong> No refunds for partial months. You retain access through the end of your paid period.</li>
            <li><strong>Annual subscriptions:</strong> Pro-rated refunds may be issued within the first 30 days if you have not used more than 10% of your included features. After 30 days, no refunds are available.</li>
            <li><strong>Credit packs:</strong> Non-refundable once purchased, as they represent pre-paid service credits.</li>
            <li><strong>Free trials:</strong> If you cancel during a free trial, you will not be charged.</li>
          </ul>

          <p className="mt-4"><strong className="text-text-primary dark:text-white">7.3. Chargebacks.</strong> If you initiate a chargeback or payment dispute, we reserve the right to immediately suspend your account pending resolution. Fraudulent chargebacks may result in permanent account termination and collection action.</p>

          {/* Section 8 - Promo Codes */}
          <h3 className="text-text-primary dark:text-white font-bold text-lg mt-8 mb-4">
            8. Promotional Codes
          </h3>
          <p>
            We may offer promotional codes ("Promo Codes") for discounts on subscriptions. Promo Codes:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Are non-transferable and may only be used by the intended recipient</li>
            <li>Cannot be combined with other offers unless explicitly stated</li>
            <li>Have no cash value and cannot be redeemed for cash</li>
            <li>May have expiration dates and usage limits</li>
            <li>May be modified or discontinued at any time without notice</li>
          </ul>

          {/* Section 9 - User Conduct */}
          <h3 className="text-text-primary dark:text-white font-bold text-lg mt-8 mb-4">
            9. Acceptable Use Policy
          </h3>
          <p>You agree not to use the Service to:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Violate any applicable law, regulation, or third-party rights</li>
            <li>Upload malicious code, viruses, or harmful software</li>
            <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
            <li>Harass, abuse, or threaten other users or our staff</li>
            <li>Reverse engineer, decompile, or attempt to extract the source code or AI models</li>
            <li>Use automated scripts, bots, or scrapers to access the Service</li>
            <li>Circumvent usage limits or access controls</li>
            <li>Resell, sublicense, or commercially exploit the Service without authorization</li>
            <li>Use the Service for any purpose other than personal, non-commercial technical support</li>
            <li>Submit false, misleading, or fraudulent information</li>
          </ul>
          <p className="mt-3">Violation of this policy may result in immediate account termination without refund.</p>

          {/* Section 10 - Intellectual Property */}
          <h3 className="text-text-primary dark:text-white font-bold text-lg mt-8 mb-4">
            10. Intellectual Property Rights
          </h3>
          <p><strong className="text-text-primary dark:text-white">10.1. Our Property.</strong> The Service, including all software, AI models, algorithms, text, graphics, logos, icons, images, audio clips, and the overall "look and feel," is owned by Smart Tek Labs or its licensors and is protected by copyright, trademark, and other intellectual property laws. "TotalAssist," "Scout," "Scout AI," and the TotalAssist logo are trademarks of Smart Tek Labs.</p>

          <p className="mt-4"><strong className="text-text-primary dark:text-white">10.2. Your Content.</strong> By uploading photos, text, or other content ("User Content") to the Service, you grant Smart Tek Labs a worldwide, non-exclusive, royalty-free, sublicensable license to use, reproduce, modify, and process your User Content solely for the purpose of:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Providing the Service to you</li>
            <li>Improving and developing the Service</li>
            <li>Training and improving our AI models (in anonymized, aggregated form)</li>
          </ul>
          <p className="mt-2">You retain all ownership rights to your User Content.</p>

          <p className="mt-4"><strong className="text-text-primary dark:text-white">10.3. Feedback.</strong> If you provide suggestions, ideas, or feedback about the Service, you grant us the right to use such feedback without compensation or attribution.</p>

          {/* Section 11 - Third-Party Services */}
          <h3 className="text-text-primary dark:text-white font-bold text-lg mt-8 mb-4">
            11. Third-Party Services
          </h3>
          <p>
            The Service integrates with third-party services including but not limited to:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Google Gemini:</strong> AI language model powering Scout</li>
            <li><strong>Stripe:</strong> Payment processing</li>
            <li><strong>Google OAuth:</strong> Authentication services</li>
            <li><strong>Resend:</strong> Email delivery</li>
          </ul>
          <p className="mt-3">
            Your use of these third-party services is subject to their respective terms and privacy policies. Smart Tek Labs is not responsible for the actions, content, or policies of third-party services.
          </p>

          {/* Section 12 - Disclaimer of Warranties */}
          <h3 className="text-text-primary dark:text-white font-bold text-lg mt-8 mb-4">
            12. Disclaimer of Warranties
          </h3>
          <div className="bg-midnight-100 dark:bg-midnight-900 rounded-lg p-4 my-4 text-xs">
            <p className="uppercase text-text-muted leading-relaxed">
              THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. SMART TEK LABS EXPRESSLY DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2 uppercase text-text-muted">
              <li>IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT</li>
              <li>WARRANTIES THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES</li>
              <li>WARRANTIES THAT SCOUT AI ADVICE WILL BE ACCURATE, COMPLETE, RELIABLE, OR EFFECTIVE</li>
              <li>WARRANTIES THAT THE SERVICE WILL MEET YOUR REQUIREMENTS OR EXPECTATIONS</li>
            </ul>
            <p className="uppercase text-text-muted mt-3">
              YOU USE THE SERVICE AT YOUR OWN RISK. NO ORAL OR WRITTEN INFORMATION OR ADVICE GIVEN BY SMART TEK LABS OR ITS REPRESENTATIVES SHALL CREATE A WARRANTY.
            </p>
          </div>

          {/* Section 13 - Limitation of Liability */}
          <h3 className="text-text-primary dark:text-white font-bold text-lg mt-8 mb-4">
            13. Limitation of Liability
          </h3>
          <div className="bg-midnight-100 dark:bg-midnight-900 rounded-lg p-4 my-4 text-xs">
            <p className="uppercase text-text-muted leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:
            </p>
            <p className="uppercase text-text-muted mt-3 leading-relaxed">
              (A) IN NO EVENT SHALL SMART TEK LABS, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, GOODWILL, DATA, OR OTHER INTANGIBLE LOSSES, REGARDLESS OF WHETHER SMART TEK LABS HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="uppercase text-text-muted mt-3 leading-relaxed">
              (B) SMART TEK LABS SHALL NOT BE LIABLE FOR ANY DAMAGES ARISING FROM: (I) YOUR USE OF OR INABILITY TO USE THE SERVICE; (II) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY; (III) UNAUTHORIZED ACCESS TO OR ALTERATION OF YOUR CONTENT; (IV) PHYSICAL DAMAGE, PERSONAL INJURY, OR PROPERTY DAMAGE RESULTING FROM YOUR RELIANCE ON AI-GENERATED ADVICE.
            </p>
            <p className="uppercase text-text-muted mt-3 leading-relaxed">
              (C) IN NO EVENT SHALL SMART TEK LABS' TOTAL AGGREGATE LIABILITY EXCEED THE GREATER OF: (I) ONE HUNDRED U.S. DOLLARS ($100.00); OR (II) THE TOTAL AMOUNT YOU PAID TO SMART TEK LABS IN THE SIX (6) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM.
            </p>
            <p className="uppercase text-text-muted mt-3 leading-relaxed">
              SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES, SO SOME OF THE ABOVE LIMITATIONS MAY NOT APPLY TO YOU.
            </p>
          </div>

          {/* Section 14 - Indemnification */}
          <h3 className="text-text-primary dark:text-white font-bold text-lg mt-8 mb-4">
            14. Indemnification
          </h3>
          <p>
            You agree to indemnify, defend, and hold harmless Smart Tek Labs and its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or related to:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Your use of the Service</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any third-party rights</li>
            <li>Your User Content</li>
            <li>Any actions you take based on AI-generated advice</li>
            <li>Any damage or injury caused by your implementation of troubleshooting steps</li>
          </ul>

          {/* Section 15 - Arbitration */}
          <h3 className="text-text-primary dark:text-white font-bold text-lg mt-8 mb-4">
            15. Dispute Resolution and Arbitration
          </h3>
          <div className="bg-scout-purple/10 border border-scout-purple/30 rounded-lg p-4 my-4">
            <p className="text-scout-purple font-bold text-xs uppercase tracking-wider mb-2">Binding Arbitration Agreement</p>
            <p className="text-text-secondary text-sm">
              PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS, INCLUDING YOUR RIGHT TO FILE A LAWSUIT IN COURT.
            </p>
          </div>

          <p><strong className="text-text-primary dark:text-white">15.1. Agreement to Arbitrate.</strong> You and Smart Tek Labs agree that any dispute, claim, or controversy arising out of or relating to these Terms or the Service shall be resolved through binding individual arbitration rather than in court, except that either party may bring claims in small claims court if eligible.</p>

          <p className="mt-4"><strong className="text-text-primary dark:text-white">15.2. Class Action Waiver.</strong> YOU AND SMART TEK LABS AGREE THAT EACH PARTY MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, COLLECTIVE, OR REPRESENTATIVE ACTION.</p>

          <p className="mt-4"><strong className="text-text-primary dark:text-white">15.3. Arbitration Rules.</strong> Arbitration shall be conducted by JAMS under its Streamlined Arbitration Rules. The arbitration shall take place in St. Louis, Missouri, or may be conducted via telephone or video conference at the arbitrator's discretion.</p>

          <p className="mt-4"><strong className="text-text-primary dark:text-white">15.4. Opt-Out.</strong> You may opt out of this arbitration agreement by sending written notice to legal@totalassist.tech within 30 days of first accepting these Terms. The notice must include your name, address, email, and a clear statement that you wish to opt out.</p>

          {/* Section 16 - Governing Law */}
          <h3 className="text-text-primary dark:text-white font-bold text-lg mt-8 mb-4">
            16. Governing Law
          </h3>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the State of Missouri, United States, without regard to its conflict of law provisions. For any disputes not subject to arbitration, you consent to the exclusive jurisdiction of the state and federal courts located in St. Louis County, Missouri.
          </p>

          {/* Section 17 - Termination */}
          <h3 className="text-text-primary dark:text-white font-bold text-lg mt-8 mb-4">
            17. Termination
          </h3>
          <p><strong className="text-text-primary dark:text-white">17.1. By You.</strong> You may terminate your account at any time by contacting support@totalassist.tech or through your account settings.</p>

          <p className="mt-4"><strong className="text-text-primary dark:text-white">17.2. By Us.</strong> We may suspend or terminate your access to the Service immediately, without prior notice, for any reason, including if you breach these Terms.</p>

          <p className="mt-4"><strong className="text-text-primary dark:text-white">17.3. Effect of Termination.</strong> Upon termination:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Your right to use the Service ceases immediately</li>
            <li>We may delete your account data after 30 days (or as required by law)</li>
            <li>Sections 3, 4, 10, 12, 13, 14, 15, 16, and 19 shall survive termination</li>
          </ul>

          {/* Section 18 - Changes to Terms */}
          <h3 className="text-text-primary dark:text-white font-bold text-lg mt-8 mb-4">
            18. Changes to Terms
          </h3>
          <p>
            We reserve the right to modify these Terms at any time. If we make material changes, we will notify you by email or by posting a prominent notice on the Service at least 30 days before the changes take effect. Your continued use of the Service after the effective date constitutes acceptance of the modified Terms. If you do not agree to the new Terms, you must stop using the Service.
          </p>

          {/* Section 19 - General Provisions */}
          <h3 className="text-text-primary dark:text-white font-bold text-lg mt-8 mb-4">
            19. General Provisions
          </h3>
          <p><strong className="text-text-primary dark:text-white">19.1. Entire Agreement.</strong> These Terms, together with our Privacy Policy, constitute the entire agreement between you and Smart Tek Labs regarding the Service.</p>

          <p className="mt-4"><strong className="text-text-primary dark:text-white">19.2. Severability.</strong> If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force and effect.</p>

          <p className="mt-4"><strong className="text-text-primary dark:text-white">19.3. Waiver.</strong> Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision.</p>

          <p className="mt-4"><strong className="text-text-primary dark:text-white">19.4. Assignment.</strong> You may not assign or transfer these Terms without our prior written consent. We may assign our rights and obligations without restriction.</p>

          <p className="mt-4"><strong className="text-text-primary dark:text-white">19.5. Force Majeure.</strong> Smart Tek Labs shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, including natural disasters, war, terrorism, labor disputes, or internet/power outages.</p>

          <p className="mt-4"><strong className="text-text-primary dark:text-white">19.6. Notices.</strong> We may provide notices to you via email, posting on the Service, or other reasonable means. You may provide notices to us at the contact information below.</p>

          {/* Contact Section */}
          <div className="mt-12 pt-8 border-t border-light-300 dark:border-midnight-700">
            <h3 className="text-text-primary dark:text-white font-bold text-lg mb-4">20. Contact Information</h3>
            <p>If you have any questions about these Terms of Service, please contact us:</p>
            <div className="bg-light-100 dark:bg-midnight-900 rounded-lg p-4 mt-4">
              <p className="font-bold text-text-primary dark:text-white">Smart Tek Labs</p>
              <p className="text-text-secondary mt-1">TotalAssist Legal Department</p>
              <p className="text-text-secondary">Email: <a href="mailto:legal@totalassist.tech" className="text-electric-indigo hover:underline">legal@totalassist.tech</a></p>
              <p className="text-text-secondary">Support: <a href="mailto:support@totalassist.tech" className="text-electric-indigo hover:underline">support@totalassist.tech</a></p>
              <p className="text-text-secondary">Website: <a href="https://totalassist.tech" className="text-electric-indigo hover:underline">totalassist.tech</a></p>
            </div>
          </div>

          {/* Final Acknowledgment */}
          <div className="mt-8 p-4 bg-light-100 dark:bg-midnight-900 rounded-lg border border-light-300 dark:border-midnight-600">
            <p className="text-text-muted text-xs text-center">
              BY USING TOTALASSIST, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
