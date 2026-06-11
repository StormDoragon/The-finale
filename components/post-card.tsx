"use client";

import {
  Check,
  Clipboard,
  Facebook,
  Pencil,
  RefreshCw,
  Save,
  Send,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  regeneratePost,
  updatePostContent,
  updatePostStatus,
} from "@/app/actions";
import { StatusPill } from "@/components/status-pill";
import { SubmitButton } from "@/components/submit-button";
import type { Post } from "@/lib/types";

function StatusAction({
  id,
  status,
  children,
  primary = false,
  enabled,
}: {
  id: string;
  status: string;
  children: React.ReactNode;
  primary?: boolean;
  enabled: boolean;
}) {
  return (
    <form action={updatePostStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton
        pendingLabel="…"
        disabled={!enabled}
        className={primary ? "btn-primary" : "btn-secondary"}
      >
        {children}
      </SubmitButton>
    </form>
  );
}

export function PostCard({
  post,
  actionsEnabled,
}: {
  post: Post;
  actionsEnabled: boolean;
}) {
  const [content, setContent] = useState(post.content);
  const [draftContent, setDraftContent] = useState(post.content);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState<string>();
  const [pendingAction, setPendingAction] = useState<"save" | "regenerate">();
  const [isPending, startTransition] = useTransition();
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setContent(post.content);
    setDraftContent(post.content);
  }, [post.content]);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  async function copyContent() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setActionError(
        "Copy failed. Please select the post text and copy it manually.",
      );
    }
  }

  function saveContent() {
    setActionError(undefined);
    setPendingAction("save");
    startTransition(async () => {
      try {
        const savedContent = await updatePostContent(post.id, draftContent);
        setContent(savedContent);
        setDraftContent(savedContent);
        setEditing(false);
      } catch {
        setActionError("The draft could not be saved. Please try again.");
      } finally {
        setPendingAction(undefined);
      }
    });
  }

  function regenerate() {
    setActionError(undefined);
    setPendingAction("regenerate");
    startTransition(async () => {
      try {
        const regeneratedContent = await regeneratePost(post.id);
        setContent(regeneratedContent);
        setDraftContent(regeneratedContent);
        setEditing(false);
      } catch {
        setActionError("The draft could not be regenerated. Please try again.");
      } finally {
        setPendingAction(undefined);
      }
    });
  }

  function cancelEdit() {
    setDraftContent(content);
    setEditing(false);
    setActionError(undefined);
  }

  return (
    <article className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b bg-slate-50/60 px-5 py-3">
        <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-slate-500">
          <Facebook size={16} className="shrink-0 text-blue-600" /> Facebook{" "}
          {post.trends?.title && (
            <>
              <span>·</span>
              <span className="truncate">{post.trends.title}</span>
            </>
          )}
        </div>
        <StatusPill status={post.status} />
      </div>
      <div className="p-5 md:p-7">
        {post.editorial_note && (
          <div className="mb-5 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
            <span className="font-semibold">Voice guidance:</span>{" "}
            {post.editorial_note}
          </div>
        )}

        {editing ? (
          <div className="max-w-3xl">
            <label className="label" htmlFor={`post-content-${post.id}`}>
              Post content
            </label>
            <textarea
              id={`post-content-${post.id}`}
              className="field min-h-56 resize-y text-[15px] leading-7"
              maxLength={5000}
              value={draftContent}
              onChange={(event) => setDraftContent(event.target.value)}
              disabled={isPending}
              autoFocus
            />
            <p className="mt-1 text-right text-xs text-slate-400">
              {draftContent.length}/5000
            </p>
          </div>
        ) : (
          <>
            <p className="max-w-3xl whitespace-pre-line text-[15px] leading-7 text-slate-700">
              {content}
            </p>
            <p className="mt-3 text-xs text-slate-400">
              {content.trim().split(/\s+/).length} words · {content.length}{" "}
              characters
            </p>
          </>
        )}

        {actionError && (
          <p role="alert" className="mt-4 text-sm font-medium text-red-700">
            {actionError}
          </p>
        )}

        <div className="mt-7 flex flex-wrap items-center gap-3 border-t pt-5">
          {editing ? (
            <>
              <button
                type="button"
                className="btn-primary"
                onClick={saveContent}
                disabled={isPending || !draftContent.trim()}
              >
                <Save size={15} />
                {isPending && pendingAction === "save" ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={cancelEdit}
                disabled={isPending}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              {post.status === "draft" && (
                <>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setEditing(true)}
                    disabled={!actionsEnabled || isPending}
                  >
                    <Pencil size={15} /> Edit
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={regenerate}
                    disabled={!actionsEnabled || isPending}
                  >
                    <RefreshCw
                      size={15}
                      className={
                        isPending && pendingAction === "regenerate"
                          ? "animate-spin"
                          : ""
                      }
                    />
                    {isPending && pendingAction === "regenerate"
                      ? "Regenerating…"
                      : "Regenerate"}
                  </button>
                  <StatusAction
                    id={post.id}
                    status="approved"
                    primary
                    enabled={actionsEnabled}
                  >
                    <Check size={16} /> Approve
                  </StatusAction>
                  <StatusAction
                    id={post.id}
                    status="rejected"
                    enabled={actionsEnabled}
                  >
                    <X size={15} /> Reject
                  </StatusAction>
                </>
              )}
              {post.status === "approved" && (
                <StatusAction
                  id={post.id}
                  status="published"
                  primary
                  enabled={actionsEnabled}
                >
                  <Send size={15} /> Mark as published
                </StatusAction>
              )}
              {post.status === "published" && (
                <p className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                  <Check size={15} /> Publishing complete
                </p>
              )}
            </>
          )}

          <button
            type="button"
            className="btn-secondary sm:ml-auto"
            onClick={copyContent}
          >
            <Clipboard size={15} /> {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </article>
  );
}
