import { useEffect } from "react";

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} | Bible Study Lab` : "Bible Study Lab";
    return () => {
      document.title = prev;
    };
  }, [title]);
}
