<script lang="ts">
	import ChatMessage from '$lib/components/ChatMessage.svelte';
	import type { Message } from '$lib/chat';

	interface Props {
		messages: Message[];
		onSend: (text: string, image?: { name: string; dataUrl: string }) => void | Promise<void>;
	}

	let { messages, onSend }: Props = $props();

	let userInput = $state('');
	let selectedImage = $state<{ name: string; dataUrl: string } | undefined>(undefined);
	let inputEl = $state<HTMLTextAreaElement | undefined>(undefined);
	let fileInputEl = $state<HTMLInputElement | undefined>(undefined);
	let chatWindowEl = $state<HTMLDivElement | undefined>(undefined);
	let isSending = $state(false);
	const quickPrompts = ['Quiero crear un sistema', 'Explícame una idea', 'Revisa mi proyecto'];

	$effect(() => {
		inputEl?.focus();
	});

	$effect(() => {
		messages;
		chatWindowEl?.scrollTo({ top: chatWindowEl.scrollHeight });
	});

	async function send(textOverride?: string) {
		const text = userInput;
		const messageText = textOverride ?? text;
		if (isSending || (messageText.trim() === '' && !selectedImage)) return;
		userInput = '';
		const image = selectedImage;
		selectedImage = undefined;
		isSending = true;
		try {
			await onSend(messageText || 'Analiza la imagen adjunta y explícame qué observas.', image);
		} finally {
			isSending = false;
			inputEl?.focus();
		}
	}

	function selectImage(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		if (!file || !file.type.startsWith('image/')) return;
		const reader = new FileReader();
		reader.onload = () => { selectedImage = { name: file.name, dataUrl: String(reader.result) }; };
		reader.readAsDataURL(file);
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			send();
		}
	}
</script>

<div id="chat-screen">
	<div class="chat-header">
		<div class="brand-lockup">
			<div class="brand-mark">T</div>
			<div>
				<strong>Tron</strong>
				<small>Arquitectura y lógica inteligente</small>
			</div>
		</div>
		<span class="online-status" class:thinking={isSending} aria-live="polite"><i></i> {isSending ? 'Pensando...' : 'En línea'}</span>
	</div>
	<div id="chat-window" bind:this={chatWindowEl} aria-busy={isSending}>
		<div class="conversation-column">
			{#each messages as m}
				<ChatMessage message={m} />
			{/each}
			{#if messages.length === 1 && !isSending}
				<div class="quick-prompts" aria-label="Sugerencias de inicio">
					{#each quickPrompts as prompt}
						<button type="button" onclick={() => send(prompt)}>{prompt}</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
	<div class="input-area">
		<div class="composer">
			<input bind:this={fileInputEl} class="file-input" type="file" accept="image/*" onchange={selectImage} />
			<button class="attach-btn" aria-label="Adjuntar imagen" title="Adjuntar imagen" disabled={isSending} onclick={() => fileInputEl?.click()}>＋</button>
			<textarea
			id="user-input"
			bind:this={inputEl}
			bind:value={userInput}
			placeholder="Escribe una pregunta o describe lo que quieres construir..."
			rows="1"
			onkeydown={handleKeyPress}
			></textarea>
			<button class="btn-send" aria-label="Enviar mensaje" disabled={isSending} onclick={() => send()}>
				<span>{isSending ? 'Pensando' : 'Enviar'}</span><b>{isSending ? '…' : '↑'}</b>
			</button>
		</div>
		{#if selectedImage}<div class="attachment-preview">Imagen lista: {selectedImage.name} <button aria-label="Quitar imagen" onclick={() => (selectedImage = undefined)}>×</button></div>{/if}
		<div class="composer-hint">Tron puede explicar, generar y refinar algoritmos paso a paso.</div>
	</div>
</div>

<style>
	#chat-screen {
		display: flex;
		flex-direction: column;
		width: min(1120px, 100vw);
		height: min(94vh, 920px);
		background: var(--card-bg);
		border-radius: 12px;
		box-shadow: 0 18px 45px rgba(11, 31, 58, 0.1);
		border: 1px solid var(--border-color);
		overflow: hidden;
	}

	.chat-header {
		background: #ffffff;
		color: var(--text-main);
		padding: 16px 26px;
		min-height: 58px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid var(--border-color);
	}

	.brand-lockup, .brand-lockup > div:last-child {
		display: flex;
		align-items: center;
	}

	.brand-lockup { gap: 11px; }
	.brand-mark {
		width: 34px;
		height: 34px;
		display: grid;
		place-items: center;
		border-radius: 8px;
		color: white;
		font-weight: 800;
		background: var(--accent-blue);
		box-shadow: 0 5px 12px rgba(11, 31, 58, 0.18);
	}

	.brand-lockup strong { font-size: 1rem; line-height: 1.1; }
	.brand-lockup small { display: block; color: var(--text-muted); font-size: 0.72rem; margin-top: 3px; }
	.online-status { color: var(--accent-blue); font-size: 0.78rem; font-weight: 600; transition: color 0.2s; }
	.online-status.thinking { color: #b26a00; }
	.online-status i { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #2f80ed; margin-right: 6px; }

	#chat-window {
		flex: 1;
		overflow-y: auto;
		background: #ffffff;
		padding: 34px 26px 44px;
	}

	.conversation-column {
		width: min(780px, 100%);
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 32px;
	}

	.quick-prompts { display: flex; flex-wrap: wrap; gap: 8px; margin-left: 42px; }
	.quick-prompts button {
		border: 1px solid #d6e0ec;
		background: #f8fbff;
		color: var(--accent-blue);
		border-radius: 18px;
		padding: 8px 12px;
		font: inherit;
		font-size: 0.78rem;
		cursor: pointer;
		transition: background 0.2s, border-color 0.2s, transform 0.2s;
	}
	.quick-prompts button:hover { background: #eef5fc; border-color: var(--accent-blue); transform: translateY(-1px); }

	.input-area {
		padding: 15px 24px 17px;
		background: #ffffff;
		border-top: 1px solid var(--border-color);
	}

	.composer { width: min(780px, 100%); margin: 0 auto; display: flex; gap: 10px; align-items: flex-end; }
	.file-input { display: none; }
	.attach-btn { width: 38px; height: 38px; border: 1px solid var(--border-color); background: #fff; color: var(--accent-blue); border-radius: 8px; cursor: pointer; font-size: 1.25rem; }
	.attach-btn:disabled, .btn-send:disabled { opacity: 0.65; cursor: wait; }
	.attachment-preview { width: min(780px, 100%); margin: 7px auto 0; font-size: 0.75rem; color: var(--text-muted); }
	.attachment-preview button { border: 0; background: transparent; color: var(--text-muted); cursor: pointer; font-size: 1rem; }
	textarea {
		flex: 1;
		resize: none;
		min-height: 22px;
		max-height: 130px;
		padding: 13px 15px;
		border: 1px solid #bcc9da;
		border-radius: 9px;
		outline: none;
		font: inherit;
		font-size: 0.92rem;
		line-height: 1.4;
		color: var(--text-main);
		background: #fff;
		box-shadow: none;
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	textarea:focus {
		border-color: var(--accent-blue);
		box-shadow: 0 0 0 3px rgba(11, 31, 58, 0.1);
	}

	.btn-send {
		background: var(--accent-blue);
		color: white;
		border: none;
		padding: 0 14px;
		height: 47px;
		border-radius: 9px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
		display: flex;
		gap: 7px;
		align-items: center;
	}
	.btn-send b { font-size: 1.2rem; line-height: 1; }
	.composer-hint { width: min(780px, 100%); margin: 7px auto 0; color: #94a3b8; font-size: 0.7rem; text-align: center; }

	.btn-send:hover {
		background: #173761;
	}

	@media (max-width: 700px) {
		#chat-screen { height: 100vh; border-radius: 0; border: 0; }
		.chat-header { padding: 13px 16px; }
		#chat-window { padding: 22px 15px 34px; }
		.input-area { padding: 12px 14px 14px; }
		.composer-hint { display: none; }
		.quick-prompts { margin-left: 0; }
		.btn-send span { display: none; }
	}
</style>