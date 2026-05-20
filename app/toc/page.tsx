'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Search, CheckCircle, Settings, ShieldCheck, 
  Users, CreditCard, Receipt, Target, UploadCloud, 
  Wallet, BarChart3, LayoutDashboard, KeyRound, Monitor 
} from 'lucide-react';

interface TocItem {
  id: string;
  title: string;
  category: 'dashboard' | 'modules' | 'auth' | 'desktop';
  description: string;
  features: string[];
  icon: any;
  testNotes?: string;
}

const TOC_ITEMS: TocItem[] = [
  {
    id: 'owner-dashboard',
    title: 'Owner Dashboard',
    category: 'dashboard',
    description: 'Central operations center for facility owners.',
    icon: LayoutDashboard,
    features: [
      'Overview of active and inactive members count',
      'Real-time collection summaries',
      'Actionable indicators for unpaid and partial member accounts',
      'Visual breakdown of recent check-ins'
    ],
    testNotes: 'Log in as a user with the "owner" role.'
  },
  {
    id: 'trainer-dashboard',
    title: 'Trainer Dashboard',
    category: 'dashboard',
    description: 'Simplified dashboard tailored for trainers and coaching staff.',
    icon: LayoutDashboard,
    features: [
      'Personalized schedule and trainer metrics display',
      'Simplified members roster access'
    ],
    testNotes: 'Log in as a user with the "trainer" role.'
  },
  {
    id: 'member-management',
    title: 'Member Management',
    category: 'modules',
    description: 'Complete administration panel for gym members.',
    icon: Users,
    features: [
      'Comprehensive members table with search and filtering',
      'Add, edit, or deactivate member profiles',
      'Filter by paid, unpaid, or partially paid status',
      'Track subscription status and join dates'
    ],
    testNotes: 'Accessed via the "Members" tab on the sidebar.'
  },
  {
    id: 'fee-plan-management',
    title: 'Fee Plan Configuration',
    category: 'modules',
    description: 'Define and configure membership pricing plans.',
    icon: CreditCard,
    features: [
      'Define membership durations (Daily, Weekly, Monthly, Annual)',
      'Set custom subscription fees and tax rules',
      'Active status controls for older plans'
    ],
    testNotes: 'Managed in the "Fee Plans" tab.'
  },
  {
    id: 'expense-management',
    title: 'Expense Management',
    category: 'modules',
    description: 'Track and log facility expenditures and staff salaries.',
    icon: Receipt,
    features: [
      'Log recurring utilities, maintenance, or equipment costs',
      'Smart Categories: "Salaries" category displays a trainer selection dropdown instead of a generic description text field'
    ],
    testNotes: 'Add an expense with category "Salaries" to test the trainer dropdown logic.'
  },
  {
    id: 'lead-management',
    title: 'Leads Tracker',
    category: 'modules',
    description: 'CRM tool for capturing and managing gym membership leads.',
    icon: Target,
    features: [
      'Record new leads with contact details and current interest',
      'Update lead status from Cold/Warm to Hot/Joined',
      'Follow-up log tracking'
    ],
    testNotes: 'Track status changes in the "Leads" tab.'
  },
  {
    id: 'staff-management',
    title: 'Staff & Trainer Management',
    category: 'modules',
    description: 'Manage gym personnel, access rights, and trainer profiles.',
    icon: ShieldCheck,
    features: [
      'Synchronized staff profile and authentication database record creation',
      'Reset password or revoke credentials (requires admin validation passcode)',
      'Soft Deletion: Deleting an active staff member marks them as inactive',
      'Hard Deletion: Deleting an inactive staff member permanently removes them and clears all associated login records'
    ],
    testNotes: 'Test deactivating an active trainer first, then permanently delete them when they appear in the inactive list.'
  },
  {
    id: 'bulk-import',
    title: 'Bulk Member Import',
    category: 'modules',
    description: 'CSV parser for mass importing member directories.',
    icon: UploadCloud,
    features: [
      'Download pre-formatted import CSV template',
      'Upload CSV files with direct parsing validations',
      'Clear, side-by-side split screen view'
    ],
    testNotes: 'Upload a test CSV to verify parsing results before committing to the DB.'
  },
  {
    id: 'payment-logs',
    title: 'Payment & Receipts Ledger',
    category: 'modules',
    description: 'History of all financial transactions.',
    icon: Wallet,
    features: [
      'Log custom member payments (Full or Partial)',
      'Search and filter payment receipts'
    ],
    testNotes: 'View recorded payments in the "Payments" tab.'
  },
  {
    id: 'reports-analytics',
    title: 'Reports & Analytics',
    category: 'modules',
    description: 'Deep-dive charts and financial breakdowns.',
    icon: BarChart3,
    features: [
      'Interactive financial collection charts',
      'Export financial logs directly to spreadsheet formats (CSV)',
      'Category-wise expenses distribution charts'
    ],
    testNotes: 'Test export button to verify CSV generation.'
  },
  {
    id: 'auth-core',
    title: 'Authentication & Account Core',
    category: 'auth',
    description: 'Secure credentials gating for the system.',
    icon: KeyRound,
    features: [
      'Case-insensitive matching (COLLATE NOCASE) for robust email entry',
      'Synchronized update triggers to propagate changes from staff to credentials'
    ],
    testNotes: 'Log in using different capitalization variations of the same email to verify case insensitivity.'
  },
  {
    id: 'desktop-shell',
    title: 'Desktop Shell & Auto-Updater',
    category: 'desktop',
    description: 'Electron framework configuration and automated tasks.',
    icon: Monitor,
    features: [
      'Automatic SQLite database backup on startup and every 30 minutes (retaining the latest 5 backups)',
      'On-start update checking via electron-updater matching remote latest.yml',
      'Prompt user before downloading the update package',
      'Interactive prompt to restart and apply updates upon download completion'
    ],
    testNotes: 'Runs only in packaged builds (.exe).'
  }
];

export default function TocPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'dashboard' | 'modules' | 'auth' | 'desktop'>('all');

  const filteredItems = TOC_ITEMS.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.features.some(f => f.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-obsidian-900 text-industrial-300 font-sans selection:bg-electric-500 selection:text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-obsidian-600 pb-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button 
                onClick={() => router.push('/')}
                className="p-2 hover:bg-obsidian-800 border border-obsidian-600 rounded text-industrial-50 transition-colors"
                title="Back to Home"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-3xl font-bold uppercase tracking-widest text-industrial-50">System Table of Contents</h1>
            </div>
            <p className="text-industrial-400 font-mono text-xs uppercase tracking-wider">
              GymEase Feature Index & Verification Guide
            </p>
          </div>
          
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 bg-electric-500 hover:bg-electric-600 text-white rounded font-medium transition-colors uppercase tracking-widest font-mono text-xs"
          >
            Go to Terminal
          </button>
        </header>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center bg-obsidian-800 border border-obsidian-600 p-4 rounded">
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 text-obsidian-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search features, test details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:outline-none focus:border-electric-500 transition-colors font-mono text-xs"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {(['all', 'dashboard', 'modules', 'auth', 'desktop'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded font-mono text-[10px] uppercase tracking-wider transition-colors border ${
                  categoryFilter === cat 
                    ? 'bg-electric-500 text-white border-electric-500' 
                    : 'bg-obsidian-900 text-industrial-400 border-obsidian-600 hover:text-industrial-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredItems.map(item => {
            const Icon = item.icon;
            return (
              <div 
                key={item.id}
                className="bg-obsidian-800 border border-obsidian-600 rounded p-6 flex flex-col justify-between hover:border-electric-500 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-obsidian-900 border border-obsidian-600 rounded text-electric-500 group-hover:text-electric-400 transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-industrial-50 uppercase tracking-tight group-hover:text-electric-500 transition-colors">
                          {item.title}
                        </h3>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-obsidian-600 bg-obsidian-900 border border-obsidian-600/50 px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-industrial-300 text-sm mb-4 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="space-y-2 mb-6">
                    <h4 className="font-mono text-[10px] uppercase tracking-wider text-industrial-400">Key Features:</h4>
                    <ul className="space-y-1.5">
                      {item.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-industrial-400 leading-snug">
                          <CheckCircle className="w-3.5 h-3.5 text-electric-500 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {item.testNotes && (
                  <div className="mt-auto pt-4 border-t border-obsidian-600/40 font-mono text-[10px] text-steelgold-500 uppercase tracking-wider bg-steelgold-500/5 p-2.5 border-l-2 border-l-steelgold-500 rounded-r">
                    <span className="font-bold">Testing Guidance:</span> {item.testNotes}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-16 bg-obsidian-800 border border-obsidian-600 rounded">
            <Settings className="w-12 h-12 text-obsidian-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-bold text-industrial-50 uppercase tracking-widest mb-1">No Entries Found</h3>
            <p className="text-industrial-400 text-sm font-mono">Modify search criteria to find pages</p>
          </div>
        )}

        {/* Terms & Conditions Section */}
        <section className="mt-12 bg-obsidian-800 border border-obsidian-600 rounded p-8 font-mono text-xs leading-relaxed">
          <div className="border-b border-obsidian-600 pb-4 mb-6">
            <h2 className="text-xl font-bold uppercase tracking-wider text-industrial-50">
              GymEase — Terms & Conditions of Usage
            </h2>
            <div className="text-[10px] text-industrial-400 mt-1 uppercase tracking-wider">
              Parallax Machine Inc. | Effective Date: January 1, 2025 | Version 1.2
            </div>
          </div>

          <div className="bg-obsidian-900 border border-obsidian-600/40 p-4 rounded text-industrial-300 italic mb-8">
            By installing, activating, or using GymEase software, you (&quot;Licensee&quot;) agree to be bound by these Terms & Conditions (&quot;Agreement&quot;) with Parallax Machine Inc. (&quot;Parallax Machine&quot;, &quot;we&quot;, &quot;us&quot;). If you do not agree, do not install or use the software.
          </div>

          <div className="space-y-8">
            {/* 1 */}
            <div className="space-y-2">
              <h4 className="text-industrial-50 font-bold uppercase tracking-widest border-b border-obsidian-750 pb-1">
                1. SOFTWARE LICENSE & DISTRIBUTION
              </h4>
              <p>
                GymEase is proprietary software developed by Parallax Machine Inc. Subject to full compliance with this Agreement, Licensee is granted a non-exclusive, non-transferable, revocable license to deploy and operate GymEase within the specific physical fitness facility identified at time of purchase (&quot;Licensed Location&quot;).
              </p>
              <p className="font-bold text-industrial-250">The following are expressly prohibited:</p>
              <ul className="list-disc pl-5 space-y-1 text-industrial-400">
                <li>Copying, redistributing, sublicensing, or reselling the software or any component thereof.</li>
                <li>Decompiling, reverse-engineering, or disassembling packaged binaries.</li>
                <li>Hosting GymEase as a shared or multi-tenant service (SaaS) for any third party.</li>
                <li>Operating the software at a location other than the Licensed Location without written approval from Parallax Machine Inc.</li>
              </ul>
              <p>
                <span className="font-bold text-industrial-100">Seat & Location Scope:</span> Each license permits installation on up to one (1) local machine at a single Licensed Location. Operators managing multiple gym branches must obtain a separate license for each location. Multi-location licensing inquiries should be directed to parallaxmachineinc@gmail.com.
              </p>
            </div>

            {/* 2 */}
            <div className="space-y-2">
              <h4 className="text-industrial-50 font-bold uppercase tracking-widest border-b border-obsidian-750 pb-1">
                2. LOCAL DATA STORAGE & PRIVACY
              </h4>
              <p>
                GymEase operates entirely on Licensee&apos;s local computing infrastructure. All membership data is stored in a local SQLite database file (gym_ease.db) and is not transmitted to Parallax Machine Inc.&apos;s servers under normal operation.
              </p>
              <p>
                <span className="font-bold text-industrial-100">Telemetry & Update Checks:</span> During automated update checks (see §4), GymEase transmits the following minimal, non-personally-identifiable data to Parallax Machine&apos;s release manifest servers: software version number, operating system type, and an anonymous installation identifier. No membership records, personal data, or usage analytics are included in this transmission.
              </p>
              <p>
                <span className="font-bold text-industrial-100">Data Ownership & Regulatory Compliance:</span> Licensee retains full ownership of all data stored in gym_ease.db. Licensee assumes sole legal responsibility for compliance with applicable data protection laws (including but not limited to GDPR, CCPA, and PDPA) covering their members&apos; personal data. This includes maintaining lawful basis for processing, honoring subject access requests, and implementing appropriate technical safeguards.
              </p>
              <p>
                <span className="font-bold text-industrial-100">Data Retention Upon Termination:</span> Upon termination or non-renewal of this license, Parallax Machine does not hold or process member data. Licensee is solely responsible for securely deleting or archiving member personal data in accordance with applicable law. Parallax Machine recommends retaining a final encrypted backup for a minimum of 12 months unless legal obligations specify otherwise.
              </p>
            </div>

            {/* 3 */}
            <div className="space-y-2">
              <h4 className="text-industrial-50 font-bold uppercase tracking-widest border-b border-obsidian-750 pb-1">
                3. DATA LOSS & SYSTEM BACKUPS
              </h4>
              <p>
                GymEase performs automatic local backups on every application startup and at 30-minute intervals during active operation. Backups are stored at: Documents/GymEase_Backups/
              </p>
              <p>
                A rolling retention policy preserves the five (5) most recent backup files. Licensee should be aware that this provides approximately 2–2.5 hours of recovery coverage. Parallax Machine strongly recommends supplementing this with:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-industrial-400">
                <li>A daily full backup to an external drive or network-attached storage.</li>
                <li>Periodic off-site or cloud backup of the GymEase_Backups folder using Licensee&apos;s own secure tooling.</li>
                <li>Quarterly test restores to validate backup integrity.</li>
              </ul>
              <div className="bg-steelgold-500/10 border-l-2 border-steelgold-500 p-3 text-steelgold-500 rounded-r text-[11px]">
                <span className="font-bold">⚠ Note:</span> Directly modifying gym_ease.db via external SQLite clients may corrupt primary key indexing and break internal synchronisation, causing unexpected application crashes. Always use GymEase&apos;s built-in export and data management tools for any data operations.
              </div>
              <p>
                Parallax Machine Inc. holds no liability for data corruption, hardware failure, ransomware events, or backup storage device issues. Licensees operating in jurisdictions with statutory data retention obligations (e.g., financial records under GDPR Article 5) are responsible for ensuring their backup strategy meets those requirements.
              </p>
            </div>

            {/* 4 */}
            <div className="space-y-2">
              <h4 className="text-industrial-50 font-bold uppercase tracking-widest border-b border-obsidian-750 pb-1">
                4. AUTOMATED RUNTIME UPDATES
              </h4>
              <p>
                GymEase periodically checks for updates against Parallax Machine&apos;s remote release manifest. The following update behaviour applies:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-industrial-400">
                <li>Update availability checks occur automatically at application launch and at configurable intervals (default: 24 hours).</li>
                <li>Downloading an update requires explicit manual confirmation by an authorised operator.</li>
                <li>Installation is deferred until the operator confirms a restart or the application is quit normally.</li>
                <li>If the application is terminated abnormally during installation, GymEase will attempt an automatic rollback to the previous version on next launch.</li>
              </ul>
              <p>
                <span className="font-bold text-industrial-100">Rollback & Schema Compatibility:</span> Database schema migrations applied during an update are one-directional. Rollback will restore application binaries, but schema changes applied to gym_ease.db may not be reversible. Parallax Machine strongly advises verifying that a valid backup exists before confirming any update installation.
              </p>
              <p className="text-steelgold-500">
                Failing to install updates in a timely manner may result in database schema version mismatches that cause application instability.
              </p>
            </div>

            {/* 5 */}
            <div className="space-y-2">
              <h4 className="text-industrial-50 font-bold uppercase tracking-widest border-b border-obsidian-750 pb-1">
                5. WARRANTY & SUPPORT DISCLAIMER
              </h4>
              <p className="uppercase font-bold text-industrial-250">
                THE SOFTWARE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. PARALLAX MACHINE INC. DOES NOT GUARANTEE UNINTERRUPTED OPERATION, ERROR-FREE PERFORMANCE, OR COMPATIBILITY WITH THIRD-PARTY OPERATING SYSTEM MODIFICATIONS, ANTIVIRUS SOFTWARE, OR HARDWARE CONFIGURATIONS NOT LISTED IN THE SYSTEM REQUIREMENTS.
              </p>
              <p>
                <span className="font-bold text-industrial-100">Technical Support:</span> Access to technical support is not included under this Agreement by default. Support is available under separately purchased Service Level Agreements (SLAs). Licensees without an active SLA may access community documentation and self-service resources at support.parallaxmachine.com. Parallax Machine reserves the right to modify support offerings with 30 days&apos; notice.
              </p>
            </div>

            {/* 6 */}
            <div className="space-y-2">
              <h4 className="text-industrial-50 font-bold uppercase tracking-widest border-b border-obsidian-750 pb-1">
                6. ACCEPTABLE USE RESTRICTIONS
              </h4>
              <p className="font-bold text-industrial-200">Licensee agrees not to use GymEase in any manner that:</p>
              <ul className="list-disc pl-5 space-y-1 text-industrial-400">
                <li>Violates any applicable local, national, or international law or regulation.</li>
                <li>Involves processing data of individuals under the age of 16 without verifiable parental or guardian consent where required by law.</li>
                <li>Circumvents, disables, or tampers with any licensing, access control, or authentication mechanisms within the software.</li>
                <li>Is used to provide gym management services to third-party operators not covered by this Agreement.</li>
                <li>Involves automated bulk extraction of member data for purposes unrelated to gym operations.</li>
              </ul>
            </div>

            {/* 7 */}
            <div className="space-y-2">
              <h4 className="text-industrial-50 font-bold uppercase tracking-widest border-b border-obsidian-750 pb-1">
                7. LICENSE TERM & TERMINATION
              </h4>
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
            </div>

            {/* 8 */}
            <div className="space-y-2">
              <h4 className="text-industrial-50 font-bold uppercase tracking-widest border-b border-obsidian-750 pb-1">
                8. LIMITATION OF LIABILITY
              </h4>
              <p className="uppercase font-bold text-industrial-250">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL PARALLAX MACHINE INC., ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, LOSS OF DATA, BUSINESS INTERRUPTION, OR LOSS OF GOODWILL, ARISING OUT OF OR IN CONNECTION WITH THIS AGREEMENT OR THE USE OF THE SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
              <p>
                Parallax Machine&apos;s total aggregate liability to Licensee for any claims arising under or related to this Agreement shall not exceed the total fees paid by Licensee for the Software in the twelve (12) months preceding the event giving rise to the claim.
              </p>
            </div>

            {/* 9 */}
            <div className="space-y-2">
              <h4 className="text-industrial-50 font-bold uppercase tracking-widest border-b border-obsidian-750 pb-1">
                9. INDEMNIFICATION
              </h4>
              <p>
                Licensee agrees to indemnify, defend, and hold harmless Parallax Machine Inc. and its affiliates, officers, employees, and agents from and against any claims, liabilities, damages, judgments, and costs (including reasonable legal fees) arising out of or relating to: (a) Licensee&apos;s use of the software in violation of this Agreement; (b) Licensee&apos;s failure to comply with applicable data protection or privacy laws; or (c) any claim by a third party arising from Licensee&apos;s handling of member personal data.
              </p>
            </div>

            {/* 10 */}
            <div className="space-y-2">
              <h4 className="text-industrial-50 font-bold uppercase tracking-widest border-b border-obsidian-750 pb-1">
                10. SOFTWARE DISCONTINUATION & END-OF-LIFE
              </h4>
              <p>
                In the event Parallax Machine Inc. decides to discontinue GymEase or cease active development:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-industrial-400">
                <li>Parallax Machine will provide a minimum of 90 days&apos; advance written notice to all active Licensees.</li>
                <li>During this notice period, Licensee retains full access to existing features and all locally stored data.</li>
                <li>Parallax Machine will provide a data export utility enabling Licensee to export all member and operational data in a portable format (CSV or JSON) prior to end-of-life.</li>
                <li>No further update, security patch, or support obligations shall apply after the end-of-life date.</li>
              </ul>
              <p>
                Parallax Machine expressly disclaims any obligation to maintain GymEase indefinitely. Licensees are advised to maintain current data exports as a matter of operational continuity planning.
              </p>
            </div>

            {/* 11 */}
            <div className="space-y-2">
              <h4 className="text-industrial-50 font-bold uppercase tracking-widest border-b border-obsidian-750 pb-1">
                11. GOVERNING LAW & DISPUTE RESOLUTION
              </h4>
              <p>
                This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.
              </p>
              <p>
                Any dispute, controversy, or claim arising out of or relating to this Agreement, or the breach, termination, or validity thereof, shall first be submitted to good-faith mediation between the parties. If mediation fails to resolve the dispute within 30 days, the matter shall be resolved by binding arbitration in accordance with the rules of the American Arbitration Association, with proceedings conducted in English in Wilmington, Delaware.
              </p>
              <p>
                Notwithstanding the above, either party may seek injunctive or other equitable relief in any court of competent jurisdiction to prevent irreparable harm, including but not limited to protection of intellectual property or confidential information.
              </p>
            </div>

            {/* 12 */}
            <div className="space-y-2">
              <h4 className="text-industrial-50 font-bold uppercase tracking-widest border-b border-obsidian-750 pb-1">
                12. GENERAL PROVISIONS
              </h4>
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
                <span className="font-bold text-industrial-100">Contact:</span> For licensing inquiries: parallaxmachineinc@gmail.com. For support: parallaxmachineinc@gmail.com. For legal notices: parallaxmachineinc@gmail.com. | Parallax Machine Inc., 1234 Innovation Drive, Wilmington, DE 19801, USA
              </p>
              <p className="text-[10px] text-obsidian-650 mt-4 font-semibold">
                &copy; 2025 Parallax Machine Inc. All rights reserved.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 text-center text-obsidian-600 font-mono text-[9px] uppercase tracking-widest">
          PARALLAX MACHINE SYSTEM TEST INTERFACE // GYMEASE TOC v2.0
        </footer>

      </div>
    </div>
  );
}
