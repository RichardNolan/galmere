export type Comment = {
  id: number;
  created_at: string;
  deleted_at: string | null;
  resolved: boolean;
  resolved_by_name: string | null;
  resolved_by_email: string | null;
  resolved_at: string | null;
  comment: string;
  commentatorName: string;
  commentatorEmail: string;
  nutrition: number | null;
  brand: number | null;
  product: string | null;
  comment_id: number;
};

export type CommentTargetType = "nutrition" | "brand" | "product";

export type CommentTargetId = number | string;

export type NewCommentPayload = {
  comment: string;
  commentatorName: string;
  commentatorEmail: string;
  nutrition: number | null;
  brand: number | null;
  product: string | null;
};

export type ResolveCommentPayload = {
  resolved: true;
  resolved_by_name: string;
  resolved_by_email: string;
  resolved_at: string;
};
