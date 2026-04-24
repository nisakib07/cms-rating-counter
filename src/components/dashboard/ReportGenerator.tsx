'use client';

import { FileText, Download, Printer } from 'lucide-react';
import type { Rating } from '@/types/database';
import type { MemberWithStats, TeamWithStats } from '@/types/database';
import { countFiveStarOrders } from '@/lib/utils';

interface ReportGeneratorProps {
  allRatings: Rating[];
  topMembers: MemberWithStats[];
  topTeams: TeamWithStats[];
  totalRatings: number;
  cmsHubRatings: number;
  cmsEndgameRatings: number;
}

export default function ReportGenerator({ allRatings, topMembers, topTeams, totalRatings, cmsHubRatings, cmsEndgameRatings }: ReportGeneratorProps) {

  const generateReport = () => {
    const now = new Date();
    const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthRatings = allRatings.filter(r => r.date_received.startsWith(monthKey));
    const thisMonthCount = countFiveStarOrders(thisMonthRatings);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>StarLedger Report - ${monthName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', -apple-system, sans-serif; background: #0b0e14; color: #e2e8f0; padding: 40px; max-width: 900px; margin: 0 auto; }
    @media print { body { background: white; color: #1a1a1a; } .no-print { display: none !important; } .stat-card { border: 1px solid #e2e8f0 !important; background: #f8fafc !important; } h1, h2, h3 { color: #1a1a1a !important; } }
    h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; background: linear-gradient(135deg, #7c3aed, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    @media print { h1 { -webkit-text-fill-color: #1a1a1a; } }
    .subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 32px; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 20px; text-align: center; }
    .stat-value { font-size: 36px; font-weight: 800; color: #7c3aed; }
    @media print { .stat-value { color: #5b21b6; } }
    .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; }
    .section { margin-bottom: 32px; }
    .section h2 { font-size: 18px; font-weight: 700; margin-bottom: 16px; color: #e2e8f0; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 10px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; border-bottom: 1px solid rgba(255,255,255,0.06); }
    td { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.03); }
    .rank-1 { color: #f59e0b; font-weight: 700; }
    .rank-2 { color: #94a3b8; font-weight: 600; }
    .rank-3 { color: #b45309; font-weight: 600; }
    .print-btn { position: fixed; bottom: 24px; right: 24px; padding: 12px 24px; background: #7c3aed; color: white; border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 8px 20px rgba(124, 58, 237, 0.3); }
    .print-btn:hover { background: #6d28d9; }
    .footer { text-align: center; color: #475569; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.04); }
  </style>
</head>
<body>
  <h1>&#9733; StarLedger Report</h1>
  <div class="subtitle">Performance Summary &mdash; ${monthName}</div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${totalRatings}</div>
      <div class="stat-label">Total 5&#9733; Ratings</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color: #10b981">${cmsHubRatings}</div>
      <div class="stat-label">CMS Hub</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color: #6366f1">${cmsEndgameRatings}</div>
      <div class="stat-label">CMS Endgame</div>
    </div>
  </div>

  <div class="stats-grid" style="grid-template-columns: 1fr 1fr;">
    <div class="stat-card">
      <div class="stat-value">${thisMonthCount}</div>
      <div class="stat-label">This Month (${monthName.split(' ')[0]})</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${topMembers.length}</div>
      <div class="stat-label">Active Members</div>
    </div>
  </div>

  <div class="section">
    <h2>&#9733; Top Performers</h2>
    <table>
      <thead><tr><th>Rank</th><th>Member</th><th>Team</th><th>5&#9733; Ratings</th></tr></thead>
      <tbody>
        ${topMembers.slice(0, 10).map((m, i) => `
          <tr>
            <td class="${i < 3 ? `rank-${i + 1}` : ''}">${i + 1}</td>
            <td>${m.name}</td>
            <td>${m.team?.name || '&mdash;'}</td>
            <td style="font-weight:700">${m.rating_count}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Team Rankings</h2>
    <table>
      <thead><tr><th>Rank</th><th>Team</th><th>Service Line</th><th>5&#9733; Ratings</th></tr></thead>
      <tbody>
        ${topTeams.slice(0, 10).map((t, i) => `
          <tr>
            <td class="${i < 3 ? `rank-${i + 1}` : ''}">${i + 1}</td>
            <td>${t.name}</td>
            <td>${t.service_line}</td>
            <td style="font-weight:700">${t.rating_count}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="footer">
    Generated by StarLedger on ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
  </div>

  <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StarLedger_Report_${monthName.replace(' ', '_')}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  return (
    <button
      onClick={generateReport}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.1] transition-all duration-300 btn-press"
    >
      <FileText size={14} />
      Report
    </button>
  );
}
