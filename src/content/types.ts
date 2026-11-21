export interface BookOverview {
  /** Starts with "Traditionally attributed to" where an author is named */
  author: string;
  setting: string;
  summary: string;
  themes: string[];
  /** [chapter range such as "1-11", label], contiguous and covering the whole book */
  outline: [chapters: string, label: string][];
  /** References such as "John 3:16-21" inside the same book */
  keyPassages: string[];
}
