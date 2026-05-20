'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield } from 'lucide-react';

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-obsidian-900 text-industrial-300 font-sans selection:bg-electric-500 selection:text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto bg-obsidian-800 border border-obsidian-600 rounded-lg shadow-xl overflow-hidden">
        
        {/* Header */}
        <header className="border-b border-obsidian-600 bg-obsidian-900/50 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/')}
              className="p-2.5 hover:bg-obsidian-850 border border-obsidian-600 rounded text-industrial-50 transition-colors"
              title="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-electric-500" />
                <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wider text-industrial-50">GymEase</h1>
              </div>
              <p className="text-industrial-400 font-mono text-xs uppercase tracking-wider mt-0.5">Terms & Conditions of Usage</p>
            </div>
          </div>
          <div className="font-mono text-right text-[10px] text-industrial-400 leading-relaxed uppercase">
            <div>Parallax Machine Inc.</div>
            <div>Effective Date: January 1, 2025</div>
            <div>Version 1.2</div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 md:p-8 space-y-8 font-mono text-xs leading-relaxed max-h-[70vh] overflow-y-auto">
          
          <div className="bg-obsidian-900 border border-obsidian-600/40 p-5 rounded text-industrial-300 italic">
            By installing, activating, or using GymEase software, you (&quot;Licensee&quot;) agree to be bound by these Terms & Conditions (&quot;Agreement&quot;) with Parallax Machine Inc. (&quot;Parallax Machine&quot;, &quot;we&quot;, &quot;us&quot;). If you do not agree, do not install or use the software.
          </div>

          <div className="border-t border-obsidian-700 my-6"></div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-industrial-50 uppercase tracking-widest border-b border-obsidian-750 pb-1">
              1. SOFTWARE LICENSE & DISTRIBUTION
            </h2>
            <p>
              GymEase is proprietary software developed by Parallax Machine Inc. Subject to full compliance with this Agreement, Licensee is granted a non-exclusive, non-transferable, revocable license to deploy and operate GymEase within the specific physical fitness facility identified at time of purchase (&quot;Licensed Location&quot;).
            </p>
            <p className="font-bold text-industrial-200">The following are expressly prohibited:</p>
            <ul className="list-disc pl-5 space-y-1 text-industrial-450">
              <li>Copying, redistributing, sublicensing, or reselling the software or any component thereof.</li>
              <li>Decompiling, reverse-engineering, or disassembling packaged binaries.</li>
              <li>Hosting GymEase as a shared or multi-tenant service (SaaS) for any third party.</li>
              <li>Operating the software at a location other than the Licensed Location without written approval from Parallax Machine Inc.</li>
            </ul>
            <p className="mt-3">
              <span className="font-bold text-industrial-100">Seat & Location Scope:</span> Each license permits installation on up to one (1) local machine at a single Licensed Location. Operators managing multiple gym branches must obtain a separate license for each location. Multi-location licensing inquiries should be directed to <span className="text-electric-500">parallaxmachineinc@gmail.com</span>.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-industrial-50 uppercase tracking-widest border-b border-obsidian-750 pb-1">
              2. LOCAL DATA STORAGE & PRIVACY
            </h2>
            <p>
              GymEase operates entirely on Licensee&apos;s local computing infrastructure. All membership data is stored in a local SQLite database file (<code className="text-electric-500">gym_ease.db</code>) and is not transmitted to Parallax Machine Inc.&apos;s servers under normal operation.
            </p>
            <p>
              <span className="font-bold text-industrial-100">Telemetry & Update Checks:</span> During automated update checks (see §4), GymEase transmits the following minimal, non-personally-identifiable data to Parallax Machine&apos;s release manifest servers: software version number, operating system type, and an anonymous installation identifier. No membership records, personal data, or usage analytics are included in this transmission.
            </p>
            <p>
              <span className="font-bold text-industrial-100">Data Ownership & Regulatory Compliance:</span> Licensee retains full ownership of all data stored in <code className="text-electric-500">gym_ease.db</code>. Licensee assumes sole legal responsibility for compliance with applicable data protection laws (including but not limited to GDPR, CCPA, and PDPA) covering their members&apos; personal data. This includes maintaining lawful basis for processing, honoring subject access requests, and implementing appropriate technical safeguards.
            </p>
            <p>
              <span className="font-bold text-industrial-100">Data Retention Upon Termination:</span> Upon termination or non-renewal of this license, Parallax Machine does not hold or process member data. Licensee is solely responsible for securely deleting or archiving member personal data in accordance with applicable law. Parallax Machine recommends retaining a final encrypted backup for a minimum of 12 months unless legal obligations specify otherwise.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-industrial-50 uppercase tracking-widest border-b border-obsidian-750 pb-1">
              3. DATA LOSS & SYSTEM BACKUPS
            </h2>
            <p>
              GymEase performs automatic local backups on every application startup and at 30-minute intervals during active operation. Backups are stored at:
              <br />
              <code className="text-electric-500">Documents/GymEase_Backups/</code>
            </p>
            <p>
              A rolling retention policy preserves the five (5) most recent backup files. Licensee should be aware that this provides approximately 2–2.5 hours of recovery coverage. Parallax Machine strongly recommends supplementing this with:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-industrial-450">
              <li>A daily full backup to an external drive or network-attached storage.</li>
              <li>Periodic off-site or cloud backup of the <code className="text-industrial-200">GymEase_Backups</code> folder using Licensee&apos;s own secure tooling.</li>
              <li>Quarterly test restores to validate backup integrity.</li>
            </ul>
            <div className="bg-steelgold-500/10 border-l-2 border-steelgold-500 p-3 text-steelgold-500 rounded-r text-[11px]">
              <span className="font-bold">⚠ Note:</span> Directly modifying <code className="text-industrial-50 font-bold">gym_ease.db</code> via external SQLite clients may corrupt primary key indexing and break internal synchronisation, causing unexpected application crashes. Always use GymEase&apos;s built-in export and data management tools for any data operations.
            </div>
            <p>
              Parallax Machine Inc. holds no liability for data corruption, hardware failure, ransomware events, or backup storage device issues. Licensees operating in jurisdictions with statutory data retention obligations (e.g., financial records under GDPR Article 5) are responsible for ensuring their backup strategy meets those requirements.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-industrial-50 uppercase tracking-widest border-b border-obsidian-750 pb-1">
              4. AUTOMATED RUNTIME UPDATES
            </h2>
            <p>
              GymEase periodically checks for updates against Parallax Machine&apos;s remote release manifest. The following update behaviour applies:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-industrial-450">
              <li>Update availability checks occur automatically at application launch and at configurable intervals (default: 24 hours).</li>
              <li>Downloading an update requires explicit manual confirmation by an authorised operator.</li>
              <li>Installation is deferred until the operator confirms a restart or the application is quit normally.</li>
              <li>If the application is terminated abnormally during installation, GymEase will attempt an automatic rollback to the previous version on next launch.</li>
            </ul>
            <p>
              <span className="font-bold text-industrial-100">Rollback & Schema Compatibility:</span> Database schema migrations applied during an update are one-directional. Rollback will restore application binaries, but schema changes applied to <code className="text-electric-500">gym_ease.db</code> may not be reversible. Parallax Machine strongly advises verifying that a valid backup exists before confirming any update installation.
            </p>
            <p className="text-steelgold-500">
              Failing to install updates in a timely manner may result in database schema version mismatches that cause application instability.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-industrial-50 uppercase tracking-widest border-b border-obsidian-750 pb-1">
              5. WARRANTY & SUPPORT DISCLAIMER
            </h2>
            <p className="uppercase font-bold text-industrial-250">
              THE SOFTWARE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. PARALLAX MACHINE INC. DOES NOT GUARANTEE UNINTERRUPTED OPERATION, ERROR-FREE PERFORMANCE, OR COMPATIBILITY WITH THIRD-PARTY OPERATING SYSTEM MODIFICATIONS, ANTIVIRUS SOFTWARE, OR HARDWARE CONFIGURATIONS NOT LISTED IN THE SYSTEM REQUIREMENTS.
            </p>
            <p>
              <span className="font-bold text-industrial-100">Technical Support:</span> Access to technical support is not included under this Agreement by default. Support is available under separately purchased Service Level Agreements (SLAs). Licensees without an active SLA may access community documentation and self-service resources at <span className="text-electric-500">support.parallaxmachine.com</span>. Parallax Machine reserves the right to modify support offerings with 30 days&apos; notice.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-industrial-50 uppercase tracking-widest border-b border-obsidian-750 pb-1">
              6. ACCEPTABLE USE RESTRICTIONS
            </h2>
            <p className="font-bold text-industrial-200">Licensee agrees not to use GymEase in any manner that:</p>
            <ul className="list-disc pl-5 space-y-1 text-industrial-450">
              <li>Violates any applicable local, national, or international law or regulation.</li>
              <li>Involves processing data of individuals under the age of 16 without verifiable parental or guardian consent where required by law.</li>
              <li>Circumvents, disables, or tampers with any licensing, access control, or authentication mechanisms within the software.</li>
              <li>Is used to provide gym management services to third-party operators not covered by this Agreement.</li>
              <li>Involves automated bulk extraction of member data for purposes unrelated to gym operations.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-industrial-50 uppercase tracking-widest border-b border-obsidian-750 pb-1">
              7. LICENSE TERM & TERMINATION
            </h2>
            <p>
              This Agreement commences on the date of first installation and continues for the subscription or perpetual period specified in the purchase order (&quot;License Term&quot;).
            </p>
            <p>
              <span className="font-bold text-industrial-100">Termination by Licensee:</span> Licensee may terminate this Agreement at any time by ceasing use of the software and destroying all copies. No refunds are provided for unused subscription periods unless explicitly stated in the purchase order.
            </p>
            <p>
              <span className="font-bold text-industrial-100">Termination by Parallax Machine:</span> Parallax Machine may revoke this license immediately upon written notice if Licensee: (a) materially breaches any provision of this Agreement and fails to remedy such breach within 14 days of written notice; (b) becomes insolvent or enters into administration; or (c) engages in prohibited use as described in §6.
            </p>
            <p>
              <span className="font-bold text-industrial-100">Effect of Termination:</span> Upon termination: (i) all license rights granted herein immediately cease; (ii) Licensee must uninstall and destroy all copies of the software; and (iii) Licensee remains solely responsible for the secure handling of any retained member data in accordance with applicable law. Sections 2, 3 (liability), 5, 8, 9, 10, and 11 survive termination.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-industrial-50 uppercase tracking-widest border-b border-obsidian-750 pb-1">
              8. LIMITATION OF LIABILITY
            </h2>
            <p className="uppercase font-bold text-industrial-250">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL PARALLAX MACHINE INC., ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, LOSS OF DATA, BUSINESS INTERRUPTION, OR LOSS OF GOODWILL, ARISING OUT OF OR IN CONNECTION WITH THIS AGREEMENT OR THE USE OF THE SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p>
              Parallax Machine&apos;s total aggregate liability to Licensee for any claims arising under or related to this Agreement shall not exceed the total fees paid by Licensee for the Software in the twelve (12) months preceding the event giving rise to the claim.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-industrial-50 uppercase tracking-widest border-b border-obsidian-750 pb-1">
              9. INDEMNIFICATION
            </h2>
            <p>
              Licensee agrees to indemnify, defend, and hold harmless Parallax Machine Inc. and its affiliates, officers, employees, and agents from and against any claims, liabilities, damages, judgments, and costs (including reasonable legal fees) arising out of or relating to: (a) Licensee&apos;s use of the software in violation of this Agreement; (b) Licensee&apos;s failure to comply with applicable data protection or privacy laws; or (c) any claim by a third party arising from Licensee&apos;s handling of member personal data.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-industrial-50 uppercase tracking-widest border-b border-obsidian-750 pb-1">
              10. SOFTWARE DISCONTINUATION & END-OF-LIFE
            </h2>
            <p>
              In the event Parallax Machine Inc. decides to discontinue GymEase or cease active development:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-industrial-450">
              <li>Parallax Machine will provide a minimum of 90 days&apos; advance written notice to all active Licensees.</li>
              <li>During this notice period, Licensee retains full access to existing features and all locally stored data.</li>
              <li>Parallax Machine will provide a data export utility enabling Licensee to export all member and operational data in a portable format (CSV or JSON) prior to end-of-life.</li>
              <li>No further update, security patch, or support obligations shall apply after the end-of-life date.</li>
            </ul>
            <p>
              Parallax Machine expressly disclaims any obligation to maintain GymEase indefinitely. Licensees are advised to maintain current data exports as a matter of operational continuity planning.
            </p>
          </section>

          {/* Section 11 */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-industrial-50 uppercase tracking-widest border-b border-obsidian-750 pb-1">
              11. GOVERNING LAW & DISPUTE RESOLUTION
            </h2>
            <p>
              This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.
            </p>
            <p>
              Any dispute, controversy, or claim arising out of or relating to this Agreement, or the breach, termination, or validity thereof, shall first be submitted to good-faith mediation between the parties. If mediation fails to resolve the dispute within 30 days, the matter shall be resolved by binding arbitration in accordance with the rules of the American Arbitration Association, with proceedings conducted in English in Wilmington, Delaware.
            </p>
            <p>
              Notwithstanding the above, either party may seek injunctive or other equitable relief in any court of competent jurisdiction to prevent irreparable harm, including but not limited to protection of intellectual property or confidential information.
            </p>
          </section>

          {/* Section 12 */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-industrial-50 uppercase tracking-widest border-b border-obsidian-750 pb-1">
              12. GENERAL PROVISIONS
            </h2>
            <p>
              <span className="font-bold text-industrial-100">Entire Agreement:</span> This Agreement, together with any applicable purchase order or SLA, constitutes the entire agreement between the parties with respect to the subject matter herein and supersedes all prior or contemporaneous representations, understandings, or agreements.
            </p>
            <p>
              <span className="font-bold text-industrial-100">Amendments:</span> Parallax Machine reserves the right to update these Terms at any time. Licensees will be notified of material changes via the in-application notification system and/or email at least 30 days before changes take effect. Continued use of the software after the effective date constitutes acceptance of the revised terms.
            </p>
            <p>
              <span className="font-bold text-industrial-100">Severability:</span> If any provision of this Agreement is found to be unenforceable or invalid under applicable law, such provision will be modified to the minimum extent necessary to make it enforceable, and the remainder of the Agreement will continue in full force and effect.
            </p>
            <p>
              <span className="font-bold text-industrial-100">Waiver:</span> Failure by either party to enforce any provision of this Agreement shall not constitute a waiver of future enforcement of that or any other provision.
            </p>
            <p>
              <span className="font-bold text-industrial-100">Assignment:</span> Licensee may not assign or transfer this Agreement or any rights hereunder without the prior written consent of Parallax Machine Inc. Parallax Machine may assign this Agreement in connection with a merger, acquisition, or sale of all or substantially all of its assets.
            </p>
            <p>
              <span className="font-bold text-industrial-100">Contact:</span> For licensing inquiries: <span className="text-electric-500">parallaxmachineinc@gmail.com</span>. For support: <span className="text-electric-500">parallaxmachineinc@gmail.com</span>. For legal notices: <span className="text-electric-500">parallaxmachineinc@gmail.com</span>. | Parallax Machine Inc., 1234 Innovation Drive, Wilmington, DE 19801, USA
            </p>
          </section>

        </main>

        {/* Footer */}
        <footer className="border-t border-obsidian-600 bg-obsidian-900/30 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="font-mono text-[9px] text-obsidian-600 uppercase tracking-wider">
            &copy; 2025 Parallax Machine Inc. All rights reserved.
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-1.5 bg-electric-500 hover:bg-electric-600 text-white rounded font-mono text-[10px] uppercase tracking-wider transition-colors"
          >
            Acknowledge & Return
          </button>
        </footer>

      </div>
    </div>
  );
}
