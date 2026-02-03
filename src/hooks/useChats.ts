import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Chat, GameType } from '@/types/chat';

export function useChats(userId: string | undefined) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = useCallback(async () => {
    if (!userId) return;
    
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching chats:', error);
    } else {
      setChats(data as Chat[]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchChats();

    if (!userId) return;

    // Subscribe to realtime updates with specific event handling
    const channel = supabase
      .channel('chats-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setChats((prev) => [payload.new as Chat, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setChats((prev) =>
            prev.map((chat) =>
              chat.id === (payload.new as Chat).id ? (payload.new as Chat) : chat
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chats',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setChats((prev) => prev.filter((chat) => chat.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchChats]);

  const createChat = async (game: GameType = 'valorant') => {
    if (!userId) return null;

    const { data, error } = await supabase
      .from('chats')
      .insert({
        user_id: userId,
        game,
        title: 'New Chat',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating chat:', error);
      return null;
    }

    return data as Chat;
  };

  const updateChat = async (chatId: string, updates: Partial<Pick<Chat, 'title' | 'game' | 'reported_teams'>>) => {
    const { error } = await supabase
      .from('chats')
      .update(updates)
      .eq('id', chatId);

    if (error) {
      console.error('Error updating chat:', error);
      return false;
    }

    return true;
  };

  const deleteChat = async (chatId: string) => {
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId);

    if (error) {
      console.error('Error deleting chat:', error);
      return false;
    }

    return true;
  };

  return {
    chats,
    loading,
    createChat,
    updateChat,
    deleteChat,
    refetch: fetchChats,
  };
}
