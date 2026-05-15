export interface CreateTipInput {
  title: string;
  category: string;
  content: string;
  author?: string;
  status?: "Draft";
}

