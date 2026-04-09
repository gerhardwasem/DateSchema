import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ProposalComment } from '../lib/types';

export function useProposalComments(proposalId?: string) {
  const [comments, setComments] = useState<ProposalComment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    if (!proposalId) {
      setComments([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('proposal_comments')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setComments(data as ProposalComment[]);
    }
    setLoading(false);
  }, [proposalId]);

  useEffect(() => {
    setLoading(true);
    fetchComments();
  }, [fetchComments]);

  const addComment = async (author: string, body: string) => {
    if (!proposalId) return false;
    const { error } = await supabase.from('proposal_comments').insert({
      proposal_id: proposalId,
      author,
      body,
    });
    if (!error) await fetchComments();
    return !error;
  };

  const editComment = async (id: string, body: string) => {
    const { error } = await supabase
      .from('proposal_comments')
      .update({ body })
      .eq('id', id);
    if (!error) await fetchComments();
    return !error;
  };

  const deleteComment = async (id: string) => {
    const { error } = await supabase
      .from('proposal_comments')
      .delete()
      .eq('id', id);
    if (!error) await fetchComments();
    return !error;
  };

  return { comments, loading, addComment, editComment, deleteComment, refetch: fetchComments };
}
