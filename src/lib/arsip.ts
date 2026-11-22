export function formatKodeArsip(periode: string, sequenceNumber: number): string {
  const padded = String(sequenceNumber).padStart(4, "0");
  return `STP/DSP/${periode}/${padded}`;
}
