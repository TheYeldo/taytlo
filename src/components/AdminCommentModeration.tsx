"use client";

import { useState, useTransition } from "react";

type AdminEpisodeComment = {
  id: string;
  animeSlug: string;
  episodeNumber: number | null;
  authorName: string;
  body: string;
  createdAt: string;
  animeTitleRu: string;
  isHidden: boolean;
  userEmail?: string | null;
};

type AdminCommentModerationProps = {
  initialComments: AdminEpisodeComment[];
  token?: string;
};

function formatEpisode(episodeNumber: number | null) {
  return episodeNumber ? `Серия ${episodeNumber}` : "Тайтл целиком";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дата неизвестна";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export default function AdminCommentModeration({ initialComments, token }: AdminCommentModerationProps) {
  const [comments, setComments] = useState(initialComments);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleComment(comment: AdminEpisodeComment) {
    setActiveId(comment.id);
    setError(null);

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/admin/comments?token=${encodeURIComponent(token || "")}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: comment.id, isHidden: !comment.isHidden })
          });

          if (!response.ok) throw new Error("Не удалось обновить комментарий");
          const payload = (await response.json()) as { comment: AdminEpisodeComment };
          setComments((current) => current.map((item) => (item.id === payload.comment.id ? payload.comment : item)));
        } catch (requestError) {
          setError(requestError instanceof Error ? requestError.message : "Ошибка модерации");
        } finally {
          setActiveId(null);
        }
      })();
    });
  }

  return (
    <div className="admin-comment-list">
      {comments.map((comment) => (
        <article className={comment.isHidden ? "admin-comment is-hidden" : "admin-comment"} key={comment.id}>
          <div className="admin-comment-meta">
            <span>{comment.isHidden ? "Скрыт" : "Виден"}</span>
            <b>{comment.authorName}</b>
            <small>{comment.userEmail || formatDate(comment.createdAt)}</small>
          </div>
          <div className="admin-comment-body">
            <a href={`/anime/${comment.animeSlug}`}>{comment.animeTitleRu}</a>
            <span>
              {formatEpisode(comment.episodeNumber)} · {formatDate(comment.createdAt)}
            </span>
            <p>{comment.body}</p>
          </div>
          <div className="admin-comment-actions">
            <button type="button" onClick={() => toggleComment(comment)} disabled={isPending && activeId === comment.id}>
              {comment.isHidden ? "Вернуть" : "Скрыть"}
            </button>
          </div>
        </article>
      ))}
      {!comments.length ? <p className="empty">Комментариев пока нет</p> : null}
      {error ? <p className="empty">{error}</p> : null}
    </div>
  );
}
