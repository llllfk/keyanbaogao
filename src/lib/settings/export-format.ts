import { eq } from 'drizzle-orm';

import {
  DEFAULT_EXPORT_FORMAT,
  exportFormatSchema,
  normalizeExportFormat,
  type ExportFormat,
} from '@/lib/export/format-schema';
import { getDb } from '@/lib/db';
import { tenants } from '@/lib/db/schema';

type TenantConfig = Record<string, unknown> & {
  exportFormat?: unknown;
};

export async function getExportFormat(
  tenantId: string,
): Promise<ExportFormat> {
  const db = getDb();
  const [row] = await db
    .select({ config: tenants.config })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  const config = (row?.config ?? {}) as TenantConfig;
  return normalizeExportFormat(config.exportFormat);
}

export async function saveExportFormat(
  tenantId: string,
  input: unknown,
): Promise<ExportFormat> {
  const format = exportFormatSchema.parse(input);
  const db = getDb();
  const [row] = await db
    .select({ config: tenants.config })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  const prev = (row?.config ?? {}) as TenantConfig;
  const nextConfig: TenantConfig = {
    ...prev,
    exportFormat: format,
  };

  await db
    .update(tenants)
    .set({
      config: nextConfig,
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, tenantId));

  return format;
}

export function getDefaultExportFormat(): ExportFormat {
  return DEFAULT_EXPORT_FORMAT;
}
