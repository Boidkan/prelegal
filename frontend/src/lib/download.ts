/** Trigger a browser download for an in-memory Blob. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Defer revocation so the browser can start the download first.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
