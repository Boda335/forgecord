export interface LoadResult<T = unknown> {
  loaded: number;
  failed: number;
  results: Array<{ filePath: string; status: 'Loaded' | 'Reloaded'; row: string[] }>;
}
export interface BaseLoaderOptions {
  name: string;
  dir: string;
  tableHeadings?: string[];
}
