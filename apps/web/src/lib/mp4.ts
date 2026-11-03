/**
 * Reads an MP4's duration from its `moov/mvhd` box, so billing uses the file itself rather
 * than a length the browser reports. Returns null when the file is not a readable MP4.
 */
export function mp4DurationSeconds(bytes: Uint8Array): number | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  const findBox = (start: number, end: number, type: string): { start: number; end: number } | null => {
    let offset = start;
    while (offset + 8 <= end) {
      let size = view.getUint32(offset);
      const name = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
      let header = 8;
      if (size === 1) {
        if (offset + 16 > end) return null;
        size = Number(view.getBigUint64(offset + 8));
        header = 16;
      } else if (size === 0) {
        size = end - offset;
      }
      if (size < header || offset + size > end) return null;
      if (name === type) return { start: offset + header, end: offset + size };
      offset += size;
    }
    return null;
  };

  const moov = findBox(0, bytes.byteLength, 'moov');
  const mvhd = moov && findBox(moov.start, moov.end, 'mvhd');
  if (!mvhd) return null;
  const version = view.getUint8(mvhd.start);
  // version 0: 32-bit times; version 1: 64-bit times (after 4 bytes of version + flags)
  const timescaleAt = mvhd.start + (version === 1 ? 20 : 12);
  if (timescaleAt + (version === 1 ? 12 : 8) > mvhd.end) return null;
  const timescale = view.getUint32(timescaleAt);
  const duration = version === 1 ? Number(view.getBigUint64(timescaleAt + 4)) : view.getUint32(timescaleAt + 4);
  return timescale > 0 ? duration / timescale : null;
}
