import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Image, KeyboardAvoidingView, Platform,
  Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRoute, useNavigation } from '@react-navigation/native'
import { launchImageLibrary } from 'react-native-image-picker'
import { messagingApi } from '../../api/messaging'
import { useMessagingStore } from '../../stores/messagingStore'
import { useAuthStore } from '../../stores/authStore'
import { useWebSocket, useWsSend } from '../../hooks/useWebSocket'
import { colors, spacing, fontSize, radii } from '../../theme'
import type { Message, WsServerEvent, AttachmentInput } from '../../types/messaging'

const EMPTY_MESSAGES: Message[] = []
const EMPTY_TYPING: string[] = []

function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function formatMsgTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDaySeparator(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
}

function shouldShowDaySeparator(msg: Message, prevMsg: Message | null): boolean {
  if (!prevMsg) return true
  const d1 = new Date(msg.created_at).toDateString()
  const d2 = new Date(prevMsg.created_at).toDateString()
  return d1 !== d2
}

// Attachment preview
function AttachmentView({ attachment }: { attachment: Message['attachments'][0] }) {
  if (attachment.mime_type.startsWith('image/')) {
    return (
      <Image
        source={{ uri: attachment.data_uri }}
        style={styles.attachImage}
        resizeMode="cover"
      />
    )
  }
  return (
    <View style={styles.fileCard}>
      <Text style={styles.fileIcon}>📎</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.fileName} numberOfLines={1}>{attachment.file_name}</Text>
        <Text style={styles.fileSize}>{(attachment.size_bytes / 1024).toFixed(0)} KB</Text>
      </View>
    </View>
  )
}

// Message bubble
function MessageBubble({
  message,
  isOwn,
  onReply,
  onEdit,
  onDelete,
}: {
  message: Message
  isOwn: boolean
  onReply: (msg: Message) => void
  onEdit: (msg: Message) => void
  onDelete: (msg: Message) => void
}) {
  const [showActions, setShowActions] = useState(false)

  if (message.is_deleted) {
    return (
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther, styles.bubbleDeleted]}>
        <Text style={styles.deletedText}>Message deleted</Text>
      </View>
    )
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onLongPress={() => setShowActions(true)}
      style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}
    >
      {message.reply_to && (
        <View style={styles.replyPreview}>
          <Text style={styles.replyPreviewText} numberOfLines={1}>
            {message.reply_to.content ?? 'Attachment'}
          </Text>
        </View>
      )}
      {message.attachments?.map(att => (
        <AttachmentView key={att.attachment_id} attachment={att} />
      ))}
      {message.content && (
        <Text style={[styles.msgText, isOwn && styles.msgTextOwn]}>
          {message.content}
        </Text>
      )}
      <View style={styles.msgMeta}>
        {message.is_edited === 1 && <Text style={styles.editedLabel}>edited</Text>}
        <Text style={[styles.msgTime, isOwn && styles.msgTimeOwn]}>
          {formatMsgTime(message.created_at)}
        </Text>
        {isOwn && message._status === 'sending' && <Text style={styles.statusIcon}>◌</Text>}
        {isOwn && message._status === 'failed' && <Text style={styles.statusFailed}>!</Text>}
      </View>
      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => { setShowActions(false); onReply(message) }}>
            <Text style={styles.actionText}>Reply</Text>
          </TouchableOpacity>
          {isOwn && (
            <>
              <TouchableOpacity onPress={() => { setShowActions(false); onEdit(message) }}>
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowActions(false); onDelete(message) }}>
                <Text style={[styles.actionText, { color: '#dc2626' }]}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity onPress={() => setShowActions(false)}>
            <Text style={styles.actionText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  )
}

export function ChatScreen() {
  const route = useRoute<any>()
  const navigation = useNavigation<any>()
  const conversationId: string = route.params?.conversationId
  const currentUserId = useAuthStore(s => s.userId)
  const accessToken = useAuthStore(s => s.accessToken)

  const messagesMap = useMessagingStore(s => s.messages)
  const messages = messagesMap[conversationId] ?? EMPTY_MESSAGES
  const conversations = useMessagingStore(s => s.conversations)
  const typingMap = useMessagingStore(s => s.typing)
  const typing = typingMap[conversationId] ?? EMPTY_TYPING
  const setMessages = useMessagingStore(s => s.setMessages)
  const prependMessages = useMessagingStore(s => s.prependMessages)
  const addMessage = useMessagingStore(s => s.addMessage)
  const updateMessage = useMessagingStore(s => s.updateMessage)
  const deleteMessage = useMessagingStore(s => s.deleteMessage)
  const setTyping = useMessagingStore(s => s.setTyping)
  const setActiveConversation = useMessagingStore(s => s.setActiveConversation)
  const decrementUnread = useMessagingStore(s => s.decrementUnread)
  const setMessageStatus = useMessagingStore(s => s.setMessageStatus)

  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [editingMsg, setEditingMsg] = useState<Message | null>(null)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [attachments, setAttachments] = useState<AttachmentInput[]>([])
  const flatListRef = useRef<FlatList>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wsSend = useWsSend()

  const convo = conversations.find(c => c.conversation_id === conversationId)
  const other = convo?.participants.find(p => p.user_id !== currentUserId)
  const headerName = other ? `${other.first_name} ${other.last_name}` : 'Chat'

  // Mark active and fetch initial messages
  useEffect(() => {
    setActiveConversation(conversationId)
    decrementUnread(conversationId)
    messagingApi.markRead(conversationId).catch(() => {})
    wsSend({ type: 'conversation:read', payload: { conversation_id: conversationId } })

    messagingApi.getMessages(conversationId).then(res => {
      setMessages(conversationId, res.data.messages.reverse())
      setHasMore(res.data.has_more)
      setInitialLoading(false)
    }).catch(() => setInitialLoading(false))

    return () => { setActiveConversation(null) }
  }, [conversationId])

  // WebSocket handler
  const handleWsEvent = useCallback((event: WsServerEvent) => {
    if (event.type === 'message:new' && event.payload.conversation_id === conversationId) {
      addMessage(event.payload)
      // Mark read since we're viewing
      messagingApi.markRead(conversationId).catch(() => {})
    }
    if (event.type === 'message:update' && event.payload.conversation_id === conversationId) {
      updateMessage(event.payload)
    }
    if (event.type === 'message:delete' && event.payload.conversation_id === conversationId) {
      deleteMessage(event.payload.message_id, conversationId)
    }
    if (event.type === 'typing:start' && event.payload.conversation_id === conversationId) {
      setTyping(conversationId, event.payload.user_id, true)
    }
    if (event.type === 'typing:stop' && event.payload.conversation_id === conversationId) {
      setTyping(conversationId, event.payload.user_id, false)
    }
  }, [conversationId, addMessage, updateMessage, deleteMessage, setTyping])

  useWebSocket(handleWsEvent)

  // Send typing indicator
  function handleTextChange(val: string) {
    setText(val)
    if (val.length > 0) {
      wsSend({ type: 'typing:start', payload: { conversation_id: conversationId } })
      if (typingTimer.current) clearTimeout(typingTimer.current)
      typingTimer.current = setTimeout(() => {
        wsSend({ type: 'typing:stop', payload: { conversation_id: conversationId } })
      }, 3000)
    }
  }

  // Send message
  async function handleSend() {
    const content = text.trim()
    if (!content && attachments.length === 0) return

    if (editingMsg) {
      // Edit mode
      try {
        const res = await messagingApi.editMessage(editingMsg.message_id, content)
        updateMessage(res.data)
        wsSend({ type: 'message:edit', payload: { message_id: editingMsg.message_id, content } })
      } catch (e: any) {
        Alert.alert('Error', e.message ?? 'Failed to edit')
      }
      setEditingMsg(null)
      setText('')
      return
    }

    const tempId = generateTempId()
    const optimistic: Message = {
      message_id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId ?? '',
      message_type: attachments.length > 0 ? 'image' : 'text',
      content: content || null,
      reply_to_id: replyTo?.message_id ?? null,
      reply_to: replyTo,
      is_edited: 0,
      edited_at: null,
      is_deleted: 0,
      metadata: null,
      attachments: [],
      created_at: new Date().toISOString(),
      _status: 'sending',
      _tempId: tempId,
    }

    addMessage(optimistic)
    setText('')
    setReplyTo(null)
    const currentAttachments = [...attachments]
    setAttachments([])

    wsSend({ type: 'typing:stop', payload: { conversation_id: conversationId } })

    try {
      const res = await messagingApi.sendMessage({
        conversation_id: conversationId,
        message_type: currentAttachments.length > 0 ? 'image' : 'text',
        content: content || undefined,
        reply_to_id: replyTo?.message_id,
        attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      })
      setMessageStatus(tempId, conversationId, 'sent', res.data)
    } catch {
      setMessageStatus(tempId, conversationId, 'failed')
    }
  }

  // Load older messages
  async function loadOlder() {
    if (loadingOlder || !hasMore || messages.length === 0) return
    setLoadingOlder(true)
    const oldest = messages[0]
    try {
      const res = await messagingApi.getMessages(conversationId, oldest.created_at)
      prependMessages(conversationId, res.data.messages.reverse())
      setHasMore(res.data.has_more)
    } catch {}
    setLoadingOlder(false)
  }

  // Pick attachment from storage
  async function handlePickAttachment() {
    const result = await launchImageLibrary({ mediaType: 'mixed', quality: 0.7, maxWidth: 1200, maxHeight: 1200 })
    if (result.didCancel || !result.assets?.[0]) return
    const asset = result.assets[0]
    if (!asset.uri) return

    // Read as base64
    const response = await fetch(asset.uri)
    const blob = await response.blob()
    const reader = new FileReader()
    reader.onload = () => {
      const dataUri = reader.result as string
      setAttachments(prev => [...prev, {
        file_name: asset.fileName ?? 'file',
        mime_type: asset.type ?? 'application/octet-stream',
        size_bytes: asset.fileSize ?? 0,
        data_uri: dataUri,
      }])
    }
    reader.readAsDataURL(blob)
  }

  function handleDelete(msg: Message) {
    Alert.alert('Delete Message', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await messagingApi.deleteMessage(msg.message_id)
            deleteMessage(msg.message_id, conversationId)
            wsSend({ type: 'message:delete', payload: { message_id: msg.message_id } })
          } catch (e: any) {
            Alert.alert('Error', e.message ?? 'Failed to delete')
          }
        },
      },
    ])
  }

  function handleEdit(msg: Message) {
    setEditingMsg(msg)
    setText(msg.content ?? '')
  }

  function renderItem({ item, index }: { item: Message; index: number }) {
    const isOwn = item.sender_id === currentUserId
    const prevMsg = index > 0 ? messages[index - 1] : null
    const showDay = shouldShowDaySeparator(item, prevMsg)

    return (
      <>
        {showDay && (
          <View style={styles.daySeparator}>
            <Text style={styles.daySeparatorText}>{formatDaySeparator(item.created_at)}</Text>
          </View>
        )}
        <View style={[styles.msgRow, isOwn && styles.msgRowOwn]}>
          <MessageBubble
            message={item}
            isOwn={isOwn}
            onReply={setReplyTo}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </View>
      </>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{headerName}</Text>
          {typing.length > 0 && <Text style={styles.headerTyping}>typing...</Text>}
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {initialLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={item => item.message_id}
            contentContainerStyle={styles.msgList}
            onEndReachedThreshold={0.1}
            inverted={false}
            onStartReached={loadOlder}
            onStartReachedThreshold={0.2}
            ListHeaderComponent={
              loadingOlder ? (
                <ActivityIndicator size="small" color={colors.muted} style={{ padding: spacing.md }} />
              ) : null
            }
            onContentSizeChange={() => {
              if (!loadingOlder) {
                flatListRef.current?.scrollToEnd({ animated: false })
              }
            }}
          />
        )}

        {/* Reply/Edit preview */}
        {(replyTo || editingMsg) && (
          <View style={styles.replyBar}>
            <View style={{ flex: 1 }}>
              <Text style={styles.replyBarLabel}>
                {editingMsg ? 'Editing message' : 'Replying to'}
              </Text>
              <Text style={styles.replyBarText} numberOfLines={1}>
                {editingMsg?.content ?? replyTo?.content ?? 'Attachment'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => { setReplyTo(null); setEditingMsg(null); setText('') }}>
              <Text style={styles.replyBarClose}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Attachment preview */}
        {attachments.length > 0 && (
          <View style={styles.attachBar}>
            {attachments.map((att, i) => (
              <View key={i} style={styles.attachPreview}>
                {att.mime_type.startsWith('image/') ? (
                  <Image source={{ uri: att.data_uri }} style={styles.attachThumb} />
                ) : (
                  <Text style={styles.attachFileName} numberOfLines={1}>{att.file_name}</Text>
                )}
                <TouchableOpacity
                  style={styles.attachRemove}
                  onPress={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                >
                  <Text style={styles.attachRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Composer */}
        <View style={styles.composer}>
          <TouchableOpacity onPress={handlePickAttachment} style={styles.attachBtn}>
            <Text style={{ fontSize: 20 }}>📎</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={handleTextChange}
            placeholder="Type a message..."
            placeholderTextColor={colors.muted}
            multiline
            maxLength={4000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() && attachments.length === 0) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() && attachments.length === 0}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backBtn: { padding: spacing.sm },
  backText: { fontSize: 22, color: colors.text },
  headerInfo: { flex: 1 },
  headerName: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  headerTyping: { fontSize: fontSize.xs, color: colors.accent, fontStyle: 'italic' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  msgList: { padding: spacing.md, paddingBottom: spacing.sm },
  daySeparator: { alignItems: 'center', marginVertical: spacing.md },
  daySeparatorText: { fontSize: fontSize.xs, color: colors.muted, backgroundColor: colors.surface2, paddingHorizontal: spacing.md, paddingVertical: 2, borderRadius: 10, overflow: 'hidden' },
  msgRow: { marginBottom: spacing.xs, alignItems: 'flex-start' },
  msgRowOwn: { alignItems: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: spacing.md, backgroundColor: colors.surface },
  bubbleOwn: { backgroundColor: colors.accent, borderBottomRightRadius: 4 },
  bubbleOther: { borderBottomLeftRadius: 4 },
  bubbleDeleted: { opacity: 0.5 },
  deletedText: { fontSize: fontSize.sm, fontStyle: 'italic', color: colors.muted },
  msgText: { fontSize: fontSize.md, color: colors.text, lineHeight: 20 },
  msgTextOwn: { color: '#fff' },
  msgMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  msgTime: { fontSize: 10, color: colors.muted },
  msgTimeOwn: { color: 'rgba(255,255,255,0.7)' },
  editedLabel: { fontSize: 10, color: colors.muted, fontStyle: 'italic' },
  statusIcon: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  statusFailed: { fontSize: 12, color: '#dc2626', fontWeight: '700' },
  replyPreview: { borderLeftWidth: 3, borderLeftColor: 'rgba(255,255,255,0.4)', paddingLeft: spacing.sm, marginBottom: spacing.xs },
  replyPreviewText: { fontSize: fontSize.xs, color: colors.muted },
  attachImage: { width: 200, height: 150, borderRadius: radii.sm, marginBottom: spacing.xs },
  fileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, backgroundColor: colors.surface2, borderRadius: radii.sm, marginBottom: spacing.xs },
  fileIcon: { fontSize: 20 },
  fileName: { fontSize: fontSize.sm, color: colors.text },
  fileSize: { fontSize: fontSize.xs, color: colors.muted },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  actionText: { fontSize: fontSize.sm, color: colors.accent, fontWeight: '600' },
  replyBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  replyBarLabel: { fontSize: fontSize.xs, color: colors.accent, fontWeight: '600' },
  replyBarText: { fontSize: fontSize.sm, color: colors.muted },
  replyBarClose: { fontSize: 18, color: colors.muted, padding: spacing.sm },
  attachBar: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.surface },
  attachPreview: { position: 'relative' },
  attachThumb: { width: 56, height: 56, borderRadius: radii.sm },
  attachFileName: { fontSize: fontSize.xs, color: colors.text, maxWidth: 60 },
  attachRemove: { position: 'absolute', top: -4, right: -4, backgroundColor: '#dc2626', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  attachRemoveText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm },
  attachBtn: { paddingBottom: spacing.sm },
  input: { flex: 1, backgroundColor: colors.bg, borderRadius: 20, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, fontSize: fontSize.md, color: colors.text, maxHeight: 100 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
})
