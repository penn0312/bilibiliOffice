export type ThemeId = "wecom" | "dingtalk" | "feishu";
export type Appearance = "light" | "dark" | "system";
export interface User {
  name: string;
  avatar: string;
}
export interface VideoItem {
  id: string;
  title: string;
  url: string;
  cover: string;
  author: User;
  duration?: string;
  views?: string;
  published?: string;
  part?: number;
}
export interface Comment {
  id: string;
  author: User;
  text: string;
  time: string;
  likes: number;
  images: string[];
  replies: Comment[];
}
export interface AppSettings {
  enabled: boolean;
  theme: ThemeId;
  appearance: Appearance;
  disguise: boolean;
  hideMedia: boolean;
}
export interface Route {
  kind: "home" | "search" | "video" | "popular" | "section";
  query?: string;
  page?: number;
  order?: string;
  videoId?: string;
  part?: number;
  path?: string;
}
export interface SearchResult {
  items: VideoItem[];
  total: number;
  pages: number;
}
