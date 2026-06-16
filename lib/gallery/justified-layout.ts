export interface JustifiedLayoutItem {
  id: string;
  aspectRatio: number;
}

export interface JustifiedLayoutRow {
  items: JustifiedLayoutItem[];
  height: number;
  /** Última linha: não estica até a borda (como Pixieset). */
  justify: boolean;
}

const MIN_ROW_HEIGHT = 120;

/** Altura alvo de cada linha conforme a largura do container. */
export function justifiedTargetRowHeight(containerWidth: number): number {
  if (containerWidth < 480) return 160;
  if (containerWidth < 768) return 200;
  if (containerWidth < 1280) return 230;
  return 250;
}

/**
 * Layout justificado em linhas (estilo Pixieset/Flickr).
 * Fotos na mesma linha compartilham altura; a linha preenche a largura sem buracos.
 */
export function buildJustifiedRows(
  items: JustifiedLayoutItem[],
  containerWidth: number,
  targetRowHeight: number,
  gap: number
): JustifiedLayoutRow[] {
  if (containerWidth <= 0 || items.length === 0) return [];

  const rows: JustifiedLayoutRow[] = [];
  let row: JustifiedLayoutItem[] = [];
  let aspectSum = 0;

  function flush(justify: boolean) {
    if (!row.length) return;
    const gaps = (row.length - 1) * gap;
    const height = justify
      ? Math.max(MIN_ROW_HEIGHT, (containerWidth - gaps) / aspectSum)
      : targetRowHeight;
    rows.push({ items: [...row], height, justify });
    row = [];
    aspectSum = 0;
  }

  for (const item of items) {
    const ar = item.aspectRatio > 0 ? item.aspectRatio : 1;
    row.push({ ...item, aspectRatio: ar });
    aspectSum += ar;

    const gaps = (row.length - 1) * gap;
    const heightIfFlush = (containerWidth - gaps) / aspectSum;

    if (heightIfFlush <= targetRowHeight) {
      flush(true);
    }
  }

  flush(false);
  return rows;
}

export function itemWidth(height: number, aspectRatio: number): number {
  return height * (aspectRatio > 0 ? aspectRatio : 1);
}
