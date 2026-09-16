'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { validateImportRows } from '@/lib/csv-import';
import { CSV_TEMPLATE_HEADERS } from '@/lib/validations';
import { confirmImport, type ConfirmImportSummary } from '@/app/actions/import';
import type { ImportRowResult, ProductCsvRow } from '@/lib/types';
import { UploadCloud, Download, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const SAMPLE_ROWS = [
  ['Rolex', 'Submariner', 'Luxury dive watch', '12000', 'ROL001', '', ''],
  ['Rolex', 'Daytona', 'Chronograph watch', '15000', 'ROL002', '', ''],
  ['Seiko', 'Prospex', 'Diving watch', '1200', 'SEI001', '', ''],
];

function downloadTemplate() {
  const csv = Papa.unparse({ fields: [...CSV_TEMPLATE_HEADERS], data: SAMPLE_ROWS });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'product-import-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function CsvImporter({
  catalogId,
  existingBrandNames,
  existingProductKeys,
}: {
  catalogId: string;
  existingBrandNames: string[];
  existingProductKeys: string[];
}) {
  const router = useRouter();
  const [results, setResults] = useState<ImportRowResult[] | null>(null);
  const [createMissingBrands, setCreateMissingBrands] = useState(true);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<ConfirmImportSummary | null>(null);

  function handleFile(file: File) {
    Papa.parse<ProductCsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (parsed) => {
        const validated = validateImportRows(parsed.data, existingBrandNames, existingProductKeys);
        setResults(validated);
        setSummary(null);
      },
      error: () => toast.error('Could not read that CSV file.'),
    });
  }

  const validRows = results?.filter((r) => r.status === 'valid') || [];
  const errorRows = results?.filter((r) => r.status === 'error') || [];
  const duplicateRows = results?.filter((r) => r.status === 'duplicate') || [];
  const missingBrandCount = new Set(validRows.filter((r) => !r.brandExists).map((r) => r.data.brand_name.toLowerCase())).size;

  async function handleConfirm() {
    setImporting(true);
    const result = await confirmImport({
      catalogId,
      rows: validRows.map((r) => r.data),
      createMissingBrands,
    });
    setImporting(false);
    if (!result.success || !result.data) {
      toast.error(result.error || 'Import failed');
      return;
    }
    setSummary(result.data);
    toast.success('Import complete');
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="h-4 w-4" /> Download CSV template
        </Button>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700">
          <UploadCloud className="h-4 w-4" /> Upload CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
      </div>

      <p className="text-xs text-neutral-400">
        Columns: <code>{CSV_TEMPLATE_HEADERS.join(', ')}</code>. Only <code>brand_name</code> and <code>product_name</code> are required.
      </p>

      {results && !summary && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 text-sm">
            <Badge tone="success">{validRows.length} valid</Badge>
            <Badge tone="warning">{duplicateRows.length} duplicate</Badge>
            <Badge tone="muted">{errorRows.length} error</Badge>
          </div>

          {missingBrandCount > 0 && (
            <div className="flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
              <span className="text-sm text-amber-800">
                {missingBrandCount} brand(s) in this file don&apos;t exist yet.
              </span>
              <div className="ml-auto flex items-center gap-2">
                <Switch checked={createMissingBrands} onCheckedChange={setCreateMissingBrands} />
                <span className="text-sm text-amber-800">Create missing brands automatically</span>
              </div>
            </div>
          )}

          <div className="max-h-96 overflow-auto rounded-lg border border-neutral-200">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Brand</th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {results.map((r) => (
                  <tr key={r.row} className={r.status === 'error' ? 'bg-red-50/50' : r.status === 'duplicate' ? 'bg-amber-50/50' : ''}>
                    <td className="px-3 py-2 text-neutral-400">{r.row}</td>
                    <td className="px-3 py-2">
                      {r.status === 'valid' && <Badge tone="success">Valid</Badge>}
                      {r.status === 'duplicate' && <Badge tone="warning">Duplicate</Badge>}
                      {r.status === 'error' && <Badge tone="muted">Error</Badge>}
                    </td>
                    <td className="px-3 py-2">
                      {r.data.brand_name}
                      {!r.brandExists && r.status === 'valid' && <span className="ml-1 text-xs text-amber-600">(new)</span>}
                    </td>
                    <td className="px-3 py-2">{r.data.product_name}</td>
                    <td className="px-3 py-2">{r.data.price || '—'}</td>
                    <td className="px-3 py-2 text-xs text-red-600">{r.errors.join('; ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button onClick={handleConfirm} disabled={importing || validRows.length === 0}>
            {importing ? 'Importing…' : `Import ${validRows.length} product(s)`}
          </Button>
        </div>
      )}

      {summary && (
        <div className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-5 w-5" />
          Imported {summary.productsCreated} products
          {summary.brandsCreated > 0 && ` and created ${summary.brandsCreated} new brand(s)`}
          {summary.skipped > 0 && ` — ${summary.skipped} row(s) skipped`}.
        </div>
      )}

      {!results && (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-sm text-neutral-500">
          <AlertTriangle className="h-4 w-4 text-neutral-400" />
          Upload a CSV to see a validation preview before anything is imported.
        </div>
      )}
    </div>
  );
}
