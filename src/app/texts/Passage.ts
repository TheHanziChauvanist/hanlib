export type Passage = {
  frontmatter: {
    title: string;
    description: string;
  };
  lines: {
    chinese: string;
    english: string;
    gloss: string | null;
  }[];
  notes: Record<string, string>;
};
export type LexiconEntry = Record<VocabEntryPronunciationKey, string | null>;

export type PassageVocab = Partial<Record<string, LexiconEntry[]>>;

export type VocabEntryPronunciationKey = "vi" | "jyutping" | "pinyin" | "en";
export const vocabFileColumns = [
  { heading: "Vietnamese", key: "vi" },
  { heading: "Jyutping", key: "jyutping" },
  { heading: "English", key: "en" },
  { heading: "Hanyu Pinyin", key: "pinyin" },
] as const;

export function parsePassageVocabList(vocabFileContents: string | null) {
  const vocab: PassageVocab = {};
  if (vocabFileContents) {
    const lines = vocabFileContents.split("\n");

    const [, ...columnHeaders] = lines[0].split("\t");
    const invalidColumnHeaders = columnHeaders.filter(
      (columnHeader) =>
        !vocabFileColumns.some(
          (vocabFileColumn) => vocabFileColumn.heading === columnHeader
        )
    );
    if (invalidColumnHeaders.length) {
      throw new Error(
        `Invalid vocab file (invalid column headers: ${invalidColumnHeaders.join(
          ", "
        )}. should be one of ${vocabFileColumns
          .map((vocabFileColumn) => vocabFileColumn.heading)
          .join(", ")})`
      );
    }

    const columnsOrder: { key: VocabEntryPronunciationKey; index: number }[] =
      vocabFileColumns.map((vocabFileColumn) => {
        const index = columnHeaders.indexOf(vocabFileColumn.heading);
        return { key: vocabFileColumn.key, index };
      });

    for (const line of lines.slice(1)) {
      const [chinese, ...columns] = line.split("\t");
      const vocabEntry = {} as Record<
        VocabEntryPronunciationKey,
        string | null
      >;
      for (const { key, index } of columnsOrder) {
        const value = columns[index];
        vocabEntry[key] = value || null;
      }

      vocab[chinese] ||= [];
      vocab[chinese]!.push(vocabEntry);
    }
  }
  return vocab;
}

export function parsePassage(passageFileContents: string) {
  const [frontmatterText, body, notesText] =
    passageFileContents.split(/\s*\n\s*---+\s*\n\s*/);
  const lines = body.split(/\n\n+/).map((line) => {
    const [chinese, english, gloss] = line.split("\n");
    return {
      chinese,
      english,
      gloss: gloss || null,
    };
  });
  const notes: Record<string, string> = {};
  if (notesText) {
    const noteSections = [
      ...notesText.trim().matchAll(/# ([a-z])\s*\n\n([^#]+)(?=# |$)/g),
    ];
    for (const [_, noteId, noteText] of noteSections) {
      notes[noteId] = noteText;
    }
  }

  const text: Passage = {
    frontmatter: parseFrontmatterText(frontmatterText),
    lines,
    notes,
  };
  return text;
}
export function parseFrontmatterText(frontmatterText: string) {
  const lines = frontmatterText.split("\n");
  return {
    title: lines[0].replace("# ", ""),
    description: lines.slice(1).join("\n"),
  };
}