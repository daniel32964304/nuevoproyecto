<script lang="ts">
	import LandingScreen from '$lib/components/LandingScreen.svelte';
	import ChatScreen from '$lib/components/ChatScreen.svelte';
	import { buildResponse, escapeHtml, initialBotMessage, type Message } from '$lib/chat';

	let started = $state(false);
	let messages = $state<Message[]>([initialBotMessage]);

	function startApp() {
		started = true;
	}

	function sendMessage(text: string) {
		const trimmed = text.trim();
		if (trimmed === '') return;

		messages = [...messages, { id: messages.length, role: 'user', html: escapeHtml(trimmed) }];

		const request = trimmed;
		setTimeout(() => {
			messages = [...messages, { id: messages.length, role: 'bot', html: buildResponse(request) }];
		}, 600);
	}
</script>

<svelte:head>
	<title>Tron - Generador Inteligente de Algoritmos</title>
	<meta name="description" content="Tron - Generador Inteligente de Algoritmos" />
</svelte:head>

{#if !started}
	<LandingScreen onStart={startApp} />
{:else}
	<ChatScreen {messages} onSend={sendMessage} />
{/if}