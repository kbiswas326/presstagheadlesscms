'use client';

import dynamic from 'next/dynamic';

const SidebarLazy = dynamic(() => import('./Sidebar'), { ssr: false });

export default function SidebarLazyClient(props) {
  return <SidebarLazy {...props} />;
}

