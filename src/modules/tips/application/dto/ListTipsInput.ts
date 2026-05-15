export interface ListTipsInput {
  page?: number;
  limit?: number;
  status?: "Published" | "Draft";
  category?: string;
  search?: string;
}

