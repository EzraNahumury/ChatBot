import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { DATASET_MD_CONTENT } from "./knowledge-base";

type KnowledgeFile = {
  content: string;
  updated_at: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "knowledge-base.json");

function createDefaultKnowledgeFile(): KnowledgeFile {
  return {
    content: DATASET_MD_CONTENT,
    updated_at: new Date().toISOString(),
  };
}

async function writeKnowledgeFile(payload: KnowledgeFile): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(FILE_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function readKnowledgeFile(): Promise<KnowledgeFile> {
  try {
    const raw = await readFile(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<KnowledgeFile>;
    const content = typeof parsed.content === "string" ? parsed.content : "";
    const updatedAt =
      typeof parsed.updated_at === "string" && parsed.updated_at
        ? parsed.updated_at
        : new Date().toISOString();

    if (!content.trim()) {
      const fallback = createDefaultKnowledgeFile();
      await writeKnowledgeFile(fallback);
      return fallback;
    }

    return {
      content,
      updated_at: updatedAt,
    };
  } catch {
    const fallback = createDefaultKnowledgeFile();
    await writeKnowledgeFile(fallback);
    return fallback;
  }
}

export async function getKnowledgeContent(): Promise<string> {
  const file = await readKnowledgeFile();
  return file.content;
}

export async function getKnowledgeFile(): Promise<KnowledgeFile> {
  return readKnowledgeFile();
}

export async function saveKnowledgeContent(content: string): Promise<KnowledgeFile> {
  const payload: KnowledgeFile = {
    content: content.trim(),
    updated_at: new Date().toISOString(),
  };
  await writeKnowledgeFile(payload);
  return payload;
}
