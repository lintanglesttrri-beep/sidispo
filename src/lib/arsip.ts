export function formatKodeArsip(
  kodeDivisi: string,
  periode: string,
  sequenceNumber: number
): string {
  const cleanKode = kodeDivisi.trim().toUpperCase() || "SEK";
  const padded = String(sequenceNumber).padStart(4, "0");
  return `STP/${cleanKode}/${periode}/${padded}`;
}
