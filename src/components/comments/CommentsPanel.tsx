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

type CommentWithReplies = Comment & {
  replies: Comment[];
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
  parentCommentId: number | null,
): NewCommentPayload {
  const basePayload: NewCommentPayload = {
    comment: body,
    commentatorName,
    commentatorEmail,
    nutrition: null,
    brand: null,
    product: null,
    comment_id: parentCommentId,
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
  const [commentMap, setCommentMap] = React.useState<Map<number, Comment>>(new Map());
  const [commentInput, setCommentInput] = React.useState("");
  const [replyInputs, setReplyInputs] = React.useState<Record<number, string>>({});
  const [activeReplyCommentId, setActiveReplyCommentId] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isReplySubmitting, setIsReplySubmitting] = React.useState(false);
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
          "id, created_at, deleted_at, resolved, resolved_by_name, resolved_by_email, resolved_at, comment, commentatorName, commentatorEmail, nutrition, brand, product, comment_id",
        )
        .eq(filter.field, filter.value)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      const loadedComments = (data ?? []) as Comment[];
      setComments(loadedComments);
      setCommentMap(new Map(loadedComments.map((comment) => [comment.id, comment])));
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

  const threadedComments = React.useMemo<CommentWithReplies[]>(() => {
    const topLevel: CommentWithReplies[] = [];
    const repliesByParent = new Map<number, Comment[]>();

    for (const comment of comments) {
      if (comment.comment_id == null) {
        topLevel.push({ ...comment, replies: [] });
        continue;
      }

      // Hard guard: only allow one level in UI. Any nested reply-to-reply is ignored from rendering.
      const parent = commentMap.get(comment.comment_id);
      if (!parent || parent.comment_id != null || parent.id === comment.id) {
        continue;
      }

      const existing = repliesByParent.get(parent.id) ?? [];
      existing.push(comment);
      repliesByParent.set(parent.id, existing);
    }

    for (const parent of topLevel) {
      parent.replies = (repliesByParent.get(parent.id) ?? []).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    }

    return topLevel.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [commentMap, comments]);

  const canSubmit = Boolean(commentInput.trim() && email && !isSubmitting);

  const submitComment = async (body: string, parentCommentId: number | null) => {
    if (!email) {
      setErrorMessage("Your email is required to submit a comment.");
      return;
    }

    const trimmedBody = body.trim();
    if (!trimmedBody) return;

    if (parentCommentId != null) {
      // Validate parent to prevent reply cycles and enforce max depth = 1.
      const { data: parentComment, error } = await supabase
        .from("comments")
        .select("id, deleted_at, comment_id, nutrition, brand, product")
        .eq("id", parentCommentId)
        .single();

      if (error || !parentComment) {
        throw new Error("Reply target no longer exists.");
      }

      if (parentComment.deleted_at) {
        throw new Error("Reply target has been deleted.");
      }

      if (parentComment.comment_id != null) {
        throw new Error("Replies are only allowed on top-level comments.");
      }

      const expectedTopLevelMatch =
        type === "product"
          ? parentComment.product === String(id)
          : parentComment[type] === Number(id);

      if (!expectedTopLevelMatch) {
        throw new Error("Reply target is not part of this thread.");
      }
    }

    const payload = createInsertPayload(type, id, trimmedBody, displayName, email, parentCommentId);
    const { error } = await supabase.from("comments").insert(payload);

    if (error) {
      throw new Error(error.message);
    }
  };

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

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await submitComment(commentInput, null);
      setCommentInput("");
      await loadComments();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save comment";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (parentCommentId: number) => {
    const currentReplyText = replyInputs[parentCommentId] ?? "";
    if (!currentReplyText.trim()) return;

    setIsReplySubmitting(true);
    setErrorMessage(null);

    try {
      await submitComment(currentReplyText, parentCommentId);
      setReplyInputs((previous) => ({ ...previous, [parentCommentId]: "" }));
      setActiveReplyCommentId(null);
      await loadComments();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save reply";
      setErrorMessage(message);
    } finally {
      setIsReplySubmitting(false);
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

          {!isLoading && threadedComments.length > 0
            ? threadedComments.map((comment) => (
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
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setActiveReplyCommentId((current) =>
                              current === comment.id ? null : comment.id,
                            )
                          }
                          disabled={!email || isReplySubmitting}
                        >
                          Reply
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => void resolveComment(comment.id)}
                          disabled={!email || resolvingCommentId === comment.id}
                        >
                          {resolvingCommentId === comment.id ? "Resolving..." : "Mark resolved"}
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  {activeReplyCommentId === comment.id ? (
                    <div className="mt-3 space-y-2 rounded-md border border-slate-200 bg-white p-3">
                      <label
                        className="block text-xs font-medium text-slate-600"
                        htmlFor={`reply-${comment.id}`}
                      >
                        Reply
                      </label>
                      <textarea
                        id={`reply-${comment.id}`}
                        className="min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                        value={replyInputs[comment.id] ?? ""}
                        onChange={(event) =>
                          setReplyInputs((previous) => ({
                            ...previous,
                            [comment.id]: event.target.value,
                          }))
                        }
                        placeholder="Write your reply..."
                        disabled={isReplySubmitting}
                      />
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setActiveReplyCommentId(null)}
                          disabled={isReplySubmitting}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={() => void handleReplySubmit(comment.id)}
                          disabled={
                            !email || isReplySubmitting || !(replyInputs[comment.id] ?? "").trim()
                          }
                        >
                          {isReplySubmitting ? "Saving..." : "Add reply"}
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {comment.replies.length > 0 ? (
                    <div className="mt-3 space-y-2 border-l-2 border-slate-200 pl-3">
                      {comment.replies.map((reply) => (
                        <article
                          key={reply.id}
                          className="rounded-md border border-slate-200 bg-white px-3 py-2"
                        >
                          <header className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-slate-800">
                                {reply.commentatorName}
                              </p>
                              <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                Reply
                              </span>
                              <span
                                className={
                                  reply.resolved
                                    ? "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                                    : "rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
                                }
                              >
                                {reply.resolved ? "Resolved" : "Open"}
                              </span>
                            </div>
                            <time className="text-xs text-slate-500" dateTime={reply.created_at}>
                              {formatDate(reply.created_at)}
                            </time>
                          </header>
                          <p className="mt-1 text-sm whitespace-pre-wrap text-slate-700">
                            {reply.comment}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            <div className="text-xs text-slate-500">
                              <p>{reply.commentatorEmail}</p>
                              {reply.resolved && reply.resolved_by_name ? (
                                <p className="text-emerald-700">
                                  Resolved by {reply.resolved_by_name}
                                  {reply.resolved_by_email ? ` (${reply.resolved_by_email})` : ""}
                                </p>
                              ) : null}
                            </div>
                            {!reply.resolved ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => void resolveComment(reply.id)}
                                disabled={!email || resolvingCommentId === reply.id}
                              >
                                {resolvingCommentId === reply.id ? "Resolving..." : "Mark resolved"}
                              </Button>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))
            : null}
        </section>
      </CardContent>
    </Card>
  );
}
