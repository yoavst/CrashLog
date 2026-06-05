import { useMemo } from "react";
import type { BinaryImage } from "../types";
import { formatBytes } from "../parser/format";
import styles from "./BinaryImagesPanel.module.css";

interface BinaryImagesPanelProps {
  images: BinaryImage[];
  query: string;
}

/** Tabular listing of every loaded binary image and its UUID. */
export function BinaryImagesPanel({ images, query }: BinaryImagesPanelProps) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return images;
    return images.filter(
      (img) =>
        img.name.toLowerCase().includes(q) ||
        img.path?.toLowerCase().includes(q) ||
        img.uuid?.toLowerCase().includes(q),
    );
  }, [images, query]);

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Binary Images</h2>
      <p className={styles.hint}>
        {images.length} loaded images. UUIDs identify the exact build for
        symbolication with matching <code>.dSYM</code> files.
      </p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Load Address</th>
              <th>Size</th>
              <th>Arch</th>
              <th>UUID</th>
              <th>Path</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((img) => (
              <tr key={img.index}>
                <td className={styles.name}>{img.name}</td>
                <td className={styles.addr}>{img.base}</td>
                <td className={styles.size}>{formatBytes(img.size)}</td>
                <td className={styles.arch}>{img.arch ?? "—"}</td>
                <td className={styles.uuid} title={img.uuid}>
                  {img.uuid ?? "—"}
                </td>
                <td className={styles.path} title={img.path}>
                  {img.path ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className={styles.empty}>No images match “{query}”.</p>
        )}
      </div>
    </div>
  );
}
