export type ThemeId = 'wecom' | 'dingtalk' | 'feishu';
export type Appearance = 'light' | 'dark' | 'system';
export interface User { name: string; avatar: string; verified?: boolean }
export interface VideoItem { id: string; title: string; url: string; cover: string; author: User; duration?: string; views?: string; published?: string; description?: string }
export interface Comment { id: string; author: User; text: string; time: string; likes: number; replies?: Comment[] }
export interface AppSettings { enabled: boolean; theme: ThemeId; appearance: Appearance; disguise: boolean; hideMedia: boolean }
export interface Route { kind: 'home' | 'search' | 'video'; query?: string; page?: number; videoId?: string; part?: number }
