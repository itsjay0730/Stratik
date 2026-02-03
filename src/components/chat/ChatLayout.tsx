import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { TacticalBackground } from '@/components/chat/TacticalBackground';

import { useAuth } from '@/hooks/useAuth';
import { useChats } from '@/hooks/useChats';
import { useMessages } from '@/hooks/useMessages';
import { useGameTheme } from '@/hooks/useGameTheme';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Chat, GameType, TeamCache, ScoutingReport } from '@/types/chat';

export function ChatLayout() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { chats, createChat, updateChat, deleteChat } = useChats(user?.id);
  const { messages, addMessage, loading: messagesLoading } = useMessages(chatId || null, user?.id);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameType>('valorant');
  const [teams, setTeams] = useState<TeamCache[]>([]);
  const [scoutingReports, setScoutingReports] = useState<Record<string, ScoutingReport>>({});
  const [sending, setSending] = useState(false);

  // Set active chat when chatId changes
  useEffect(() => {
    if (chatId && chats.length > 0) {
      const chat = chats.find(c => c.id === chatId);
      setActiveChat(chat || null);
    } else {
      setActiveChat(null);
    }
  }, [chatId, chats]);

  // Apply game theme based on selectedGame (for sidebar toggle) or activeChat
  useGameTheme(selectedGame);

  // Fetch teams cache
  useEffect(() => {
    const fetchTeams = async () => {
      const { data } = await supabase
        .from('teams_cache')
        .select('*');
      
      if (data) {
        setTeams(data as TeamCache[]);
      }
    };
    fetchTeams();
  }, []);

  const handleSelectChat = (chat: Chat) => {
    navigate(`/chat/${chat.id}`);
    setSidebarOpen(false);
  };

  const handleNewChat = async (game: GameType) => {
    const newChat = await createChat(game);
    if (newChat) {
      navigate(`/chat/${newChat.id}`);
      setSidebarOpen(false);
    }
  };

  // Handle game change - close current chat and navigate to home
  const handleGameChange = (game: GameType) => {
    setSelectedGame(game);
    // Navigate away from current chat when switching games
    if (chatId) {
      navigate('/');
    }
  };

  const handleDeleteChat = async (id: string) => {
    const success = await deleteChat(id);
    if (success) {
      toast.success('Chat deleted');
      if (chatId === id) {
        navigate('/');
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSendMessage = async (content: string, team?: string) => {
    if (!user) return;
    
    // If no active chat, create one first with the selected game
    if (!activeChat) {
      const newChat = await createChat(selectedGame);
      if (!newChat) return;
      
      // Navigate to the new chat - the message will be sent after navigation
      navigate(`/chat/${newChat.id}`);
      
      // Wait a bit for navigation to complete, then send the message
      setTimeout(async () => {
        setSending(true);
        try {
          await addMessage('user', content, team);
          
          // Update chat title
          const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
          await updateChat(newChat.id, { title });
          
          // Call the AI edge function
          const { data, error } = await supabase.functions.invoke('chat-with-ai', {
            body: {
              chatId: newChat.id,
              message: content,
              game: selectedGame,
              team,
              isFirstTeamMention: !!team,
              conversationHistory: [],
            },
          });
          
          if (error) throw error;
          
          await addMessage('assistant', data.response, team, !!team && data.scoutingReport);
          
          if (data.scoutingReport && team) {
            setScoutingReports(prev => ({
              ...prev,
              [team]: data.scoutingReport,
            }));
            await updateChat(newChat.id, { reported_teams: [team] });
          }
        } catch (error: any) {
          console.error('Error sending message:', error);
          toast.error('Failed to get response. Please try again.');
        } finally {
          setSending(false);
        }
      }, 100);
      return;
    }

    setSending(true);
    
    try {
      // Add user message
      await addMessage('user', content, team);

      // Update chat title if it's the first message
      if (messages.length === 0) {
        const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
        await updateChat(activeChat.id, { title });
      }

      // Check if this is a first-time team mention for this chat
      const isFirstTeamMention = team && !activeChat.reported_teams?.includes(team);

      // Call the AI edge function
      const { data, error } = await supabase.functions.invoke('chat-with-ai', {
        body: {
          chatId: activeChat.id,
          message: content,
          game: activeChat.game,
          team,
          isFirstTeamMention,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        },
      });

      if (error) throw error;

      // Add assistant message
      await addMessage(
        'assistant',
        data.response,
        team,
        isFirstTeamMention && data.scoutingReport
      );

      // Store scouting report if provided
      if (data.scoutingReport && team) {
        setScoutingReports(prev => ({
          ...prev,
          [team]: data.scoutingReport,
        }));
        
        // Update chat's reported_teams
        if (isFirstTeamMention) {
          await updateChat(activeChat.id, {
            reported_teams: [...(activeChat.reported_teams || []), team],
          });
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to get response. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      {/* Tactical Background - only show when no active chat */}
      {!chatId && <TacticalBackground game={selectedGame} />}
      
      {/* Mobile sidebar - overlay */}
      <div className="lg:hidden">
        <ChatSidebar
          chats={chats}
          activeChatId={chatId || null}
          selectedGame={selectedGame}
          onGameChange={handleGameChange}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          onSignOut={handleSignOut}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:flex flex-1 relative z-10">
        <ChatSidebar
          chats={chats}
          activeChatId={chatId || null}
          selectedGame={selectedGame}
          onGameChange={handleGameChange}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          onSignOut={handleSignOut}
          isOpen={true}
          onToggle={() => {}}
        />
        <ChatWindow
          chat={activeChat}
          messages={messages}
          loading={sending || messagesLoading}
          onSendMessage={handleSendMessage}
          teams={teams}
          scoutingReports={scoutingReports}
          selectedGame={selectedGame}
        />
      </div>

      {/* Mobile main content */}
      <main className="flex-1 flex flex-col overflow-hidden lg:hidden relative z-10">
        <ChatWindow
          chat={activeChat}
          messages={messages}
          loading={sending || messagesLoading}
          onSendMessage={handleSendMessage}
          teams={teams}
          scoutingReports={scoutingReports}
          selectedGame={selectedGame}
        />
      </main>
    </div>
  );
}
