import type { BasisSourceSiteId } from '@/lib/project/basis-auto-sources';
import type { BasisGroup, BasisPackItem } from '@/lib/project/basis-packs';

export type BasisLibraryEntry = BasisPackItem & {
  id: string;
  packId: string;
  packName: string;
  sourceSite: string;
};

export type BasisLibraryViewModel = {
  totalItems: number;
  packs: Array<{
    id: string;
    name: string;
    description: string;
    itemCount: number;
  }>;
  bySite: Array<{
    siteId: BasisSourceSiteId | 'other';
    siteName: string;
    items: BasisLibraryEntry[];
  }>;
};

export const GROUP_LABEL: Record<BasisGroup, string> = {
  policy: '政策',
  standard: '标准',
  project: '本项目',
};
