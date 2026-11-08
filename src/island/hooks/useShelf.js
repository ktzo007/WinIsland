import { useCallback, useState } from "react";

/** Shelf hanya menyimpan REFERENSI path (tidak menyalin file) → nol beban disk/RAM. */
export function useShelf() {
  const [files, setFiles] = useState([]);
  const add = useCallback((paths) => setFiles((prev) => [...new Set([...prev, ...paths])].slice(-40)), []);
  const remove = useCallback((p) => setFiles((prev) => prev.filter((x) => x !== p)), []);
  const clear = useCallback(() => setFiles([]), []);
  return { files, add, remove, clear };
}
