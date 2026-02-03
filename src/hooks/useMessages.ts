import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Message } from '@/types/chat';

export function useMessages(chatId: string | null, userId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!chatId || !userId) {
      setMessages([]);
      return;
    }
    
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data as Message[]);
    }
    setLoading(false);
  }, [chatId, userId]);

  useEffect(() => {
    fetchMessages();

    if (!chatId) return;

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`messages-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, userId, fetchMessages]);

  const addMessage = async (
    role: 'user' | 'assistant',
    content: string,
    teamMentioned?: string,
    isFirstTeamReport?: boolean
  ) => {
    if (!chatId || !userId) return null;

    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        user_id: userId,
        role,
        content,
        team_mentioned: teamMentioned || null,
        is_first_team_report: isFirstTeamReport || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding message:', error);
      return null;
    }

    return data as Message;
  };

  return {
    messages,
    loading,
    addMessage,
    refetch: fetchMessages,
  };
}
