import { useEffect, useMemo, useRef, useState } from 'react'
import { setSocketAuthToken, socket } from './lib/socket'
import { useAuthStore } from './store/auth.store'

type ConversationStub = {
	id: string
	name: string
}

type SocketAck<T> =
	| { ok: true; data: T }
	| { ok: false; error: string }

type ReceiveMessagePayload = {
	_id: string
	conversationId: string
	content: string
	senderId: {
		_id: string
		fullName?: string
		avatar?: string | null
	}
	createdAt: string
	updatedAt: string
	type: 'text' | 'image' | 'file'
}

type ChatMessage = {
	id: string
	content: string
	isMe: boolean
	createdAt: string
}

const conversations: ConversationStub[] = [
	{ id: '64b7c9d1e8f4a2c3b5d6e7f1', name: 'Alice' },
	{ id: '64b7c9d1e8f4a2c3b5d6e7f2', name: 'Bob' },
	{ id: '64b7c9d1e8f4a2c3b5d6e7f3', name: 'Claire' },
	{ id: '64b7c9d1e8f4a2c3b5d6e7f4', name: 'Direck' },
]

const TEST_JWT_SECRET = 'chatweb'
const TEST_USER = {
	_id: '64b7c9d1e8f4a2c3b5d6e7aa',
	fullName: 'Dummy Tester',
	email: 'dummy@example.com',
	avatar: null,
}

const base64UrlEncode = (input: Uint8Array) => {
	let binary = ''
	for (const byte of input) {
		binary += String.fromCharCode(byte)
	}
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

const encodeJson = (value: unknown) => base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)))

const createTestJwt = async (payload: Record<string, unknown>, secret: string) => {
	const header = { alg: 'HS256', typ: 'JWT' }
	const unsignedToken = `${encodeJson(header)}.${encodeJson(payload)}`
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	)
	const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(unsignedToken))
	return `${unsignedToken}.${base64UrlEncode(new Uint8Array(signature))}`
}

const emitAck = <T,>(event: string, payload: unknown) =>
	new Promise<SocketAck<T>>((resolve) => {
		socket.emit(event, payload, (response: SocketAck<T>) => resolve(response))
	})

export default function App() {
	const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
	const [messageInput, setMessageInput] = useState('')
	const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatMessage[]>>({})
	const [typingByConversation, setTypingByConversation] = useState<Record<string, string[]>>({})
	const [status, setStatus] = useState('')
	const [bootstrapped, setBootstrapped] = useState(false)
	const token = useAuthStore((state) => state.token)
	const currentUserId = useAuthStore((state) => state.user?._id ?? '')

	const selectedConversation = useMemo(
		() => conversations.find((c) => c.id === selectedConversationId) ?? null,
		[selectedConversationId],
	)

	const bottomRef = useRef<HTMLDivElement | null>(null)
	const selectedConversationIdRef = useRef<string | null>(selectedConversationId)
	const isTypingRef = useRef(false)
	const typingRoomRef = useRef<string | null>(null)

	useEffect(() => {
		selectedConversationIdRef.current = selectedConversationId
		setMessageInput('')
		isTypingRef.current = false
		typingRoomRef.current = null
	}, [selectedConversationId])

	useEffect(() => {
		let cancelled = false

		const bootstrapDummyUser = async () => {
			const dummyToken = await createTestJwt(
				{
					userId: TEST_USER._id,
					email: TEST_USER.email,
					fullName: TEST_USER.fullName,
					avatar: TEST_USER.avatar,
				},
				TEST_JWT_SECRET,
			)

			if (cancelled) return

			useAuthStore.getState().setUser(TEST_USER)
			useAuthStore.getState().setToken(dummyToken)
			setSocketAuthToken(dummyToken)
			setBootstrapped(true)
		}

		void bootstrapDummyUser()

		return () => {
			cancelled = true
		}
	}, [])

	useEffect(() => {
		setSocketAuthToken(token)

		const onConnect = () => setStatus('Socket: connected')
		const onDisconnect = () => setStatus('Socket: disconnected')
		const onConnectError = (error: Error) => setStatus(`Socket: ${error.message}`)

		const onReceiveMessage = (payload: ReceiveMessagePayload) => {
			if (!payload?.conversationId) return
			setMessagesByConversation((prev) => {
				const next = { ...prev }
				const list = next[payload.conversationId] ?? []
				if (list.some((m) => m.id === payload._id)) return prev
				const senderId = payload.senderId?._id ?? ''
				next[payload.conversationId] = [
					...list,
					{
						id: payload._id,
						content: payload.content,
						createdAt: payload.createdAt,
						isMe: senderId === currentUserId,
					},
				]
				return next
			})
		}

		type TypingPayload = { roomId: string; fromSocketId: string }
		const onTyping = (payload: TypingPayload) => {
			const roomId = payload?.roomId
			if (!roomId || !payload?.fromSocketId) return
			if (payload.fromSocketId === socket.id) return
			setTypingByConversation((prev) => {
				const existing = prev[roomId] ?? []
				if (existing.includes(payload.fromSocketId)) return prev
				return { ...prev, [roomId]: [...existing, payload.fromSocketId] }
			})
		}

		const onStopTyping = (payload: TypingPayload) => {
			const roomId = payload?.roomId
			if (!roomId || !payload?.fromSocketId) return
			setTypingByConversation((prev) => {
				const existing = prev[roomId] ?? []
				const nextList = existing.filter((id) => id !== payload.fromSocketId)
				if (nextList.length === existing.length) return prev
				return { ...prev, [roomId]: nextList }
			})
		}

		socket.on('connect', onConnect)
		socket.on('disconnect', onDisconnect)
		socket.on('connect_error', onConnectError)
		socket.on('receive_message', onReceiveMessage)
		socket.on('typing', onTyping)
		socket.on('stop_typing', onStopTyping)

		return () => {
			socket.off('connect', onConnect)
			socket.off('disconnect', onDisconnect)
			socket.off('connect_error', onConnectError)
			socket.off('receive_message', onReceiveMessage)
			socket.off('typing', onTyping)
			socket.off('stop_typing', onStopTyping)
		}
	}, [currentUserId, token])

	useEffect(() => {
		if (!selectedConversationId) return
		const id = requestAnimationFrame(() => {
			bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
		})
		return () => cancelAnimationFrame(id)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedConversationId, messagesByConversation[selectedConversationId ?? '']?.length])

	useEffect(() => {
		return () => {
			const roomId = typingRoomRef.current
			if (roomId && isTypingRef.current && socket.connected) {
				socket.emit('stop_typing', { roomId })
			}
		}
	}, [])

	const joinConversation = async (conversationId: string) => {
		if (!bootstrapped) {
			setStatus('Đang tạo dummy user...')
			return
		}
		setSocketAuthToken(token)
		if (!socket.connected) socket.connect()

		const previousId = selectedConversationIdRef.current
		if (previousId && previousId !== conversationId) {
			await emitAck<{ roomId: string }>('leave_room', { roomId: previousId })
		}

		const res = await emitAck<{ roomId: string }>('join_room', { roomId: conversationId })
		if (!res.ok) {
			setStatus(`join_room lỗi: ${res.error}`)
			return
		}

		setSelectedConversationId(conversationId)
		setStatus('')
	}

	const sendMessage = async () => {
		const conversationId = selectedConversationId
		const content = messageInput.trim()
		if (!conversationId || !content) return
		if (!bootstrapped) {
			setStatus('Đang tạo dummy user...')
			return
		}
		setSocketAuthToken(token)
		if (!socket.connected) socket.connect()

		if (isTypingRef.current) {
			socket.emit('stop_typing', { roomId: conversationId })
			isTypingRef.current = false
			typingRoomRef.current = null
		}

		setMessageInput('')
		const res = await emitAck<{ message: ReceiveMessagePayload }>('send_message', {
			conversationId,
			content,
		})
		if (!res.ok) setStatus(`send_message lỗi: ${res.error}`)
	}

	const selectedMessages = selectedConversationId
		? messagesByConversation[selectedConversationId] ?? []
		: []

	const typingCount = selectedConversationId
		? (typingByConversation[selectedConversationId] ?? []).length
		: 0

	return (
		<div style={{ height: '100vh', display: 'flex', fontFamily: 'system-ui, sans-serif' }}>
			<div
				style={{
					width: 260,
					borderRight: '1px solid #e5e5e5',
					overflowY: 'auto',
				}}
			>
				<div style={{ padding: 12, borderBottom: '1px solid #e5e5e5' }}>
					<div style={{ fontWeight: 600 }}>Conversations</div>
					{status ? (
						<div style={{ marginTop: 6, fontSize: 12, color: '#666' }}>{status}</div>
					) : null}
				</div>

				{conversations.map((c) => {
					const active = c.id === selectedConversationId
					return (
						<button
							key={c.id}
							type="button"
							onClick={() => joinConversation(c.id)}
							style={{
								width: '100%',
								textAlign: 'left',
								padding: '10px 12px',
								border: 'none',
								borderBottom: '1px solid #f0f0f0',
								background: active ? '#f6f6f6' : 'transparent',
								cursor: 'pointer',
							}}
						>
							<div style={{ fontWeight: 600 }}>{c.name}</div>
							<div style={{ fontSize: 12, color: '#777' }}>Conversation #{c.id}</div>
						</button>
					)
				})}
			</div>

			<div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
				<div style={{ padding: 12, borderBottom: '1px solid #e5e5e5' }}>
					<div style={{ fontWeight: 700 }}>
						{selectedConversation ? selectedConversation.name : 'Chọn một cuộc trò chuyện'}
					</div>
						<div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
							{bootstrapped ? `Dummy user: ${TEST_USER.fullName}` : 'Đang khởi tạo dummy user...'}
						</div>
				</div>

				<div
					style={{
						flex: 1,
						overflowY: 'auto',
						padding: 12,
						background: '#fff',
					}}
				>
					{selectedConversationId ? (
						selectedMessages.length === 0 ? (
							<div style={{ color: '#777' }}>Chưa có tin nhắn.</div>
						) : (
							selectedMessages.map((m) => (
								<div
									key={m.id}
									style={{
										marginBottom: 10,
										textAlign: m.isMe ? 'right' : 'left',
									}}
								>
									<div
										style={{
											display: 'inline-block',
											padding: '8px 10px',
											border: '1px solid #e6e6e6',
											borderRadius: 10,
											background: m.isMe ? '#f6f6f6' : '#fff',
											maxWidth: 520, 
										}}
									>
										{m.content}
									</div>
								</div>
							))
						)
					) : (
						<div style={{ color: '#777' }}>Chọn conversation bên trái để chat.</div>
					)}

					<div ref={bottomRef} />
				</div>

				<div style={{ padding: 12, borderTop: '1px solid #e5e5e5' }}>
					<div style={{ minHeight: 18, fontSize: 12, color: '#666', marginBottom: 8 }}>
						{typingCount > 0 && selectedConversationId ? 'Đang gõ...' : ''}
					</div>

					<div style={{ display: 'flex', gap: 8 }}>
						<input
							disabled={!selectedConversationId}
							value={messageInput}
							onChange={(e) => {
								const nextValue = e.target.value
								setMessageInput(nextValue)
								if (!selectedConversationId) return
								if (!socket.connected) socket.connect()

								const hasText = nextValue.trim().length > 0
								if (hasText && !isTypingRef.current) {
									socket.emit('typing', { roomId: selectedConversationId })
									isTypingRef.current = true
									typingRoomRef.current = selectedConversationId
									return
								}
								if (!hasText && isTypingRef.current) {
									socket.emit('stop_typing', { roomId: selectedConversationId })
									isTypingRef.current = false
									typingRoomRef.current = null
								}
							}}
							onKeyDown={(e) => {
								if (e.key === 'Enter') sendMessage()
							}}
							placeholder={selectedConversationId ? 'Nhập tin nhắn...' : 'Chọn conversation để chat'}
							style={{
								flex: 1,
								padding: 10,
								border: '1px solid #ddd',
								borderRadius: 8,
							}}
						/>
						<button
							disabled={!selectedConversationId || !messageInput.trim()}
							type="button"
							onClick={sendMessage}
							style={{
								padding: '10px 14px',
								border: '1px solid #ddd',
								borderRadius: 8,
								background: '#fff',
								cursor: 'pointer',
							}}
						>
							Send
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

