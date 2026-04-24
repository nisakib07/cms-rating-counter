'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, X, Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';

interface CSVRow {
  member_id: string;
  team_id: string;
  rating_value: number;
  order_id: string;
  client_name: string;
  review_text: string;
  screenshot_url: string;
  date_received: string;
  _error?: string;
}

interface BulkImportProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  members: { id: string; name: string; team_id: string }[];
  teams: { id: string; name: string }[];
}

export default function BulkImport({ isOpen, onClose, onComplete, members, teams }: BulkImportProps) {
  const [rows, setRows] = useState<CSVRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    
    return lines.slice(1).map(line => {
      // Handle quoted CSV fields
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') { inQuotes = !inQuotes; continue; }
        if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
        current += char;
      }
      values.push(current.trim());

      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] || ''; });

      // Try to resolve member by name
      let memberId = row.member_id || '';
      const memberName = row.member_name || row.member || '';
      if (!memberId && memberName) {
        const found = members.find(m => m.name.toLowerCase() === memberName.toLowerCase());
        if (found) memberId = found.id;
      }

      // Try to resolve team by name
      let teamId = row.team_id || '';
      const teamName = row.team_name || row.team || '';
      if (!teamId && teamName) {
        const found = teams.find(t => t.name.toLowerCase() === teamName.toLowerCase());
        if (found) teamId = found.id;
      }

      // Auto-resolve team from member
      if (!teamId && memberId) {
        const member = members.find(m => m.id === memberId);
        if (member) teamId = member.team_id;
      }

      const parsed: CSVRow = {
        member_id: memberId,
        team_id: teamId,
        rating_value: parseFloat(row.rating_value || row.rating || '5') || 5,
        order_id: row.order_id || '',
        client_name: row.client_name || row.client || '',
        review_text: row.review_text || row.review || '',
        screenshot_url: row.screenshot_url || row.screenshot || '',
        date_received: row.date_received || row.date || new Date().toISOString().split('T')[0],
      };

      // Validate
      if (!parsed.member_id) parsed._error = 'Member not found';
      else if (!parsed.team_id) parsed._error = 'Team not found';
      else if (!parsed.order_id) parsed._error = 'Missing order ID';

      return parsed;
    });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRows(parseCSV(text));
      setResult(null);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.name.endsWith('.csv')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRows(parseCSV(text));
      setResult(null);
    };
    reader.readAsText(file);
  };

  const validRows = rows.filter(r => !r._error);
  const errorRows = rows.filter(r => r._error);

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    let success = 0;
    let failed = 0;

    for (const row of validRows) {
      const payload = {
        member_id: row.member_id,
        team_id: row.team_id,
        rating_value: row.rating_value,
        order_id: row.order_id || null,
        client_name: row.client_name || null,
        review_text: row.review_text || null,
        screenshot_url: row.screenshot_url || null,
        date_received: row.date_received,
        status: 'approved',
      };
      const { error } = await supabase.from('ratings').insert(payload);
      if (error) failed++;
      else success++;
    }

    setResult({ success, failed });
    setImporting(false);
    if (success > 0) {
      showToast(`Imported ${success} rating${success > 1 ? 's' : ''} successfully`, 'success');
      onComplete();
    }
  };

  const downloadTemplate = () => {
    const headers = 'member_name,order_id,rating_value,client_name,review_text,screenshot_url,date_received';
    const sample = 'John Doe,FO-12345,5,ClientName,Great work!,https://prnt.sc/example,2025-04-20';
    const blob = new Blob([headers + '\n' + sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'starledger_import_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl glass-light rounded-2xl p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Upload size={20} className="text-primary-light" />
            Bulk Import Ratings
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-text-muted hover:text-text-primary transition-all cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Upload area */}
        {rows.length === 0 && (
          <>
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-white/10 hover:border-primary/30 rounded-xl p-10 text-center cursor-pointer transition-colors mb-4"
            >
              <FileText size={40} className="mx-auto mb-3 text-text-muted/30" />
              <p className="text-sm text-text-secondary mb-1">
                Drop a CSV file here or <span className="text-primary-light font-medium">click to browse</span>
              </p>
              <p className="text-xs text-text-muted">Supports member_name, order_id, rating_value, client_name, review_text, screenshot_url, date_received</p>
            </div>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
            <button onClick={downloadTemplate} className="flex items-center gap-2 text-xs text-text-muted hover:text-primary-light transition-colors cursor-pointer">
              <Download size={12} /> Download template CSV
            </button>
          </>
        )}

        {/* Preview */}
        {rows.length > 0 && !result && (
          <>
            <div className="flex items-center gap-4 mb-4 text-sm">
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 size={14} /> {validRows.length} valid
              </span>
              {errorRows.length > 0 && (
                <span className="text-danger font-medium flex items-center gap-1">
                  <AlertCircle size={14} /> {errorRows.length} errors
                </span>
              )}
            </div>

            <div className="overflow-x-auto rounded-lg border border-white/[0.06] mb-4 max-h-60">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white/[0.02] text-text-muted">
                    <th className="px-3 py-2 text-left">Member</th>
                    <th className="px-3 py-2 text-left">Order</th>
                    <th className="px-3 py-2 text-left">Rating</th>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const member = members.find(m => m.id === row.member_id);
                    return (
                      <tr key={i} className={`border-t border-white/[0.03] ${row._error ? 'bg-danger/5' : ''}`}>
                        <td className="px-3 py-2 text-text-primary">{member?.name || row.member_id || '?'}</td>
                        <td className="px-3 py-2 text-text-muted font-mono">{row.order_id || '—'}</td>
                        <td className="px-3 py-2 text-warning">⭐ {row.rating_value}</td>
                        <td className="px-3 py-2 text-text-muted">{row.date_received}</td>
                        <td className="px-3 py-2">
                          {row._error ? (
                            <span className="text-danger text-[10px]">{row._error}</span>
                          ) : (
                            <span className="text-emerald-400 text-[10px]">Ready</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => { setRows([]); setResult(null); }}>Reset</Button>
              <Button onClick={handleImport} disabled={importing || validRows.length === 0}>
                {importing ? 'Importing...' : `Import ${validRows.length} Rating${validRows.length > 1 ? 's' : ''}`}
              </Button>
            </div>
          </>
        )}

        {/* Result */}
        {result && (
          <div className="text-center py-8">
            <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
            <p className="text-lg font-bold text-text-primary">{result.success} imported successfully</p>
            {result.failed > 0 && <p className="text-sm text-danger mt-1">{result.failed} failed (duplicates or errors)</p>}
            <div className="flex gap-3 justify-center mt-6">
              <Button variant="ghost" onClick={onClose}>Close</Button>
              <Button onClick={() => { setRows([]); setResult(null); }}>Import More</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
