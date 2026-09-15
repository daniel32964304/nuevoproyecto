import { json } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';
import { buildResponse, escapeHtml } from '$lib/chat';
import type { RequestHandler } from './$types';

type ChatMessage = {
	role: 'user' | 'assistant';
	content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
};

type StructuredAnswer = {
	answer: string;
	algorithm?: string[];
	code?: string;
	language?: string;
	justification?: string;
	complexity?: string;
	example?: string;
	review?: string[];
};

const systemPrompt = `Eres Tron, un asistente especializado exclusivamente en la estructura lógica de software, claro, humano, amable y técnicamente riguroso. Si te preguntan quién te creó, quién es tu creador o quién te desarrolló, responde exactamente: "Mi creador es DANIEL HERNANDEZ."
Tu función es ayudar a convertir ideas de software en requisitos, arquitectura, módulos, datos, algoritmos, código, validaciones, seguridad y pruebas. Puedes saludar y conversar brevemente, pero no desarrolles respuestas ajenas al software: redirige esos temas de manera amable hacia el proyecto o la lógica que el usuario quiere construir. Mantén el contexto completo de la conversación. Distingue entre crear, explicar, corregir, optimizar, comparar y probar software.
Trabaja como un agente en cuatro fases internas: (1) interpreta la intención real y extrae entidades, usuarios, acciones y restricciones; (2) comprueba qué requisitos faltan y pregunta solo lo imprescindible; (3) diseña un plan y una solución; (4) revisa seguridad, errores, consistencia y mantenibilidad antes de responder. No muestres razonamiento privado; muestra solo conclusiones, pasos útiles y decisiones resumidas.
Responde cualquier pregunta relacionada con el texto, imagen o contexto que el usuario envíe. Organiza siempre la respuesta en este orden: respuesta directa, interpretación de lo recibido, detalles o pasos relevantes, límites o supuestos y siguiente acción útil. Responde primero a la pregunta concreta y después añade contexto útil. Si el usuario describe una idea incompleta, no generes una solución genérica: resume lo que entendiste y formula de 2 a 5 preguntas concretas para completar requisitos. Si faltan datos importantes, pregunta antes de inventar. Distingue hechos, supuestos y recomendaciones. Si no tienes información suficiente o actualizada, dilo con honestidad y pide el dato que falta. Cuando el usuario pide una solución confirmada, responde con una explicación humana y completa, algoritmo en lenguaje natural o pseudocódigo, código ejecutable, justificación, complejidad, ejemplo y revisión técnica. No conviertas una pregunta casual en una plantilla técnica ni fuerces siempre las secciones de algoritmo y código.
Si recibe una imagen, descríbela con cuidado y úsala como contexto para diagnosticar código, errores, diagramas o interfaces. Si no puedes leer algo, dilo claramente.
No afirmes que ejecutaste código si no lo ejecutaste. No expongas claves, secretos ni contraseñas reales.
Responde exclusivamente con JSON válido, sin markdown exterior, usando este formato:
{"answer":"respuesta humana","algorithm":["paso"],"code":"codigo","language":"JavaScript","justification":"motivo","complexity":"O(...)","example":"entrada y salida","review":["verificación"]}`;

function promptWithMemory(memory?: string): string {
	return memory
		? `${systemPrompt}\n\n${memory}\nUsa estos datos solo cuando sean relevantes. Si el usuario los corrige, prioriza la información más reciente. No repitas toda la memoria en cada respuesta.`
		: systemPrompt;
}

function env(name: string): string | undefined {
	return privateEnv[name]?.trim() || undefined;
}

function htmlAnswer(result: StructuredAnswer): string {
	const sections = [`<strong>[TRON AI]</strong><br>${escapeHtml(result.answer || 'Estoy listo para ayudarte.')}`];
	if (result.algorithm?.length) {
		sections.push(`<strong>Algoritmo:</strong><br>${result.algorithm.map((step, index) => `• Paso ${index + 1}: ${escapeHtml(step)}`).join('<br>')}`);
	}
	if (result.code) {
		const code = escapeHtml(result.code).replace(/\n/g, '<br>').replace(/  /g, '&nbsp;&nbsp;');
		sections.push(`<strong>Código${result.language ? ` (${escapeHtml(result.language)})` : ''}:</strong><div class="code-container">${code}</div>`);
	}
	if (result.justification) sections.push(`<strong>Justificación:</strong><br>${escapeHtml(result.justification)}`);
	if (result.complexity) sections.push(`<strong>Complejidad:</strong><br>${escapeHtml(result.complexity)}`);
	if (result.example) sections.push(`<strong>Ejemplo:</strong><br>${escapeHtml(result.example)}`);
	if (result.review?.length) sections.push(`<strong>Revisión de Tron:</strong><br>${result.review.map((item) => `• ${escapeHtml(item)}`).join('<br>')}`);
	return sections.join('<br><br>');
}

function parseModelAnswer(content: string): StructuredAnswer {
	const clean = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
	try {
		return JSON.parse(clean) as StructuredAnswer;
	} catch {
		return { answer: content };
	}
}

async function askOpenAI(messages: ChatMessage[], memory?: string): Promise<StructuredAnswer> {
	const response = await fetch(env('OPENAI_BASE_URL') ?? 'https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: { Authorization: `Bearer ${env('OPENAI_API_KEY')}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			model: env('OPENAI_MODEL') ?? 'gpt-4o-mini',
			messages: [{ role: 'system', content: promptWithMemory(memory) }, ...messages.map((message) => ({ role: message.role, content: message.content }))],
			temperature: 0.35,
			response_format: { type: 'json_object' }
		})
	});
	if (!response.ok) throw new Error(`OpenAI respondió ${response.status}`);
	const data = await response.json();
	return parseModelAnswer(data.choices?.[0]?.message?.content ?? 'No recibí una respuesta válida.');
}

function sseEvent(controller: ReadableStreamDefaultController<Uint8Array>, encoder: TextEncoder, event: unknown) {
	controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
}

async function readStream(response: Response, onText: (text: string) => void): Promise<string> {
	if (!response.body) throw new Error('El proveedor no devolvió un flujo');
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	let full = '';
	while (true) {
		const { done, value } = await reader.read();
		buffer += decoder.decode(value, { stream: !done });
		const lines = buffer.split('\n');
		buffer = lines.pop() ?? '';
		for (const line of lines) {
			if (!line.startsWith('data:')) continue;
			const payload = line.slice(5).trim();
			if (!payload || payload === '[DONE]') continue;
			try {
				const parsed = JSON.parse(payload);
				const text = parsed.choices?.[0]?.delta?.content ?? parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
				if (text) { full += text; onText(text); }
			} catch { /* El siguiente fragmento completará el JSON del evento. */ }
		}
		if (done) break;
	}
	return full;
}

async function streamOpenAI(messages: ChatMessage[], onText: (text: string) => void, memory?: string): Promise<string> {
	const response = await fetch(env('OPENAI_BASE_URL') ?? 'https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: { Authorization: `Bearer ${env('OPENAI_API_KEY')}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			model: env('OPENAI_MODEL') ?? 'gpt-4o-mini',
			messages: [{ role: 'system', content: promptWithMemory(memory) }, ...messages],
			temperature: 0.35,
			stream: true
		})
	});
	if (!response.ok) throw new Error(`OpenAI respondió ${response.status}`);
	return readStream(response, onText);
}

async function streamGemini(messages: ChatMessage[], onText: (text: string) => void, memory?: string): Promise<string> {
	const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${env('GEMINI_MODEL') ?? 'gemini-2.0-flash'}:streamGenerateContent?alt=sse&key=${env('GEMINI_API_KEY')}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			systemInstruction: { parts: [{ text: promptWithMemory(memory) }] },
			contents: messages.map((message) => ({ role: message.role === 'assistant' ? 'model' : 'user', parts: typeof message.content === 'string' ? [{ text: message.content }] : message.content.map((part) => part.type === 'text' ? { text: part.text } : { inline_data: { mime_type: 'image/png', data: part.image_url?.url.split(',')[1] } }) })),
			generationConfig: { temperature: 0.35 }
		})
	});
	if (!response.ok) throw new Error(`Gemini respondió ${response.status}`);
	return readStream(response, onText);
}

function streamResponse(messages: ChatMessage[], provider: string, memory?: string): Response {
	const encoder = new TextEncoder();
	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			void (async () => {
				try {
					sseEvent(controller, encoder, { type: 'status', text: 'Tron está analizando tu intención y el contexto...' });
					let streamed = '';
					const onText = (text: string) => { streamed += text; sseEvent(controller, encoder, { type: 'delta', text }); };
					const content = provider === 'gemini' ? await streamGemini(messages, onText, memory) : await streamOpenAI(messages, onText, memory);
					sseEvent(controller, encoder, { type: 'final', html: htmlAnswer(parseModelAnswer(content || streamed)) });
				} catch {
					sseEvent(controller, encoder, { type: 'error' });
				}
				controller.close();
			})();
		}
	});
	return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } });
}

async function askGemini(messages: ChatMessage[], memory?: string): Promise<StructuredAnswer> {
	const key = env('GEMINI_API_KEY');
	const model = env('GEMINI_MODEL') ?? 'gemini-2.0-flash';
	const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			systemInstruction: { parts: [{ text: promptWithMemory(memory) }] },
			contents: messages.map((message) => ({ role: message.role === 'assistant' ? 'model' : 'user', parts: [{ text: message.content }] })),
			generationConfig: { temperature: 0.35, responseMimeType: 'application/json' }
		})
	});
	if (!response.ok) throw new Error(`Gemini respondió ${response.status}`);
	const data = await response.json();
	return parseModelAnswer(data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No recibí una respuesta válida.');
}

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null) as { messages?: ChatMessage[]; history?: string[]; memory?: string; stream?: boolean } | null;
	const messages = body?.messages?.filter((message) => message.role && message.content).slice(-30) ?? [];
	const history = body?.history ?? messages
		.filter((message) => message.role === 'user')
		.map((message) => typeof message.content === 'string' ? message.content : message.content.find((part) => part.type === 'text')?.text ?? 'Analiza la imagen adjunta.');
	const provider = (env('AI_PROVIDER') ?? '').toLowerCase();
	const hasProvider = provider === 'gemini' ? Boolean(env('GEMINI_API_KEY')) : Boolean(env('OPENAI_API_KEY'));
	const latestContent = messages.at(-1)?.content;
	const latestText = typeof latestContent === 'string'
		? latestContent
		: latestContent?.find((part) => part.type === 'text')?.text ?? 'Analiza la imagen adjunta.';

	if (!messages.length) return json({ html: '<strong>Cuéntame qué quieres construir y lo resolveremos juntos.</strong>' }, { status: 400 });
	if (!hasProvider) return json({ html: buildResponse(latestText, history), source: 'local' });
	if (body?.stream) return streamResponse(messages, provider === 'gemini' ? 'gemini' : 'openai', body.memory);

	try {
		const result = provider === 'gemini' ? await askGemini(messages, body?.memory) : await askOpenAI(messages, body?.memory);
		return json({ html: htmlAnswer(result), source: provider || 'openai' });
	} catch {
		return json({ html: buildResponse(latestText, history), source: 'local-fallback' });
	}
};
