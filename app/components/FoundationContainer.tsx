'use client';

import React, { useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import type { DriveFileItem } from '@/lib/cmsService';

export type TabId =
  | 'home'
  | 'mission'
  | 'board'
  | 'applications'
  | 'resources'
  | 'donations'
  | 'memorials'
  | 'reports';

interface NavItem {
  id: TabId;
  label: string;
}

interface FoundationProps {
  initialData: {
    mission: string;
    board: string;
    giftpolicies: string;
    giftpolicies_faq: string;
    homeClips: DriveFileItem[];
    memorialItems: DriveFileItem[];
    legacyItems: DriveFileItem[];
    annualReports: DriveFileItem[];
  };
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'mission', label: 'Our Mission' },
  { id: 'board', label: 'Board of Directors' },
  { id: 'applications', label: 'Applications' },
  { id: 'resources', label: 'Resources' },
  { id: 'donations', label: 'Gift Policies' },
  { id: 'memorials', label: 'Memorial & Legacy Gifts' },
  { id: 'reports', label: 'Annual Reports' },
];

export default function FoundationContainer({ initialData }: FoundationProps) {
  const [currentTab, setTab] = useState<TabId>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string>(
    initialData.annualReports[0]?.id || '',
  );

  const currentYear = useSyncExternalStore(
    () => () => {},
    () => new Date().getFullYear(),
    () => 2026,
  );

  const grantAppBaseUrl =
    process.env.NEXT_PUBLIC_GRANT_APP_URL ||
    'https://salcf-grantapplications.vercel.app';

  const handleNavClick = (id: TabId) => {
    setTab(id);
    setMobileMenuOpen(false);
  };

  const normalizeMarkdown = (raw: string) =>
    raw.replace(/\\([*_-])/g, '$1').replace(/\*{3,}/g, '**');

  const renderDatesOrDescription = (
    descString: string | undefined,
    highlightColorClass: string,
  ) => {
    if (!descString) return null;

    if (descString.includes('|')) {
      const splitProfiles = descString.split('|');
      return (
        <div className="space-y-1 mt-1.5">
          {splitProfiles.map((profile, index) => (
            <p
              key={index}
              className={`text-xs font-semibold tracking-wide ${highlightColorClass}`}
            >
              {profile.trim()}
            </p>
          ))}
        </div>
      );
    }

    return (
      <p
        className={`text-xs font-semibold tracking-wide mt-1 ${highlightColorClass}`}
      >
        {descString}
      </p>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#E4E9ED] text-[#2C3E50] font-sans antialiased">
      {/* MOBILE TOP HEADER BAR */}
      <header className="lg:hidden bg-[#1E2736] text-white px-5 py-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/95 p-1 flex items-center justify-center shrink-0">
            <Image
              src="/salcf_logo.png"
              alt="St. Andrew Lutheran Church Foundation Logo"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-white">
              SALC Foundation
            </p>
            <p className="text-[11px] text-[#D4AF37] font-semibold">
              EIN: 93-1055462
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          className="px-3 py-2 rounded-lg bg-white/[0.08] text-white text-xs font-semibold border border-white/15 hover:bg-white/[0.14] transition-colors cursor-pointer"
        >
          {mobileMenuOpen ? 'Close ✕' : 'Menu ☰'}
        </button>
      </header>

      {/* MOBILE BACKDROP OVERLAY */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-[#1E2736]/60 backdrop-blur-xs z-20 lg:hidden"
        />
      )}

      {/* LEFT SIDEBAR NAVIGATION BAR (DEEP MIDNIGHT NAVY #1E2736) */}
      <aside
        className={`w-80 bg-[#1E2736] text-white flex flex-col fixed top-0 left-0 h-full p-6 z-30 shadow-xl transition-transform duration-200 ease-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* BRANDING & LOGO HEADER */}
        <div className="mb-7 text-center pb-6 border-b border-white/10">
          <div className="mb-4 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-white/95 p-2.5 shadow-md flex items-center justify-center">
              <Image
                src="/salcf_logo.png"
                alt="St. Andrew Lutheran Church Foundation Logo"
                width={68}
                height={68}
                className="object-contain"
                priority
              />
            </div>
          </div>

          <h1 className="text-lg font-bold text-white leading-snug tracking-tight">
            St. Andrew Lutheran Church Foundation, Inc.
          </h1>
          <p className="text-xs text-[#A4B3C6] mt-2 font-medium">
            12405 SW Butner Rd, Beaverton, OR 97005
          </p>

          <div className="mt-3.5 flex justify-center">
            <span className="inline-block bg-[#D4AF37]/15 text-[#D4AF37] text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border border-[#D4AF37]/40">
              EIN: 93-1055462
            </span>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-4 py-2.5 rounded-r-lg text-sm transition-all cursor-pointer border-l-4 ${
                  isActive
                    ? 'bg-white/[0.08] border-[#D4AF37] text-white font-semibold'
                    : 'border-transparent text-[#A4B3C6] hover:bg-white/[0.08] hover:text-white font-medium'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* SIDEBAR FOOTER */}
        <div className="pt-4 mt-4 border-t border-white/10 text-[11px] text-[#A4B3C6] font-medium leading-relaxed">
          © {currentYear} SALC Foundation. <br />
          Registered 501(c)(3) Organization.
        </div>
      </aside>

      {/* MAIN CONTENT AREA (MIST BLUE #F0F3F6 WITH #E4E9ED SEPARATION GAP) */}
      <main className="flex-1 lg:ml-[20.75rem] bg-[#F0F3F6] min-h-screen p-5 sm:p-8 lg:p-10">
        <div className="max-w-5xl mx-auto">
          {/* HOME TAB */}
          {currentTab === 'home' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 border border-[#E4E9ED] shadow-[0_4px_20px_-2px_rgba(30,39,54,0.05)]">
                <div className="inline-block h-1 w-12 bg-[#D4AF37] rounded-full mb-4" />
                <h2 className="text-3xl font-extrabold text-[#1E2736] tracking-tight">
                  Welcome to the SALC Foundation
                </h2>
                <p className="text-[#2C3E50] leading-relaxed max-w-2xl mt-3">
                  Providing sustainable resources to fund community ministries,
                  higher education scholarship awards, and long-term structural
                  outreach.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setTab('applications')}
                    className="px-5 py-2.5 rounded-lg bg-[#D4AF37] text-[#1E2736] text-sm font-bold hover:bg-[#c5a028] transition-colors shadow-xs cursor-pointer"
                  >
                    Explore Grants & Scholarships
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('donations')}
                    className="px-5 py-2.5 rounded-lg bg-[#1E2736] text-white text-sm font-semibold hover:bg-[#2a364b] transition-colors cursor-pointer"
                  >
                    Review Gift Policies
                  </button>
                </div>
              </div>

              {/* Media Gallery Card */}
              <div className="bg-white rounded-2xl p-8 border border-[#E4E9ED] shadow-[0_4px_20px_-2px_rgba(30,39,54,0.05)]">
                <h3 className="text-xs font-bold uppercase text-[#1E2736]/70 tracking-wider mb-4">
                  Media Gallery Feed
                </h3>
                {initialData.homeClips.length === 0 ? (
                  <p className="text-sm text-[#2C3E50]/70 italic bg-[#F0F3F6] p-4 rounded-xl">
                    No active clips found in Drive storage.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {initialData.homeClips.map((clip: DriveFileItem) => (
                      <a
                        key={clip.id}
                        href={clip.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="block p-5 bg-[#F0F3F6]/60 border border-[#E4E9ED] rounded-xl hover:border-[#D4AF37] hover:bg-white transition-all shadow-2xs"
                      >
                        <p className="text-sm font-bold text-[#1E2736] truncate">
                          {clip.name}
                        </p>
                        {clip.description && (
                          <p className="text-xs text-[#2C3E50] mt-1.5 leading-relaxed">
                            {clip.description}
                          </p>
                        )}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MISSION TAB */}
          {currentTab === 'mission' && (
            <article className="bg-white rounded-2xl p-8 sm:p-10 border border-[#E4E9ED] shadow-[0_4px_20px_-2px_rgba(30,39,54,0.05)]">
              <div className="inline-block h-1 w-12 bg-[#D4AF37] rounded-full mb-3" />
              <h2 className="text-3xl font-bold text-[#1E2736] mb-6">
                Our Mission
              </h2>
              <div className="prose prose-slate max-w-none text-[#2C3E50] prose-headings:text-[#1E2736] prose-strong:text-[#1E2736]">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {normalizeMarkdown(initialData.mission)}
                </ReactMarkdown>
              </div>
            </article>
          )}

          {/* BOARD TAB */}
          {currentTab === 'board' && (
            <article className="bg-white rounded-2xl p-8 sm:p-10 border border-[#E4E9ED] shadow-[0_4px_20px_-2px_rgba(30,39,54,0.05)]">
              <div className="inline-block h-1 w-12 bg-[#D4AF37] rounded-full mb-3" />
              <h2 className="text-3xl font-bold text-[#1E2736] mb-6">
                Board of Directors
              </h2>
              <div className="prose prose-slate max-w-none text-[#2C3E50] prose-headings:text-[#1E2736] prose-strong:text-[#1E2736] prose-th:bg-[#F0F3F6] prose-th:text-[#1E2736]">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {normalizeMarkdown(initialData.board)}
                </ReactMarkdown>
              </div>
            </article>
          )}

          {/* APPLICATIONS TAB */}
          {currentTab === 'applications' && (
            <div className="bg-white rounded-2xl p-8 sm:p-10 border border-[#E4E9ED] shadow-[0_4px_20px_-2px_rgba(30,39,54,0.05)] space-y-6">
              <div>
                <div className="inline-block h-1 w-12 bg-[#D4AF37] rounded-full mb-3" />
                <h2 className="text-3xl font-bold text-[#1E2736]">
                  Grant & Scholarship Portals
                </h2>
                <p className="text-[#2C3E50] text-sm max-w-2xl mt-2 leading-relaxed">
                  Please verify that your parameters align with our formal
                  Prerequisites and Acceptance Criteria documents prior to
                  submitting your application.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <a
                  href={`${grantAppBaseUrl}/apply/grant`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-6 bg-[#F0F3F6]/50 border border-[#E4E9ED] rounded-xl hover:border-[#D4AF37] hover:bg-white transition-all group shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <h4 className="text-lg font-bold text-[#1E2736] group-hover:text-[#1E2736]">
                      Request a Grant
                    </h4>
                    <p className="text-xs text-[#2C3E50] mt-2 leading-relaxed">
                      Submit funding requests for active congregational
                      initiatives or community outreach programs.
                    </p>
                  </div>
                  <div className="mt-5">
                    <span className="inline-block px-4 py-2 rounded-lg bg-[#D4AF37] text-[#1E2736] text-xs font-bold group-hover:bg-[#c5a028] transition-colors">
                      Start Grant Application →
                    </span>
                  </div>
                </a>

                <a
                  href={`${grantAppBaseUrl}/apply/scholarship`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-6 bg-[#F0F3F6]/50 border border-[#E4E9ED] rounded-xl hover:border-[#D4AF37] hover:bg-white transition-all group shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <h4 className="text-lg font-bold text-[#1E2736] group-hover:text-[#1E2736]">
                      Academic Scholarships
                    </h4>
                    <p className="text-xs text-[#2C3E50] mt-2 leading-relaxed">
                      Submit higher learning scholarship applications for active
                      students.
                    </p>
                  </div>
                  <div className="mt-5">
                    <span className="inline-block px-4 py-2 rounded-lg bg-[#D4AF37] text-[#1E2736] text-xs font-bold group-hover:bg-[#c5a028] transition-colors">
                      Start Scholarship Application →
                    </span>
                  </div>
                </a>
              </div>
            </div>
          )}

          {/* RESOURCES TAB */}
          {currentTab === 'resources' && (
            <div className="bg-white rounded-2xl p-8 sm:p-10 border border-[#E4E9ED] shadow-[0_4px_20px_-2px_rgba(30,39,54,0.05)] space-y-6">
              <div>
                <div className="inline-block h-1 w-12 bg-[#D4AF37] rounded-full mb-3" />
                <h2 className="text-3xl font-bold text-[#1E2736]">
                  ELCA Foundation Resources
                </h2>
                <p className="text-sm text-[#2C3E50] mt-2">
                  Explore legacy planning guides, gift matrices, and educational
                  materials provided through the ELCA Foundation.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    label: 'ELCA Foundation Planning Documents',
                    href: 'https://elca.org',
                  },
                  {
                    label: 'ELCA Foundation Gift Planning Matrix',
                    href: 'https://elca.org',
                  },
                  {
                    label: 'ELCA Foundation Educational Videos',
                    href: 'https://elca.org',
                  },
                ].map((resource) => (
                  <a
                    key={resource.label}
                    href={resource.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-[#F0F3F6]/60 border border-[#E4E9ED] rounded-xl text-[#1E2736] hover:border-[#D4AF37] hover:bg-white transition-all group"
                  >
                    <span className="text-sm font-semibold">
                      {resource.label}
                    </span>
                    <span className="text-xs font-bold text-[#1E2736] bg-[#D4AF37]/20 px-2.5 py-1 rounded-md group-hover:bg-[#D4AF37] transition-colors">
                      External Site ↗
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* DONATIONS / GIFT POLICIES TAB */}
          {currentTab === 'donations' && (
            <div className="space-y-6">
              <article className="bg-white rounded-2xl p-8 sm:p-10 border border-[#E4E9ED] shadow-[0_4px_20px_-2px_rgba(30,39,54,0.05)]">
                <div className="inline-block h-1 w-12 bg-[#D4AF37] rounded-full mb-3" />
                <h2 className="text-3xl font-bold text-[#1E2736] mb-6">
                  Gift Policies
                </h2>
                <div className="prose prose-slate max-w-none text-[#2C3E50] prose-headings:text-[#1E2736] prose-strong:text-[#1E2736]">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {normalizeMarkdown(initialData.giftpolicies)}
                  </ReactMarkdown>
                </div>
              </article>

              <article className="bg-white rounded-2xl p-8 sm:p-10 border border-[#E4E9ED] shadow-[0_4px_20px_-2px_rgba(30,39,54,0.05)]">
                <div className="inline-block h-1 w-12 bg-[#D4AF37] rounded-full mb-3" />
                <h3 className="text-2xl font-bold text-[#1E2736] mb-6">
                  Gift Policies FAQ
                </h3>
                <div className="prose prose-slate max-w-none text-[#2C3E50] prose-headings:text-[#1E2736] prose-strong:text-[#1E2736]">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {normalizeMarkdown(initialData.giftpolicies_faq)}
                  </ReactMarkdown>
                </div>
              </article>
            </div>
          )}

          {/* MEMORIALS & LEGACY TAB */}
          {currentTab === 'memorials' && (
            <div className="space-y-8">
              {/* MEMORIAL GIFTS */}
              <section className="bg-white rounded-2xl p-8 sm:p-10 border border-[#E4E9ED] shadow-[0_4px_20px_-2px_rgba(30,39,54,0.05)] space-y-5">
                <div>
                  <div className="inline-block h-1 w-12 bg-[#D4AF37] rounded-full mb-3" />
                  <h2 className="text-3xl font-bold text-[#1E2736] tracking-tight">
                    Memorial Gifts
                  </h2>
                  <p className="text-[#2C3E50] text-sm max-w-2xl mt-2">
                    In grateful remembrance of those whose lives and legacy
                    continue to strengthen our community.
                  </p>
                </div>

                {initialData.memorialItems.length === 0 ? (
                  <p className="text-xs text-[#2C3E50]/70 italic bg-[#F0F3F6] p-4 rounded-xl">
                    No active memorial records found.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4 pt-2">
                    {initialData.memorialItems.map((gift) => (
                      <div
                        key={gift.id}
                        className="flex flex-col sm:flex-row items-start bg-[#F0F3F6]/50 border border-[#E4E9ED] rounded-xl p-5 gap-6 hover:bg-white hover:border-[#D4AF37]/60 transition-all"
                      >
                        <div className="w-32 h-32 bg-white rounded-lg overflow-hidden shrink-0 border border-[#E4E9ED] relative shadow-2xs">
                          <Image
                            src={gift.imageUrl || '/placeholder-memorial.png'}
                            alt={gift.name}
                            fill
                            sizes="128px"
                            className="object-cover"
                            priority={false}
                          />
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-start">
                          <h3 className="text-xl font-bold text-[#1E2736] tracking-tight leading-tight">
                            {gift.name}
                          </h3>
                          {renderDatesOrDescription(
                            gift.description,
                            'text-[#8A6D1B] uppercase',
                          )}

                          {gift.subjects && gift.subjects.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-[#E4E9ED]">
                              <span className="text-[10px] font-bold text-[#1E2736]/60 block uppercase tracking-wider mb-1">
                                Memorial Donors
                              </span>
                              <p className="text-xs text-[#2C3E50] font-medium leading-relaxed">
                                {gift.subjects
                                  .join(', ')
                                  .replace(/,\s*/g, ', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* LEGACY GIFTS */}
              <section className="bg-white rounded-2xl p-8 sm:p-10 border border-[#E4E9ED] shadow-[0_4px_20px_-2px_rgba(30,39,54,0.05)] space-y-5">
                <div>
                  <div className="inline-block h-1 w-12 bg-[#D4AF37] rounded-full mb-3" />
                  <h2 className="text-3xl font-bold text-[#1E2736] tracking-tight">
                    Legacy Gifts
                  </h2>
                  <p className="text-[#2C3E50] text-sm max-w-2xl mt-2">
                    Recognizing sustained impact from estate planning, trusts,
                    and perpetual outreach endowments.
                  </p>
                </div>

                {initialData.legacyItems.length === 0 ? (
                  <p className="text-xs text-[#2C3E50]/70 italic bg-[#F0F3F6] p-4 rounded-xl">
                    No active estate provisions cataloged.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4 pt-2">
                    {initialData.legacyItems.map((estate) => (
                      <div
                        key={estate.id}
                        className="flex flex-col sm:flex-row items-start bg-[#F0F3F6]/50 border border-[#E4E9ED] rounded-xl p-5 gap-6 hover:bg-white hover:border-[#D4AF37]/60 transition-all"
                      >
                        <div className="w-32 h-32 bg-white rounded-lg overflow-hidden shrink-0 border border-[#E4E9ED] relative shadow-2xs">
                          <Image
                            src={estate.imageUrl || '/placeholder-legacy.png'}
                            alt={estate.name}
                            fill
                            sizes="128px"
                            className="object-cover"
                            priority={false}
                          />
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-start">
                          <h3 className="text-xl font-bold text-[#1E2736] tracking-tight leading-tight">
                            {estate.name}
                          </h3>
                          {renderDatesOrDescription(
                            estate.description,
                            'text-[#1E2736]/80',
                          )}

                          {estate.subjects && estate.subjects.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-[#E4E9ED]">
                              <span className="text-[10px] font-bold text-[#1E2736]/60 block uppercase tracking-wider mb-1">
                                Trustees / Executors
                              </span>
                              <p className="text-xs text-[#2C3E50] font-medium leading-relaxed">
                                {estate.subjects
                                  .join(', ')
                                  .replace(/,\s*/g, ', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* REPORTS TAB */}
          {currentTab === 'reports' && (
            <div className="bg-white rounded-2xl p-8 sm:p-10 border border-[#E4E9ED] shadow-[0_4px_20px_-2px_rgba(30,39,54,0.05)] space-y-6">
              <div>
                <div className="inline-block h-1 w-12 bg-[#D4AF37] rounded-full mb-3" />
                <h2 className="text-3xl font-bold text-[#1E2736] mb-2">
                  Annual Reports Archive
                </h2>
                <p className="text-[#2C3E50] text-sm">
                  Comprehensive financial and stewardship reports for the
                  Foundation.
                </p>
              </div>

              {initialData.annualReports.length === 0 ? (
                <p className="text-xs text-[#2C3E50]/70 italic bg-[#F0F3F6] p-4 rounded-xl">
                  No annual reports available at this time.
                </p>
              ) : (
                <>
                  {/* Report Selector Tabs */}
                  <div className="flex flex-wrap gap-2.5 border-b border-[#E4E9ED] pb-4">
                    {initialData.annualReports.map((report) => {
                      const isSelected = report.id === selectedReportId;
                      return (
                        <button
                          key={report.id}
                          onClick={() => setSelectedReportId(report.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-[#1E2736] text-white border-[#1E2736] shadow-xs ring-2 ring-[#D4AF37]/60'
                              : 'bg-[#F0F3F6] text-[#2C3E50] border-[#E4E9ED] hover:bg-[#E4E9ED]'
                          }`}
                        >
                          {report.name}
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Report Inline Content */}
                  {(() => {
                    const activeReport =
                      initialData.annualReports.find(
                        (r) => r.id === selectedReportId,
                      ) || initialData.annualReports[0];

                    return (
                      <article className="prose prose-slate max-w-none text-[#2C3E50] prose-headings:text-[#1E2736] prose-strong:text-[#1E2736] prose-img:rounded-xl prose-img:mx-auto prose-img:shadow-sm pt-2">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                        >
                          {normalizeMarkdown(activeReport?.content || '')}
                        </ReactMarkdown>
                      </article>
                    );
                  })()}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
