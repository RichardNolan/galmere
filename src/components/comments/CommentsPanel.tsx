import { useUser } from "@clerk/tanstack-react-start";
import * as React from "react";

import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { supabase } from "#/lib/supabase";

{
  /* <CommentsPanel type="nutrition" id={42} />
<CommentsPanel type="brand" id={12} />
<CommentsPanel type="product" id="prod_abc123" /> */
}

import type {
  Comment,
  CommentTargetId,
  CommentTargetType,
  NewCommentPayload,
  ResolveCommentPayload,
} from "./types";

type CommentsPanelProps = {
  type: CommentTargetType;
  id: CommentTargetId;
  className?: string;
  title?: string;
};

function createTargetFilter(type: CommentTargetType, id: CommentTargetId) {
  if (type === "product") {
    return { field: "product", value: String(id) };
  }

  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    throw new Error(`A numeric id is required for ${type} comments`);
  }

  return { field: type, value: numericId };
}

function createInsertPayload(
  type: CommentTargetType,
  id: CommentTargetId,
  body: string,
  commentatorName: string,
  commentatorEmail: string,
): NewCommentPayload {
  const basePayload: NewCommentPayload = {
    comment: body,
    commentatorName,
    commentatorEmail,
    nutrition: null,
    brand: null,
    product: null,
  };

  if (type === "product") {
    return {
      ...basePayload,
      product: String(id),
    };
  }

  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    throw new Error(`A numeric id is required for ${type} comments`);
  }

  return {
    ...basePayload,
    [type]: numericId,
  };
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function resolveDisplayName(user: ReturnType<typeof useUser>["user"]) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  if (fullName) return fullName;
  if (user?.username) return user.username;
  return "Unknown user";
}

export function CommentsPanel({ type, id, className, title = "Comments" }: CommentsPanelProps) {
  const { user } = useUser();

  const [comments, setComments] = React.useState<Comment[]>([]);
  const [commentInput, setCommentInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [resolvingCommentId, setResolvingCommentId] = React.useState<number | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const displayName = resolveDisplayName(user);
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  const loadComments = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const filter = createTargetFilter(type, id);
      const { data, error } = await supabase
        .from("comments")
        .select(
          "id, created_at, deleted_at, resolved, resolved_by_name, resolved_by_email, resolved_at, comment, commentatorName, commentatorEmail, nutrition, brand, product",
        )
        .eq(filter.field, filter.value)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setComments((data ?? []) as Comment[]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load comments";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [id, type]);

  React.useEffect(() => {
    void loadComments();
  }, [loadComments]);

  const canSubmit = Boolean(commentInput.trim() && email && !isSubmitting);

  const resolveComment = async (commentId: number) => {
    if (!email) {
      setErrorMessage("Your email is required to resolve a comment.");
      return;
    }

    setResolvingCommentId(commentId);
    setErrorMessage(null);

    try {
      const payload: ResolveCommentPayload = {
        resolved: true,
        resolved_by_name: displayName,
        resolved_by_email: email,
        resolved_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("comments").update(payload).eq("id", commentId);

      if (error) {
        throw new Error(error.message);
      }

      await loadComments();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to resolve comment";
      setErrorMessage(message);
    } finally {
      setResolvingCommentId(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const body = commentInput.trim();
    if (!body) return;

    if (!email) {
      setErrorMessage("Your email is required to submit a comment.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = createInsertPayload(type, id, body, displayName, email);
      const { error } = await supabase.from("comments").insert(payload);

      if (error) {
        throw new Error(error.message);
      }

      setCommentInput("");
      await loadComments();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save comment";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Add notes for this {type}. Existing comments cannot be edited but can be resolved.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <label className="text-xs font-medium text-slate-600" htmlFor="comment-body">
              New comment
            </label>
            <textarea
              id="comment-body"
              className="min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              value={commentInput}
              onChange={(event) => setCommentInput(event.target.value)}
              placeholder="Write your note..."
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500">
              Commenting as <span className="font-medium text-slate-700">{displayName}</span>
              {email ? ` (${email})` : ""}
            </p>
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? "Saving..." : "Add comment"}
            </Button>
          </div>
        </form>

        {errorMessage ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-900">History</h4>

          {isLoading ? <p className="text-sm text-slate-500">Loading comments...</p> : null}

          {!isLoading && comments.length === 0 ? (
            <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-600">
              No comments yet.
            </p>
          ) : null}

          {!isLoading && comments.length > 0
            ? comments.map((comment) => (
                <article
                  key={comment.id}
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <header className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800">
                        {comment.commentatorName}
                      </p>
                      <span
                        className={
                          comment.resolved
                            ? "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                            : "rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
                        }
                      >
                        {comment.resolved ? "Resolved" : "Open"}
                      </span>
                    </div>
                    <div className="text-right">
                      <time className="block text-xs text-slate-500" dateTime={comment.created_at}>
                        {formatDate(comment.created_at)}
                      </time>
                      {comment.resolved && comment.resolved_at ? (
                        <p className="text-xs text-emerald-700">
                          Resolved {formatDate(comment.resolved_at)}
                        </p>
                      ) : null}
                    </div>
                  </header>
                  <p className="mt-1 text-sm whitespace-pre-wrap text-slate-700">
                    {comment.comment}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-slate-500">
                      <p>{comment.commentatorEmail}</p>
                      {comment.resolved && comment.resolved_by_name ? (
                        <p className="text-emerald-700">
                          Resolved by {comment.resolved_by_name}
                          {comment.resolved_by_email ? ` (${comment.resolved_by_email})` : ""}
                        </p>
                      ) : null}
                    </div>
                    {!comment.resolved ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => void resolveComment(comment.id)}
                        disabled={!email || resolvingCommentId === comment.id}
                      >
                        {resolvingCommentId === comment.id ? "Resolving..." : "Mark resolved"}
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))
            : null}
        </section>
      </CardContent>
    </Card>
  );
}
