export type API = {
  getRecentProjects: (sqlitePath: string) => Promise<string[]>;
};
