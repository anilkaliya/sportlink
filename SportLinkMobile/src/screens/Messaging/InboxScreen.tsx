import React, { useCallback, useState, useEffect } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Image, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { messagingApi } from '../../api/messaging'
import { useMessagingStore } from '../../stores/messagingStore'
import { useAuthStore } from '../../stores/authStore'
import { useWebSocket } from '../../hooks/useWebSocket'
import { athleteApi } from '../../api/athlete'
import { colors, spacing, fontSize, radii } from '../../theme'
import type { Conversation, WsServerEvent } from '../../types/messaging'

const EMPTY_TYPING: string[] = []

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function ConversationRow({ item }: { item: Conversation }) {
  const navigation = useNavigation<any>()
  const currentUserId = useAuthStore(s => s.userId)
  const presence = useMessagingStore(s => s.presence)
  const typingMap = useMessagingStore(s => s.typing)
  const typing = typingMap[item.conversation_id] ?? EMPTY_TYPING

  const other = item.participants.find(p => p.user_id !== currentUserId)
  const name = other ? `${other.first_name} ${other.last_name}` : 'Unknown'
  const isOnline = other ? presence[other.user_id] === 'online' : false
  const photoUrl = other?.profile_photo_url
    ? athleteApi.getPhotoUrl(other.user_id)
    : null

  const lastMsg = item.last_message
  let preview = ''
  if (typing.length > 0) {
    preview = 'Typing...'
  } else if (lastMsg) {
    if (lastMsg.is_deleted) {
      preview = 'Message deleted'
    } else if (lastMsg.content) {
      preview = lastMsg.sender_id === currentUserId ? `You: ${lastMsg.content}` : lastMsg.content
    } else if (lastMsg.attachments?.length) {
      preview = lastMsg.sender_id === currentUserId ? 'You sent an attachment' : 'Sent an attachment'
    }
  }

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => navigation.navigate('Chat', { conversationId: item.conversation_id })}
    >
      <View style={styles.avatarWrap}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {other ? other.first_name[0] : '?'}
            </Text>
          </View>
        )}
        {isOnline && <View style={styles.onlineDot} />}
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text style={[styles.name, item.unread_count > 0 && styles.nameBold]} numberOfLines={1}>
            {name}
          </Text>
          {lastMsg && (
            <Text style={[styles.time, item.unread_count > 0 && styles.timeUnread]}>
              {formatTime(lastMsg.created_at)}
            </Text>
          )}
        </View>
        <View style={styles.rowBottom}>
          <Text
            style={[
              styles.preview,
              typing.length > 0 && styles.previewTyping,
              item.unread_count > 0 && styles.previewUnread,
            ]}
            numberOfLines={1}
          >
            {preview || 'No messages yet'}
          </Text>
          {item.unread_count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {item.unread_count > 99 ? '99+' : item.unread_count}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

export function InboxScreen() {
  const [search, setSearch] = useState('')
  const setConversations = useMessagingStore(s => s.setConversations)
  const conversations = useMessagingStore(s => s.conversations)
  const setTotalUnread = useMessagingStore(s => s.setTotalUnread)
  const setPresence = useMessagingStore(s => s.setPresence)
  const setTyping = useMessagingStore(s => s.setTyping)
  const moveConversationToTop = useMessagingStore(s => s.moveConversationToTop)

  const { isLoading, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await messagingApi.getConversations()
      setConversations(res.data)
      return res.data
    },
    staleTime: 0,
    refetchOnMount: 'always',
  })

  useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => {
      const res = await messagingApi.getUnreadCount()
      setTotalUnread(res.data.unread_count)
      return res.data
    },
  })

  // WebSocket handler for realtime updates
  const handleWsEvent = useCallback((event: WsServerEvent) => {
    switch (event.type) {
      case 'message:new':
        moveConversationToTop(event.payload.conversation_id, event.payload)
        break
      case 'presence:update':
        setPresence(event.payload.user_id, event.payload.status)
        break
      case 'typing:start':
        setTyping(event.payload.conversation_id, event.payload.user_id, true)
        break
      case 'typing:stop':
        setTyping(event.payload.conversation_id, event.payload.user_id, false)
        break
    }
  }, [moveConversationToTop, setPresence, setTyping])

  useWebSocket(handleWsEvent)

  // Refetch conversations every time screen gains focus
  useFocusEffect(
    useCallback(() => { refetch() }, [refetch])
  )

  const filtered = search.trim()
    ? conversations.filter(c => {
        const other = c.participants.find(p => p.user_id !== useAuthStore.getState().userId)
        const name = other ? `${other.first_name} ${other.last_name}` : ''
        return name.toLowerCase().includes(search.toLowerCase())
      })
    : conversations

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a conversation from an athlete's profile
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={({ item }) => <ConversationRow item={item} />}
          keyExtractor={item => item.conversation_id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  list: { paddingBottom: spacing.xxxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: colors.accent },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  rowContent: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  name: { fontSize: fontSize.md, color: colors.text, flex: 1 },
  nameBold: { fontWeight: '700' },
  time: { fontSize: fontSize.xs, color: colors.muted, marginLeft: spacing.sm },
  timeUnread: { color: colors.accent, fontWeight: '600' },
  preview: { fontSize: fontSize.sm, color: colors.muted, flex: 1 },
  previewTyping: { color: colors.accent, fontStyle: 'italic' },
  previewUnread: { color: colors.text, fontWeight: '500' },
  badge: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: spacing.sm,
  },
  badgeText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.lg },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  emptySubtitle: { fontSize: fontSize.sm, color: colors.muted, textAlign: 'center', marginTop: spacing.xs },
})
