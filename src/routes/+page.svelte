<script lang="ts">
	import LandingScreen from '$lib/components/LandingScreen.svelte';
	import ChatScreen from '$lib/components/ChatScreen.svelte';
	import { buildResponse, escapeHtml, initialBotMessage, type Message } from '$lib/chat';

	type ConversationTurn = {
		role: 'user' | 'assistant';
		content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
	};

	type SessionMemory = {
		name?: string;
		language?: string;
		project?: string;
		goal?: string;
		preferences: string[];
		notes: string[];
	};

	let started = $state(false);
	let messages = $state<Message[]>([initialBotMessage]);
	let conversationHistory = $state<ConversationTurn[]>([]);
	let sessionMemory = $state<SessionMemory>({ preferences: [], notes: [] });

	function startApp() {
		started = true;
	}

	function textFromContent(content: ConversationTurn['content']): string {
		return typeof content === 'string' ? content : content.find((part) => part.type === 'text')?.text ?? 'Analiza la imagen adjunta.';
	}

	function previewFromJson(text: string): string {
		const match = text.match(/"answer"\s*:\s*"((?:\\.|[^"\\])*)/);
		if (!match) return 'Estoy revisando tu solicitud...';
		try { return JSON.parse(`"${match[1]}"`); } catch { return match[1].replace(/\\n/g, ' '); }
	}

	function memorySummary(): string {
		const facts = [
			sessionMemory.name && `Nombre: ${sessionMemory.name}`,
			sessionMemory.language && `Lenguaje preferido: ${sessionMemory.language}`,
			sessionMemory.project && `Proyecto: ${sessionMemory.project}`,
			sessionMemory.goal && `Objetivo: ${sessionMemory.goal}`,
			 sessionMemory.preferences.length && `Preferencias: ${sessionMemory.preferences.join(', ')}`,
			 sessionMemory.notes.length && `Notas: ${sessionMemory.notes.join(' | ')}`
		].filter(Boolean);
		return facts.length ? `Memoria de esta sesión:\n${facts.join('\n')}` : 'No hay datos personales guardados todavía.';
	}

	function updateMemory(text: string) {
		const normalized = text.toLowerCase();
		const name = text.match(/(?:me llamo|mi nombre es|soy)\s+([A-Za-zÁÉÍÓÚáéíóúÑñ][\wÁÉÍÓÚáéíóúÑñ-]{1,30})/i)?.[1];
		if (name) sessionMemory = { ...sessionMemory, name };
		const language = text.match(/(?:prefiero|trabajo con|programo en|usa|usar)\s+(javascript|typescript|python|java|c\+\+)/i)?.[1];
		if (language) sessionMemory = { ...sessionMemory, language };
		const project = text.match(/(?:mi proyecto es|estoy haciendo|estoy trabajando en)\s+(.{3,100})/i)?.[1]?.replace(/[.!?]+$/, '');
		if (project) sessionMemory = { ...sessionMemory, project };
		const goal = text.match(/(?:mi objetivo es|necesito lograr|quiero lograr)\s+(.{3,120})/i)?.[1]?.replace(/[.!?]+$/, '');
		if (goal) sessionMemory = { ...sessionMemory, goal };
		const note = text.match(/(?:recuerda que|recuerda esto|ten presente que|no olvides que)\s+(.{3,160})/i)?.[1]?.replace(/[.!?]+$/, '');
		if (note) sessionMemory = { ...sessionMemory, notes: [...new Set([...sessionMemory.notes, note])] };
		if (normalized.includes('respuestas cortas')) sessionMemory = { ...sessionMemory, preferences: [...new Set([...sessionMemory.preferences, 'respuestas cortas'])] };
		if (normalized.includes('explicaciones detalladas')) sessionMemory = { ...sessionMemory, preferences: [...new Set([...sessionMemory.preferences, 'explicaciones detalladas'])] };
	}

	function memoryCommand(text: string): string | undefined {
		const normalized = text.toLowerCase();
		const newName = text.match(/(?:me llamo|mi nombre es|soy)\s+([A-Za-zÁÉÍÓÚáéíóúÑñ][\wÁÉÍÓÚáéíóúÑñ-]{1,30})/i)?.[1];
		if (newName) {
			return `<strong>Mucho gusto, ${escapeHtml(newName)}.</strong><br>Recordaré tu nombre durante esta sesión y lo usaré de forma natural cuando sea relevante.`;
		}
		if (normalized.includes('recuerda que') || normalized.includes('recuerda esto') || normalized.includes('ten presente que') || normalized.includes('no olvides que')) {
			return '<strong>Entendido, lo tendré presente.</strong><br>Guardé ese dato en la memoria de esta sesión y lo usaré para mantener la conversación coherente.';
		}
		if (normalized.includes('como me llamo') || normalized.includes('cuál es mi nombre') || normalized.includes('cual es mi nombre')) {
			return sessionMemory.name
				? `<strong>Te llamas ${escapeHtml(sessionMemory.name)}.</strong><br>Lo recuerdo dentro de esta sesión y lo usaré solo cuando sea útil para conversar contigo.`
				: '<strong>Aún no me has dicho tu nombre.</strong><br>Puedes escribirme: “Me llamo ...” y lo recordaré durante esta sesión.';
		}
		if (normalized.includes('olvida todo') || normalized.includes('borra tu memoria') || normalized.includes('borrar memoria')) {
			sessionMemory = { preferences: [], notes: [] };
			return '<strong>Hecho.</strong><br>Borré la memoria de esta sesión. Seguimos desde cero, sin eliminar el historial visible del chat.';
		}
		if (normalized.includes('que recuerdas') || normalized.includes('qué recuerdas') || normalized.includes('mi informacion')) {
			return `<strong>Esto es lo que recuerdo por ahora:</strong><br>${escapeHtml(memorySummary()).replace(/\n/g, '<br>')}<br><br>Puedes decirme “olvida mi nombre” o “actualiza mi proyecto” en cualquier momento.`;
		}
		if (normalized.includes('olvida mi nombre')) {
			sessionMemory = { ...sessionMemory, name: undefined };
			return '<strong>Entendido.</strong><br>Olvidé tu nombre y no lo usaré en las siguientes respuestas.';
		}
		if (normalized.includes('actualiza mi proyecto') || normalized.includes('cambia mi proyecto')) {
			return '<strong>Claro.</strong><br>Dime cuál es el nuevo nombre o descripción de tu proyecto y lo actualizaré en la memoria de esta sesión.';
		}
		return undefined;
	}

	async function sendMessage(text: string, image?: { name: string; dataUrl: string }) {
		const trimmed = text.trim();
		if (trimmed === '' && !image) return;
		if (!image) updateMemory(trimmed);
		const commandAnswer = !image && memoryCommand(trimmed);
		if (commandAnswer) {
			messages = [...messages, { id: messages.length, role: 'user', html: escapeHtml(trimmed) }, { id: messages.length + 1, role: 'bot', html: commandAnswer }];
			conversationHistory = [...conversationHistory, { role: 'user', content: trimmed }, { role: 'assistant', content: commandAnswer }];
			return;
		}

		messages = [...messages, { id: messages.length, role: 'user', html: escapeHtml(trimmed) }];
		const userContent = image
			? [{ type: 'text' as const, text: trimmed }, { type: 'image_url' as const, image_url: { url: image.dataUrl } }]
			: trimmed;
		conversationHistory = [...conversationHistory, { role: 'user', content: userContent }];

		const context = conversationHistory.filter((turn) => turn.role === 'user').map((turn) => textFromContent(turn.content));
		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: conversationHistory.slice(-30),
					history: context,
					memory: memorySummary(),
					stream: true
				})
			});
			if (!response.ok) throw new Error('Respuesta inválida');
			if (!response.body || !response.headers.get('content-type')?.includes('text/event-stream')) {
				const data = await response.json();
				if (typeof data.html !== 'string') throw new Error('Respuesta inválida');
				messages = [...messages, { id: messages.length, role: 'bot', html: data.html }];
				conversationHistory = [...conversationHistory, { role: 'assistant', content: data.html }];
				return;
			}
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';
			let streamedJson = '';
			let finalHtml = '';
			messages = [...messages, { id: messages.length, role: 'bot', html: '<em>Tron está analizando tu solicitud...</em>' }];
			while (true) {
				const { done, value } = await reader.read();
				buffer += decoder.decode(value, { stream: !done });
				const events = buffer.split('\n\n');
				buffer = events.pop() ?? '';
				for (const event of events) {
					const line = event.split('\n').find((item) => item.startsWith('data:'));
					if (!line) continue;
					const payload = JSON.parse(line.slice(5).trim());
					if (payload.type === 'delta') {
						streamedJson += payload.text;
						messages = [...messages.slice(0, -1), { id: messages.length - 1, role: 'bot', html: `<em>${escapeHtml(previewFromJson(streamedJson))}</em>` }];
					}
					if (payload.type === 'final') finalHtml = payload.html;
					if (payload.type === 'error') throw new Error('El proveedor no respondió');
				}
				if (done) break;
			}
			if (!finalHtml) throw new Error('Respuesta incompleta');
			messages = [...messages.slice(0, -1), { id: messages.length - 1, role: 'bot', html: finalHtml }];
			conversationHistory = [...conversationHistory, { role: 'assistant', content: finalHtml }];
		} catch {
			const fallback = buildResponse(textFromContent(userContent), context);
			messages = [...messages, { id: messages.length, role: 'bot', html: fallback }];
			conversationHistory = [...conversationHistory, { role: 'assistant', content: fallback }];
		}
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