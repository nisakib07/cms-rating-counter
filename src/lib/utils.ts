// Convert Google Drive share/view links or Lightshot (prnt.sc) links to displayable image URLs
export function toDriveDirectUrl(url: string): string {
  if (!url) return url;

  // Handle Lightshot / prnt.sc links — route through our server-side proxy
  if (url.includes('prnt.sc') || url.includes('lightshot')) {
    return `/api/screenshot-proxy?url=${encodeURIComponent(url)}`;
  }

  // Match: drive.google.com/file/d/FILE_ID/... or drive.google.com/open?id=FILE_ID
  const fileIdMatch = url.match(/\/file\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/);
  if (fileIdMatch) {
    return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
  }
  // Already a direct URL or non-Drive link
  return url;
}

// Export data array to CSV and trigger download
export function exportToCSV(data: Record<string, string | number | null | undefined>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h] ?? '';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(',')
    ),
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

