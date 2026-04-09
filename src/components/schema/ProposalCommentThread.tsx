import { useState } from 'react';
import { Send, User, MessageCircle, Pencil, Trash2, X, Check } from 'lucide-react';
import type { ProposalComment } from '../../lib/types';

interface Props {
  comments: ProposalComment[];
  loading: boolean;
  onAddComment: (author: string, body: string) => Promise<boolean>;
  onEditComment?: (id: string, body: string) => Promise<boolean>;
  onDeleteComment?: (id: string) => Promise<boolean>;
}

export default function ProposalCommentThread({ comments, loading, onAddComment, onEditComment, onDeleteComment }: Props) {
  const [author, setAuthor] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!author.trim() || !body.trim()) return;
    setSending(true);
    const ok = await onAddComment(author, body);
    if (ok) {
      setBody('');
    }
    setSending(false);
  };

  const startEdit = (comment: ProposalComment) => {
    setEditingId(comment.id);
    setEditBody(comment.body);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditBody('');
  };

  const saveEdit = async () => {
    if (!onEditComment || !editingId || !editBody.trim()) return;
    setSavingEdit(true);
    const ok = await onEditComment(editingId, editBody.trim());
    if (ok) {
      setEditingId(null);
      setEditBody('');
    }
    setSavingEdit(false);
  };

  const handleDelete = async (id: string) => {
    if (!onDeleteComment) return;
    setDeletingId(id);
    await onDeleteComment(id);
    setDeletingId(null);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <div className="flex items-center gap-1.5 mb-2">
        <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs font-medium text-slate-500">{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-3">
          <div className="animate-spin w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-2 mb-3">
          {comments.map((c) => (
            <div key={c.id} className="group flex gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3 h-3 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">{c.author}</span>
                  <span className="text-xs text-slate-400">{formatTime(c.created_at)}</span>
                  <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEditComment && editingId !== c.id && (
                      <button
                        onClick={() => startEdit(c)}
                        title="Edit comment"
                        className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                    {onDeleteComment && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        title="Delete comment"
                        className="p-0.5 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                {editingId === c.id ? (
                  <div className="mt-1">
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={2}
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                      autoFocus
                    />
                    <div className="flex items-center gap-1.5 mt-1">
                      <button
                        onClick={saveEdit}
                        disabled={savingEdit || !editBody.trim()}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:opacity-50 transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        {savingEdit ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{c.body}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Name"
          className="w-24 px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
        />
        <div className="flex-1 flex gap-1.5">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment..."
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
          />
          <button
            onClick={handleSubmit}
            disabled={sending || !author.trim() || !body.trim()}
            className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
