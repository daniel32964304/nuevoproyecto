<script lang="ts">
	import ChatMessage from '$lib/components/ChatMessage.svelte';
	import type { Message } from '$lib/chat';

	interface Props {
		messages: Message[];
		onSend: (text: string) => void;
	}

	let { messages, onSend }: Props = $props();

	let userInput = $state('');
	let inputEl = $state<HTMLInputElement | undefined>(undefined);
	let chatWindowEl = $state<HTMLDivElement | undefined>(undefined);

	$effect(() => {
		inputEl?.focus();
	});

	$effect(() => {
		messages;
		chatWindowEl?.scrollTo({ top: chatWindowEl.scrollHeight });
	});

	function send() {
		const text = userInput;
		if (text.trim() === '') return;
		userInput = '';
		onSend(text);
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			send();
		}
	}
</script>

<div id="chat-screen">
	<div class="chat-header">
		Tron Assistant - Generador de Algoritmos
		<span>Estado: En Línea</span>
	</div>
	<div id="chat-window" bind:this={chatWindowEl}>
{#each messages as m}
				<ChatMessage message={m} />
			{/each}
	</div>
	<div class="input-area">
		<input
			type="text"
			id="user-input"
			bind:this={inputEl}
			bind:value={userInput}
			placeholder="Escriba su requerimiento aquí..."
			onkeydown={handleKeyPress}
		/>
		<button class="btn-send" onclick={send}>Enviar</button>
	</div>
</div>

<style>
	#chat-screen {
		display: flex;
		flex-direction: column;
		width: 850px;
		height: 85vh;
		background: var(--card-bg);
		border-radius: 16px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
		border: 1px solid var(--border-color);
		overflow: hidden;
	}

	.chat-header {
		background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan));
		color: white;
		padding: 20px;
		font-size: 1.1rem;
		font-weight: 600;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.chat-header span {
		font-size: 0.85rem;
		opacity: 0.9;
		background: rgba(255, 255, 255, 0.2);
		padding: 4px 10px;
		border-radius: 20px;
	}

	#chat-window {
		flex: 1;
		overflow-y: auto;
		padding: 25px;
		display: flex;
		flex-direction: column;
		gap: 20px;
		background: #fafafa;
	}

	.input-area {
		display: flex;
		padding: 20px;
		background: white;
		border-top: 1px solid var(--border-color);
		gap: 12px;
	}

	input[type='text'] {
		flex: 1;
		padding: 14px 18px;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		outline: none;
		font-size: 0.95rem;
		transition: border-color 0.2s;
	}

	input[type='text']:focus {
		border-color: var(--accent-blue);
	}

	.btn-send {
		background: var(--accent-blue);
		color: white;
		border: none;
		padding: 0 24px;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-send:hover {
		background: #1d4ed8;
	}
</style>