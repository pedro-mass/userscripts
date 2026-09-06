export interface Platform {
  storage: {
    get(key: string, defaultValue: string): string;
    set(key: string, value: string): void;
  };
  http: {
    postForm(
      url: string,
      data: string,
      headers: Record<string, string>,
    ): Promise<{ status: number; responseText: string }>;
  };
  tabs: {
    open(url: string, active?: boolean): void;
  };
}
