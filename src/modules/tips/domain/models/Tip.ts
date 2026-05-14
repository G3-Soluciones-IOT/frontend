export type TipStatus = "Published" | "Draft";

export interface Tip {
  id: number;
  title: string;
  category: string;
  status: TipStatus;
  date: string;
  content?: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TipResource {
  id: number;
  title: string;
  description: string;
  assetLabel: "PDF" | "PNG";
  downloads: number;
  views: number;
  variant: "light" | "dark";
  url?: string;
  createdAt: string;
  updatedAt: string;
}

