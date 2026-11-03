import { Directory, File, Paths } from 'expo-file-system';
import { splitDataUrl, type GarmentType } from './garment';
import { addLook, parseLooks, removeLook, type Look } from './looksIndex';

const dir = new Directory(Paths.document, 'looks');
const indexFile = new File(dir, 'index.json');

function ensureDir() {
  if (!dir.exists) dir.create({ intermediates: true });
}

export function lookUri(look: Look): string {
  return new File(dir, look.file).uri;
}

export async function listLooks(): Promise<Look[]> {
  if (!indexFile.exists) return [];
  return parseLooks(await indexFile.text());
}

async function writeIndex(looks: Look[]) {
  ensureDir();
  await indexFile.write(JSON.stringify(looks));
}

/** Stores an AI result (data URL) in the app's documents folder and records it in the gallery index. */
export async function saveLook(resultDataUrl: string, garmentType: GarmentType): Promise<Look> {
  const parts = splitDataUrl(resultDataUrl);
  if (!parts) throw new Error('Unsupported result image');
  ensureDir();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const look: Look = { id, file: `${id}.${parts.extension}`, createdAt: Date.now(), garmentType };
  await new File(dir, look.file).write(parts.base64, { encoding: 'base64' });
  const { looks, evicted } = addLook(await listLooks(), look);
  await writeIndex(looks);
  for (const old of evicted) new File(dir, old.file).delete();
  return look;
}

export async function deleteLook(look: Look): Promise<void> {
  const file = new File(dir, look.file);
  if (file.exists) file.delete();
  await writeIndex(removeLook(await listLooks(), look.id));
}
