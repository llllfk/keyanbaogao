import { listBasisPacksFromLibrary } from '@/lib/project/basis-library';
import {
  BASIS_SOURCE_SITES,
  type BasisSourceSiteId,
} from '@/lib/project/basis-auto-sources';
import {
  GROUP_LABEL,
  type BasisLibraryEntry,
  type BasisLibraryViewModel,
} from '@/lib/project/basis-library-shared';

function matchSiteId(sourceSite: string | undefined): BasisSourceSiteId | 'other' {
  if (!sourceSite) {
    return 'other';
  }
  const found = Object.values(BASIS_SOURCE_SITES).find(
    site => site.name === sourceSite,
  );
  return found?.id ?? 'other';
}

export async function getBasisLibraryViewModel(): Promise<BasisLibraryViewModel> {
  const packs = await listBasisPacksFromLibrary();
  const entries: BasisLibraryEntry[] = [];

  for (const pack of packs) {
    for (const item of pack.items) {
      if (!item.id) {
        continue;
      }
      entries.push({
        ...item,
        id: item.id,
        packId: pack.id,
        packName: pack.name,
        sourceSite: item.sourceSite ?? '',
      });
    }
  }

  const siteOrder = Object.keys(BASIS_SOURCE_SITES) as BasisSourceSiteId[];
  const bySiteMap = new Map<BasisSourceSiteId | 'other', BasisLibraryEntry[]>();
  for (const siteId of siteOrder) {
    bySiteMap.set(siteId, []);
  }
  bySiteMap.set('other', []);

  for (const entry of entries) {
    const siteId = matchSiteId(entry.sourceSite);
    bySiteMap.get(siteId)?.push(entry);
  }

  const bySite = [...siteOrder, 'other' as const]
    .map(siteId => ({
      siteId,
      siteName:
        siteId === 'other'
          ? '其他来源'
          : BASIS_SOURCE_SITES[siteId].name,
      items: bySiteMap.get(siteId) ?? [],
    }))
    .filter(section => section.items.length > 0);

  return {
    totalItems: entries.length,
    packs: packs.map(pack => ({
      id: pack.id,
      name: pack.name,
      description: pack.description,
      itemCount: pack.items.length,
    })),
    bySite,
  };
}

export {
  GROUP_LABEL,
  type BasisLibraryEntry,
  type BasisLibraryViewModel,
} from '@/lib/project/basis-library-shared';
