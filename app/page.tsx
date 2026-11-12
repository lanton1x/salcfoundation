// app/page.tsx
import React from 'react';
import FoundationContainer from './components/FoundationContainer';
import { fetchSiteBootstrapData } from '@/lib/cmsService';

export const instant = false;

export default async function Page() {
  const data = await fetchSiteBootstrapData();

  const initialData = {
    mission: data.mission || 'Mission statement content unavailable.',
    board: data.board || 'Board of directors directory unavailable.',
    giftpolicies: data.giftpolicies || 'Gift policies content unavailable.',
    giftpolicies_faq: data.giftpolicies_faq || 'Gift policies FAQ unavailable.',
    homeClips: data.homeClips,
    memorialItems: data.memorialItems,
    legacyItems: data.legacyItems,
    annualReports: data.annualReports,
  };

  return <FoundationContainer initialData={initialData} />;
}
