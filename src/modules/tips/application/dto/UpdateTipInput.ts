export interface UpdateTipInput {
  title?: string;
  category?: string;
  content?: string;
  status?: "Published" | "Draft";
  author?: string;
}

