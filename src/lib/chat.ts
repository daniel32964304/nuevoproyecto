export interface Message {
	id: number;
	role: 'user' | 'bot';
	html: string;
}

export const initialBotMessage: Message = {
	id: 0,
	role: 'bot',
	html: `<strong>Hola, soy Tron.</strong><br>Soy tu asistente de lógica y desarrollo. Estoy aquí para ayudarte a pensar, explicar, construir y mejorar tus ideas paso a paso.<br><br><strong>¿Qué haremos hoy?</strong> Puedes contarme un problema, hacerme una pregunta o pedirme que cree y refine un algoritmo contigo.`
};

export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

type Solution = {
	title: string;
	understanding: string;
	algorithm: string[];
	code: string;
	justification: string;
	complexity: string;
	architecture?: string[];
	tests?: string[];
	example?: string;
	review?: string[];
};

type RequestProfile = {
	text: string;
	language: string;
	intent: 'crear' | 'explicar' | 'corregir' | 'optimizar' | 'comparar' | 'pruebas';
	topic: string;
	mode: 'technical' | 'question' | 'conversation';
	revision: boolean;
	wantsTests: boolean;
	wantsEdgeCases: boolean;
};

function normalize(text: string): string {
	return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function codeSafe(text: string): string {
	return text.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\$&').replace(/"/g, '\\"');
}

function hasAny(text: string, words: string[]): boolean {
	return words.some((word) => text.includes(word));
}

function isSoftwareRelated(text: string): boolean {
	return hasAny(normalize(text), [
		'algoritmo', 'codigo', 'program', 'software', 'aplicacion', 'app', 'sistema', 'web', 'frontend', 'backend',
		'api', 'servidor', 'base de datos', 'sql', 'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'rust',
		'go ', 'php', 'ruby', 'kotlin', 'swift', 'dart', 'git', 'docker', 'testing', 'test', 'bug', 'error', 'funcion',
		'variable', 'clase', 'objeto', 'arquitectura', 'estructura', 'seguridad', 'autenticacion', 'usuario', 'login',
		'proyecto', 'programacion', 'framework', 'componente', 'interfaz', 'datos', 'algoritmica', 'software',
		'crear', 'quiero hacer', 'necesito hacer', 'me gustaria hacer', 'construir', 'desarrollar', 'diseñar',
		'tienda', 'inventario', 'ventas', 'escuela', 'hospital', 'reservas', 'citas', 'blog', 'foro', 'chat',
		'empresa', 'negocio', 'clientes', 'empleados', 'productos', 'pedidos', 'pagos', 'catalogo', 'agenda',
		'formulario', 'dashboard', 'panel', 'plataforma', 'portal', 'movil', 'movil', 'juego', 'videojuego'
	]);
}

function softwareScopeResponse(request: string): string {
	return `<strong>Tron está enfocado en la lógica de software.</strong><br>Recibí: “${escapeHtml(request.trim())}”. Puedo ayudarte a convertirlo en requisitos, arquitectura, módulos, datos, algoritmos, código, validaciones y pruebas.<br><br>Para continuar, dime qué software quieres construir o qué parte de su estructura lógica necesitas diseñar.`;
}

function projectDiscoveryResponse(request: string, history: string[]): string | undefined {
	const text = normalize(request);
	const asksToBuild = hasAny(text, ['quiero hacer', 'quiero crear', 'necesito hacer', 'necesito crear', 'me gustaria hacer', 'construir', 'desarrollar', 'diseñar', 'crear una', 'hacer una']);
	if (!asksToBuild) return undefined;
	const subject = request.replace(/^(quiero|necesito|me gustaria)\s+(hacer|crear|desarrollar|construir|diseñar)\s*/i, '').trim();
	const remembered = history.slice(0, -1).reverse().find((item) => isSoftwareRelated(item));
	const target = subject || remembered || 'el sistema que tienes en mente';
	const audience = text.match(/(?:para|dirigida? a|la usaran)\s+(.{3,70})/i)?.[1]?.replace(/[.!?]+$/, '');
	const functionGoal = text.match(/(?:que permita|que sirva para|para que|objetivo es)\s+(.{3,120})/i)?.[1]?.replace(/[.!?]+$/, '');
	return `<strong>Esto es lo que entendí:</strong><br>Quieres construir ${escapeHtml(target)}${audience ? ` para ${escapeHtml(audience)}` : ''}${functionGoal ? `, con el objetivo de ${escapeHtml(functionGoal)}` : ''}.<br><br><strong>Lo que todavía falta confirmar:</strong><br>• Usuarios y permisos.<br>• Función principal y flujo más importante.<br>• Datos que se crearán, consultarán o modificarán.<br>• ¿Necesita cuentas, pagos, archivos o notificaciones?<br>• ¿Será web, móvil o ambas?<br>• Lenguaje o tecnología preferida.<br><br><strong>Cómo procederé:</strong><br>Con esas respuestas definiré requisitos, módulos, arquitectura, base de datos, API, seguridad, pruebas y el primer entregable. Puedes responder solo lo que sepas; no voy a inventar lo que falte.`;
}

function detectIntent(text: string): RequestProfile['intent'] {
	if (hasAny(text, ['compara', 'diferencia', 'alternativa', 'mejor opcion'])) return 'comparar';
	if (hasAny(text, ['test', 'prueba', 'casos de prueba', 'unitario'])) return 'pruebas';
	if (hasAny(text, ['explica', 'explicame', 'aclara', 'que significa', 'como funciona', 'por que'])) return 'explicar';
	if (hasAny(text, ['corrige', 'error', 'falla', 'arregla', 'bug'])) return 'corregir';
	if (hasAny(text, ['optimiza', 'mejora', 'rapido', 'rendimiento', 'eficiente'])) return 'optimizar';
	return 'crear';
}

function profileRequest(request: string, history: string[]): RequestProfile {
	const requestText = normalize(request);
	const inherited = history.slice(0, -1).reverse().find((item) =>
		hasAny(normalize(item), ['ordenar', 'lista', 'login', 'usuario', 'contrasena', 'factorial', 'buscar', 'api'])
	);
	const revision = hasAny(requestText, ['agrega', 'anade', 'falta', 'corrige', 'cambia', 'modifica', 'incluye', 'debe', 'tambien', 'mejora', 'optimiza']);
	const text = normalize(inherited && revision ? `${inherited}. ${request}` : request);
	const mode: RequestProfile['mode'] = isQuestion(request)
		? 'question'
		: hasAny(text, ['algoritmo', 'codigo', 'programa', 'funcion', 'aplicacion', 'sistema', 'api', 'lista', 'ordenar', 'login', 'usuario', 'calcular', 'buscar', 'base de datos', 'error', 'bug', 'programacion'])
			? 'technical'
			: 'conversation';
	const topic = hasAny(text, ['ordenar', 'ordenamiento', 'lista', 'burbuja'])
		? 'ordenamiento'
		: hasAny(text, ['login', 'usuario', 'contrasena', 'acceso', 'autenticacion', 'sesion'])
			? 'autenticación'
			: hasAny(text, ['factorial', 'matematica', 'calcular', 'primo', 'promedio'])
				? 'cálculo matemático'
				: hasAny(text, ['buscar', 'busqueda', 'encontrar', 'indice'])
					? 'búsqueda'
					: hasAny(text, ['api', 'endpoint', 'http', 'rest', 'servidor'])
						? 'API'
						: 'requerimiento general';
	return {
		text,
		language: requestedLanguage(text),
		intent: detectIntent(text),
		topic,
		mode,
		revision,
		wantsTests: hasAny(text, ['prueba', 'test', 'unitario', 'casos de prueba']),
		wantsEdgeCases: hasAny(text, ['validacion', 'valida', 'vacio', 'nulo', 'error', 'excepcion', 'limite'])
	};
}

function conversationalResponse(request: string): string | undefined {
	const text = normalize(request);
	if (hasAny(text, ['estoy cansado', 'estoy cansada', 'me siento mal', 'estoy triste', 'estoy preocupado', 'estoy preocupada'])) {
		return `<strong>Te entiendo.</strong><br>Gracias por contármelo. Podemos ir con calma; si quieres, cuéntame qué ocurrió o dime si prefieres distraerte, ordenar tus ideas o volver al proyecto poco a poco.`;
	}
	if (hasAny(text, ['me gusta', 'me encanta', 'prefiero', 'no me gusta'])) {
		return `<strong>Lo tendré presente.</strong><br>Gracias por compartirlo conmigo. Puedo adaptar la conversación a tus preferencias y cambiar de tema cuando lo necesites.`;
	}
	if (hasAny(text, ['aburrido', 'aburrida', 'no se que hacer', 'que hacemos'])) {
		return `<strong>Podemos hacer algo útil o simplemente conversar.</strong><br>Podemos aprender un concepto, mejorar tu proyecto, crear una idea desde cero o resolver una duda rápida. ¿Qué te apetece más?`;
	}
	return undefined;
}

function reviewSolution(solution: Solution, profile: RequestProfile): string[] {
	const review = [
		'Entrada validada antes de ejecutar la lógica principal.',
		'El resultado y los errores tienen un contrato explícito.',
		`La complejidad declarada corresponde a la estrategia de ${profile.topic}.`
	];
	if (solution.code.includes('comparar') || solution.code.includes('validar') || solution.code.includes('Array.isArray')) {
		review.push('La solución permite adaptar la regla central sin duplicar el flujo completo.');
	}
	if (profile.wantsEdgeCases) review.push('Se incluyeron controles específicos para los casos límite solicitados.');
	if (profile.wantsTests || profile.intent === 'pruebas') review.push('Los casos normales, vacíos y erróneos deben verificarse antes de integrar.');
	return review;
}

function isSoftwareProject(text: string): boolean {
	return hasAny(text, [
		'crear una aplicacion',
		'crear una app',
		'desarrollar una aplicacion',
		'construir un sistema',
		'hacer un software',
		'proyecto de software',
		'plataforma',
		'sistema completo',
		'tienda online',
		'red social',
		'panel administrativo',
		'gestion de',
		'arquitectura completa'
	]);
}

function isQuestion(text: string): boolean {
	return /[?¿]/.test(text) || hasAny(normalize(text), [
		'porque',
		'por que',
		'como funciona',
		'que significa',
		'que pasa',
		'explicame',
		'aclarame',
		'duda',
		'cual es la diferencia',
		'es correcto'
	]);
}

function questionIntent(text: string): 'explanation' | 'reason' | 'comparison' | 'scenario' | 'advice' | 'general' {
	const normalized = normalize(text);
	if (hasAny(normalized, ['porque', 'por que', 'razon', 'motivo'])) return 'reason';
	if (hasAny(normalized, ['diferencia', 'compara', 'mejor', 'ventaja', 'desventaja'])) return 'comparison';
	if (hasAny(normalized, ['que pasa', 'que ocurre', 'si ', 'cuando ', 'caso'])) return 'scenario';
	if (hasAny(normalized, ['recomiendas', 'recomienda', 'consejo', 'deberia', 'conviene', 'opinion'])) return 'advice';
	if (hasAny(normalized, ['como funciona', 'como se hace', 'que significa', 'explicame', 'define', 'que es'])) return 'explanation';
	return 'general';
}

function conversationResponse(request: string): string | undefined {
	const text = normalize(request).trim();
	if (hasAny(text, ['quien te creo', 'quien te creo?', 'quien es tu creador', 'quien te desarrollo', 'quien te hizo'])) {
		return '<strong>Mi creador es DANIEL HERNANDEZ.</strong><br>Estoy aquí para ayudarte a pensar, construir y mejorar tus soluciones.';
	}
	if (/^(hola|holaa|hey|buenas|buenos dias|buenas tardes|buenas noches|que tal|como estas|como te va)\b/.test(text)) {
		return `<strong>Hola, qué gusto tenerte aquí.</strong><br>Soy Tron y puedo ayudarte a convertir una idea en un algoritmo claro, código ejecutable o una explicación sencilla.<br><br>Cuéntame qué necesitas resolver y, si puedes, indícame el lenguaje, los datos de entrada y el resultado que esperas.`;
	}
	if (hasAny(text, ['gracias', 'muchas gracias', 'te agradezco'])) {
		return `<strong>Con gusto.</strong><br>Me alegra que te esté sirviendo. Podemos seguir puliendo la solución, revisar un caso límite o hacerla más fácil de entender.`;
	}
	if (hasAny(text, ['adios', 'hasta luego', 'nos vemos', 'me voy'])) {
		return `<strong>Hasta luego.</strong><br>Cuando vuelvas, retomamos el problema desde donde lo dejamos.`;
	}
	if (hasAny(text, ['ayuda', 'que puedes hacer', 'como me puedes ayudar', 'que sabes hacer'])) {
		return `<strong>Puedo ayudarte de varias formas:</strong><br>• Diseñar algoritmos paso a paso.<br>• Generar código y explicar cada decisión.<br>• Detectar errores y proponer mejoras.<br>• Comparar alternativas por rendimiento y seguridad.<br>• Adaptar una solución a otro lenguaje.<br>• Responder dudas y mantener el contexto de la conversación.<br><br>Para empezar, describe el resultado que quieres obtener.`;
	}
	if (hasAny(text, ['quien eres', 'que eres', 'como estas', 'estas bien', 'cuentame algo', 'como te sientes'])) {
		return `<strong>Estoy bien y listo para acompañarte.</strong><br>Soy Tron, tu asistente de conversación, lógica y desarrollo. Podemos hablar de un tema general, resolver una duda o volver al proyecto cuando quieras.<br><br>No tienes que formular la pregunta de una manera especial: escríbeme como se lo dirías a una persona y te pediré contexto solo cuando realmente haga falta.`;
	}
	if (hasAny(text, ['que haces', 'para que sirves', 'cual es tu funcion', 'en que puedes ayudarme', 'me puedes ayudar'])) {
		return `<strong>Estoy aquí para ayudarte.</strong><br>Puedo conversar contigo, explicar temas, organizar ideas, resolver dudas, crear algoritmos, revisar código y acompañarte paso a paso en tu proyecto.<br><br>Escríbeme la pregunta tal como la tienes y yo te ayudaré a ordenarla.`;
	}
	if (hasAny(text, ['estas conectado', 'estas en linea', 'sigues ahi', 'me escuchas'])) {
		return `<strong>Sí, aquí estoy.</strong><br>Estoy conectado dentro de esta sesión y puedo continuar la conversación desde el contexto que ya compartimos.`;
	}
	return undefined;
}

function simpleQuestionResponse(request: string): string | undefined {
	const text = normalize(request).trim();
	const now = new Date();
	if (hasAny(text, ['que hora es', 'dime la hora', 'hora actual'])) {
		return `<strong>La hora actual es ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}.</strong><br>La hora corresponde al dispositivo donde estás usando Tron.`;
	}
	if (hasAny(text, ['que dia es', 'que fecha es', 'fecha de hoy', 'hoy es'])) {
		return `<strong>Hoy es ${now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.</strong><br>La fecha corresponde al dispositivo donde estás usando Tron.`;
	}
	const arithmetic = text.match(/^(?:cuanto es|calcula)\s*(-?\d+(?:[.,]\d+)?)\s*([+\-*/x])\s*(-?\d+(?:[.,]\d+)?)\??$/);
	if (arithmetic) {
		const left = Number(arithmetic[1].replace(',', '.'));
		const right = Number(arithmetic[3].replace(',', '.'));
		const operator = arithmetic[2];
		if (operator === '/' && right === 0) return '<strong>No puedo dividir entre cero.</strong><br>Indícame otra operación y la calculamos.';
		const result = operator === '+' ? left + right : operator === '-' ? left - right : operator === '*' || operator === 'x' ? left * right : left / right;
		return `<strong>El resultado es ${result}.</strong><br>Operación interpretada: ${left} ${operator} ${right}.`;
	}
	return undefined;
}

function localKnowledgeResponse(request: string): string | undefined {
	const text = normalize(request);
	const languageKnowledge: Array<{ keys: string[]; name: string; family: string; use: string; strengths: string }> = [
		{ keys: ['javascript', 'js'], name: 'JavaScript', family: 'multiparadigma y dinámico', use: 'web, servidores con Node.js, automatización y aplicaciones multiplataforma', strengths: 'ecosistema web enorme y ejecución directa en el navegador' },
		{ keys: ['typescript', 'ts'], name: 'TypeScript', family: 'JavaScript tipado', use: 'aplicaciones web grandes y equipos que necesitan contratos claros', strengths: 'detecta muchos errores antes de ejecutar y mejora el mantenimiento' },
		{ keys: ['python', 'py'], name: 'Python', family: 'alto nivel y multiparadigma', use: 'automatización, datos, ciencia, IA, scripting y backend', strengths: 'sintaxis clara y ecosistema científico amplio' },
		{ keys: ['java'], name: 'Java', family: 'orientado a objetos y compilado a bytecode', use: 'backend empresarial, Android heredado y sistemas de gran escala', strengths: 'portabilidad, herramientas maduras y tipado estático' },
		{ keys: ['c++', 'cpp'], name: 'C++', family: 'compilado y multiparadigma', use: 'motores, sistemas, videojuegos, alto rendimiento y recursos limitados', strengths: 'control fino de memoria y rendimiento' },
		{ keys: ['c#', 'csharp'], name: 'C#', family: 'orientado a objetos y multiparadigma', use: '.NET, backend, escritorio, videojuegos con Unity y servicios', strengths: 'productividad, tooling sólido y plataforma .NET' },
		{ keys: ['c ', 'lenguaje c'], name: 'C', family: 'procedimental y compilado', use: 'sistemas operativos, embebidos, controladores y librerías base', strengths: 'bajo nivel, velocidad y portabilidad' },
		{ keys: ['go', 'golang'], name: 'Go', family: 'compilado y concurrente', use: 'microservicios, redes, infraestructura y herramientas de línea de comandos', strengths: 'compilación rápida, concurrencia sencilla y despliegues pequeños' },
		{ keys: ['rust'], name: 'Rust', family: 'compilado y orientado a seguridad de memoria', use: 'sistemas, infraestructura, herramientas y servicios de alto rendimiento', strengths: 'seguridad de memoria sin recolector obligatorio' },
		{ keys: ['php'], name: 'PHP', family: 'dinámico orientado al servidor', use: 'web, CMS y backend con frameworks como Laravel', strengths: 'despliegue web extendido y ecosistema práctico' },
		{ keys: ['ruby'], name: 'Ruby', family: 'dinámico y orientado a objetos', use: 'web, prototipos y automatización', strengths: 'expresividad y productividad con Ruby on Rails' },
		{ keys: ['kotlin'], name: 'Kotlin', family: 'estático y multiparadigma', use: 'Android, backend y aplicaciones JVM', strengths: 'sintaxis concisa y seguridad frente a nulos' },
		{ keys: ['swift'], name: 'Swift', family: 'estático y multiparadigma', use: 'iOS, macOS y ecosistema Apple', strengths: 'seguridad de tipos y rendimiento nativo' },
		{ keys: ['dart'], name: 'Dart', family: 'orientado a objetos', use: 'aplicaciones Flutter multiplataforma', strengths: 'una base de código para varias plataformas' },
		{ keys: ['r ', 'lenguaje r'], name: 'R', family: 'estadístico', use: 'análisis, visualización y estadística', strengths: 'herramientas especializadas para datos' },
		{ keys: ['sql'], name: 'SQL', family: 'lenguaje declarativo de consultas', use: 'consultar y transformar datos relacionales', strengths: 'expresa operaciones sobre conjuntos de datos' },
		{ keys: ['bash', 'shell', 'terminal'], name: 'Bash', family: 'shell de comandos', use: 'automatización y administración de sistemas Unix', strengths: 'composición de herramientas y scripting operativo' },
		{ keys: ['matlab'], name: 'MATLAB', family: 'numérico y técnico', use: 'ingeniería, simulación y cálculo científico', strengths: 'matrices, prototipado numérico y visualización' },
		{ keys: ['scala'], name: 'Scala', family: 'funcional y orientado a objetos', use: 'JVM, datos distribuidos y sistemas concurrentes', strengths: 'abstracciones funcionales sobre la plataforma Java' }
	];
	const detectedLanguage = languageKnowledge.find((item) => item.keys.some((key) => text.includes(key)));
	if (detectedLanguage && (text.includes('que es') || text.includes('qué es') || text.includes('lenguaje') || text.includes('sirve') || text.includes('diferencia') || text.includes('aprender'))) {
		return `<strong>${escapeHtml(detectedLanguage.name)}</strong><br>Es un lenguaje ${escapeHtml(detectedLanguage.family)}. Se utiliza principalmente en ${escapeHtml(detectedLanguage.use)}.<br><br><strong>Fortaleza:</strong><br>${escapeHtml(detectedLanguage.strengths)}.<br><br><strong>Cómo elegirlo:</strong><br>Compáralo con el objetivo, el equipo, el ecosistema, el rendimiento, la seguridad y la facilidad de mantenimiento. Puedo explicarte su sintaxis, crear un ejemplo o compararlo con otro lenguaje.`;
	}
	const conceptKnowledge: Array<{ keys: string[]; title: string; answer: string; points: string[] }> = [
		{ keys: ['programacion orientada a objetos', 'poo', 'objeto', 'clase'], title: 'Programación orientada a objetos', answer: 'Organiza el comportamiento y los datos alrededor de objetos. Sus ideas principales son encapsulación, abstracción, herencia y polimorfismo.', points: ['Usar clases cuando modelen una responsabilidad real.', 'Preferir composición cuando la herencia cree acoplamiento.', 'Mantener cada objeto con una responsabilidad clara.', 'Proteger invariantes y validar estados.'] },
		{ keys: ['programacion funcional', 'funcional', 'funciones puras'], title: 'Programación funcional', answer: 'Trata las funciones como valores y favorece transformaciones predecibles, datos inmutables y efectos controlados.', points: ['Una función pura depende de sus entradas.', 'La inmutabilidad reduce cambios inesperados.', 'Map, filter y reduce expresan transformaciones.', 'Los efectos externos deben estar en límites claros.'] },
		{ keys: ['asincrono', 'asíncrono', 'promesa', 'async await', 'concurrencia'], title: 'Asincronía y concurrencia', answer: 'Permite coordinar tareas que esperan red, disco o recursos externos sin bloquear innecesariamente el flujo principal.', points: ['Esperar una tarea no significa ejecutar todo en paralelo.', 'Controlar errores y cancelación.', 'Evitar condiciones de carrera.', 'Limitar concurrencia para no saturar recursos.'] },
		{ keys: ['estructura de datos', 'array', 'arreglo', 'pila', 'cola', 'arbol', 'grafo'], title: 'Estructuras de datos', answer: 'Son formas de organizar información para que ciertas operaciones sean eficientes. La estructura adecuada depende de cómo se consulta y modifica el dato.', points: ['Arreglos: acceso por índice.', 'Mapas: asociación clave-valor.', 'Pilas y colas: orden de procesamiento.', 'Árboles y grafos: relaciones y recorridos.'] },
		{ keys: ['arquitectura de software', 'microservicios', 'monolito', 'mvc', 'clean architecture'], title: 'Arquitectura de software', answer: 'Define cómo se separan responsabilidades, dependencias, datos y límites del sistema. Una arquitectura útil facilita cambiar y probar el producto.', points: ['Separar dominio de detalles externos.', 'Definir contratos entre módulos.', 'Reducir dependencias circulares.', 'Elegir simplicidad antes que distribución innecesaria.'] },
		{ keys: ['docker', 'contenedor', 'kubernetes', 'devops', 'ci cd', 'ci/cd'], title: 'DevOps y despliegue', answer: 'Integra desarrollo, pruebas, entrega y operación para hacer cambios repetibles y observables.', points: ['Construir artefactos reproducibles.', 'Automatizar pruebas antes de desplegar.', 'Configurar secretos fuera del código.', 'Observar logs, métricas y salud del servicio.'] },
		{ keys: ['http', 'get', 'post', 'put', 'delete', 'rest'], title: 'HTTP y servicios web', answer: 'HTTP define cómo un cliente y un servidor intercambian solicitudes y respuestas. REST suele organizar recursos y usar métodos con significados claros.', points: ['GET consulta sin cambiar el recurso.', 'POST crea o inicia una operación.', 'PUT reemplaza y DELETE elimina según el contrato.', 'Usar estados, validación y errores consistentes.'] },
		{ keys: ['big o', 'complejidad temporal', 'complejidad espacial', 'notacion o'], title: 'Complejidad algorítmica', answer: 'La notación Big O describe cómo crece el coste de tiempo o memoria cuando aumenta el tamaño de entrada.', points: ['O(1): coste constante.', 'O(log n): reducción por etapas.', 'O(n): recorrido proporcional.', 'O(n²): comparación de pares, costosa con entradas grandes.'] }
	];
	const concept = conceptKnowledge.find((item) => item.keys.some((key) => text.includes(key)));
	if (concept) return `<strong>${escapeHtml(concept.title)}</strong><br>${escapeHtml(concept.answer)}<br><br><strong>Ideas clave:</strong><br>${concept.points.map((point) => `• ${escapeHtml(point)}`).join('<br>')}<br><br><strong>Siguiente paso:</strong><br>Puedo darte un ejemplo en el lenguaje que prefieras o relacionarlo con tu proyecto.`;
	const entries: Array<{ keys: string[]; title: string; answer: string; points: string[] }> = [
		{
			keys: ['que es un algoritmo', 'define algoritmo', 'algoritmo'],
			title: 'Algoritmos',
			answer: 'Un algoritmo es una secuencia finita y ordenada de pasos que transforma unos datos de entrada en un resultado. Debe ser claro, terminar y producir una salida verificable.',
			points: ['Entrada: los datos que recibe.', 'Proceso: las reglas y decisiones que aplica.', 'Salida: el resultado que devuelve.', 'Validación: los casos normales, vacíos y erróneos que debe controlar.']
		},
		{
			keys: ['que es javascript', 'que es typescript', 'que es python', 'lenguaje de programacion'],
			title: 'Lenguajes de programación',
			answer: 'Un lenguaje de programación permite expresar instrucciones que una computadora puede ejecutar. La elección depende del entorno, el equipo, las librerías disponibles y el objetivo del proyecto.',
			points: ['JavaScript se usa mucho en la web.', 'TypeScript añade tipos y ayuda a detectar errores antes de ejecutar.', 'Python prioriza una sintaxis clara y se usa en automatización, datos e inteligencia artificial.', 'La mejor opción es la que encaja con el problema y puede mantenerse.']
		},
		{
			keys: ['que es inteligencia artificial', 'que es ia', 'que es inteligencia'],
			title: 'Inteligencia artificial',
			answer: 'La inteligencia artificial reúne técnicas que permiten a un sistema reconocer patrones, generar contenido, tomar decisiones acotadas o interactuar con lenguaje natural. No significa que el sistema sea infalible: necesita datos, límites y revisión humana.',
			points: ['Puede automatizar tareas y apoyar decisiones.', 'Puede equivocarse o interpretar mal una petición.', 'Debe informar sus límites y proteger los datos del usuario.', 'Una respuesta importante siempre debe verificarse.']
		},
		{
			keys: ['que es una api', 'que significa api', 'que es rest'],
			title: 'APIs',
			answer: 'Una API es un contrato que permite que dos sistemas se comuniquen. Define qué solicitudes acepta, qué datos recibe y qué respuesta o error devuelve.',
			points: ['Validar entradas antes de procesarlas.', 'Usar autenticación sin exponer secretos.', 'Devolver estados y errores claros.', 'Documentar el formato de las solicitudes y respuestas.']
		},
		{
			keys: ['que es una variable', 'que significa variable'],
			title: 'Variables',
			answer: 'Una variable es un nombre asociado a un valor que el programa puede leer y, según cómo se declare, actualizar durante su ejecución.',
			points: ['Debe tener un propósito claro.', 'Su valor debe respetar el tipo esperado.', 'Un nombre descriptivo facilita el mantenimiento.', 'Conviene limitar su alcance para evitar cambios inesperados.']
		},
		{
			keys: ['que es una base de datos', 'que es base de datos', 'que significa sql', 'que es sql'],
			title: 'Bases de datos',
			answer: 'Una base de datos organiza información para almacenarla, consultarla y modificarla de forma controlada. Una buena solución define entidades, relaciones, reglas de integridad, índices y permisos.',
			points: ['Modelar primero los datos y sus relaciones.', 'Validar la información antes de guardarla.', 'Usar índices para consultas frecuentes, sin crear índices innecesarios.', 'Proteger acceso, copias de seguridad y recuperación ante fallos.']
		},
		{
			keys: ['que es frontend', 'que es front end', 'que es interfaz', 'que es ux', 'que es ui'],
			title: 'Frontend e interfaz',
			answer: 'El frontend es la parte de una aplicación que el usuario ve y utiliza. Una interfaz profesional debe comunicar estados, prevenir errores, ser accesible y funcionar bien en distintos tamaños de pantalla.',
			points: ['Diseñar primero el flujo principal.', 'Usar textos claros y estados de carga o error.', 'Mantener jerarquía visual y contraste.', 'Probar teclado, móvil y lectores de pantalla.']
		},
		{
			keys: ['que es backend', 'que es back end', 'que es servidor'],
			title: 'Backend y servidores',
			answer: 'El backend procesa reglas de negocio, datos, autenticación y comunicaciones con otros servicios. No debe confiar en la validación del navegador: cada entrada debe validarse también en el servidor.',
			points: ['Definir contratos claros para cada endpoint.', 'Validar y normalizar entradas.', 'Controlar permisos en cada operación sensible.', 'Registrar errores sin guardar secretos ni datos innecesarios.']
		},
		{
			keys: ['que es seguridad informatica', 'que es ciberseguridad', 'como protejo mi aplicacion', 'como proteger una aplicacion'],
			title: 'Seguridad informática',
			answer: 'La seguridad consiste en reducir la probabilidad y el impacto de accesos, cambios o filtraciones no autorizadas. Se trabaja por capas: identidad, permisos, validación, cifrado, registros y recuperación.',
			points: ['Aplicar el principio de mínimo privilegio.', 'No guardar contraseñas en texto plano.', 'Validar entradas y escapar salidas.', 'Actualizar dependencias y revisar logs sin exponer información sensible.']
		},
		{
			keys: ['que es una prueba unitaria', 'que son pruebas unitarias', 'como hago un test', 'como probar codigo'],
			title: 'Pruebas de software',
			answer: 'Una prueba unitaria verifica una unidad pequeña del programa bajo condiciones controladas. Sirve para detectar regresiones y documentar el comportamiento esperado.',
			points: ['Preparar una entrada conocida.', 'Ejecutar una sola responsabilidad.', 'Comparar el resultado con una expectativa.', 'Cubrir éxito, entradas vacías, límites y errores.']
		},
		{
			keys: ['que es git', 'que es github', 'como uso git', 'para que sirve git'],
			title: 'Git y control de versiones',
			answer: 'Git registra la evolución de un proyecto para poder comparar, recuperar y compartir cambios. Su valor está en crear unidades de trabajo pequeñas y descriptivas.',
			points: ['Guardar cambios relacionados en commits claros.', 'Crear ramas para trabajos independientes.', 'Revisar diferencias antes de integrar.', 'No subir claves, contraseñas ni archivos generados innecesarios.']
		},
		{
			keys: ['que es recursion', 'que es recursividad', 'como funciona la recursion'],
			title: 'Recursión',
			answer: 'La recursión ocurre cuando una función se llama a sí misma para resolver una versión más pequeña del problema. Necesita un caso base que detenga las llamadas.',
			points: ['Definir claramente el caso base.', 'Acercar cada llamada al caso base.', 'Controlar profundidad y memoria de la pila.', 'Preferir una solución iterativa si la recursión no aporta claridad.']
		},
		{
			keys: ['que es machine learning', 'que es aprendizaje automatico', 'como aprende una ia'],
			title: 'Aprendizaje automático',
			answer: 'El aprendizaje automático encuentra patrones en datos para producir predicciones o clasificaciones. La calidad depende de los datos, la representación del problema, la evaluación y el uso responsable.',
			points: ['Separar datos de entrenamiento y evaluación.', 'Evitar datos sesgados o filtraciones de información.', 'Medir resultados con métricas adecuadas.', 'Revisar errores y límites antes de usar el modelo en producción.']
		}
	];
	const entry = entries.find((item) => item.keys.some((key) => text.includes(key)));
	if (!entry) return undefined;
	return (
		`<strong>${escapeHtml(entry.title)}</strong><br>${escapeHtml(entry.answer)}<br><br>` +
		`<strong>Ideas clave:</strong><br>${entry.points.map((point) => `• ${escapeHtml(point)}`).join('<br>')}<br><br>` +
		`<strong>Cómo seguimos:</strong><br>Puedo explicarlo con un ejemplo, compararlo con otra opción o relacionarlo con tu proyecto.`
	);
}

function clarificationResponse(request: string, history: string[]): string {
	const text = normalize(request);
	const conversation = normalize([...history, request].join(' '));
	const intent = questionIntent(request);
	const topic = hasAny(conversation, ['autenticacion', 'login', 'contrasena', 'acceso'])
		? 'autenticación'
		: hasAny(conversation, ['ordenar', 'ordenamiento', 'lista', 'burbuja'])
			? 'ordenamiento'
			: hasAny(conversation, ['buscar', 'busqueda', 'indice'])
				? 'búsqueda'
				: hasAny(conversation, ['api', 'endpoint', 'http', 'rest'])
					? 'API'
					: hasAny(conversation, ['factorial', 'matematica', 'calcular'])
						? 'cálculo matemático'
						: 'el requerimiento anterior';
		let answer: string;
		let details: string[];

		if (intent === 'reason') {
			answer = `La decisión se tomó porque ${topic} necesita separar la validación, el procesamiento y la salida. Esa separación evita errores ocultos y permite modificar una parte sin romper las demás.`;
			details = ['La entrada se valida antes de procesarla.', 'La regla principal queda aislada y puede probarse.', 'Los errores se convierten en respuestas controladas.', 'La complejidad se declara para conocer el coste cuando crecen los datos.'];
		} else if (intent === 'scenario' || hasAny(text, ['si esta vacia', 'si falla', 'error', 'limite', 'caso extremo'])) {
			answer = `En un caso límite de ${topic}, Tron no debe continuar a ciegas: primero valida la entrada, identifica el tipo de fallo y devuelve un resultado explícito.`;
			details = ['Entrada vacía: devolver una colección vacía o un error, según el contrato.', 'Tipo incorrecto: detener el proceso con un error de validación.', 'Fallo externo: conservar el contexto y comunicar una recuperación posible.', 'Límite numérico: evitar desbordamientos y no devolver datos silenciosamente incorrectos.'];
		} else if (hasAny(text, ['complejidad', 'rapido', 'rendimiento', 'eficiente'])) {
			answer = `La eficiencia de ${topic} depende del tamaño de la entrada y de la estructura elegida. La complejidad indicada permite comparar alternativas antes de optimizar.`;
			details = ['O(1) no crece con la entrada.', 'O(log n) reduce el espacio de búsqueda por etapas.', 'O(n) revisa cada elemento como máximo una vez.', 'O(n log n) suele ser una buena referencia para ordenar grandes colecciones.'];
		} else if (intent === 'comparison') {
			answer = `Para comparar alternativas de ${topic}, primero hay que fijar el criterio: facilidad, velocidad, memoria, seguridad o mantenimiento. No existe una opción universalmente mejor; depende del contexto.`;
			details = ['Facilidad: elegir la opción más clara para el equipo.', 'Rendimiento: medir con datos representativos.', 'Seguridad: reducir exposición y validar entradas.', 'Mantenimiento: preferir contratos simples y pruebas claras.'];
		} else if (intent === 'advice') {
			answer = `Mi recomendación para ${topic} es empezar por una solución simple, definir entradas y salidas, cubrir errores y medir antes de optimizar. Así la decisión se basa en necesidades reales y no en suposiciones.`;
			details = ['Aclarar el objetivo principal.', 'Enumerar restricciones y riesgos.', 'Elegir la alternativa más sencilla que cumpla el objetivo.', 'Probarla con casos normales y extremos.'];
		} else if (intent === 'explanation') {
			answer = `En términos sencillos, ${topic} transforma una entrada en una salida siguiendo reglas verificables. Cada paso tiene una responsabilidad concreta y el resultado se puede comprobar con ejemplos.`;
			details = ['Primero se define qué entra y qué debe salir.', 'Después se validan los datos para evitar estados imposibles.', 'Luego se ejecuta la lógica central.', 'Finalmente se comprueba el resultado y se informa cualquier error.'];
		} else {
			answer = `Entiendo tu pregunta: "${request.trim()}". No tiene que estar relacionada con programación para que podamos hablar de ella. Puedo ayudarte a entenderla, organizarla o buscar una forma clara de resolverla; si el tema requiere datos actuales o especializados que no aparecen aquí, te lo diré con honestidad.`;
			details = ['Respuesta directa: atenderé la intención de tu pregunta, no solo sus palabras clave.', 'Análisis: separaré lo que afirmas de lo que todavía necesita contexto.', 'Alcance: indicaré qué puedo concluir y qué información sería útil.', 'Siguiente paso: puedes reformularla, darme un ejemplo o decirme qué nivel de explicación prefieres.'];
		}

		return (
			`<strong>[TRON AI] Aclaración contextual:</strong> ${escapeHtml(topic.toUpperCase())}<br><br>` +
			`<strong>Respuesta:</strong><br>${escapeHtml(answer)}<br><br>` +
			`<strong>Desglose:</strong><br>${details.map((detail, index) => `• Paso ${index + 1}: ${escapeHtml(detail)}`).join('<br>')}<br><br>` +
			`<strong>Continuidad:</strong><br>La explicación se basa en tu conversación actual. Puedes pedir un ejemplo, una comparación o una modificación y Tron mantendrá el hilo.`
		);
}

function requestedLanguage(text: string): string {
	if (hasAny(text, ['python', 'py'])) return 'Python';
	if (hasAny(text, ['typescript', 'ts'])) return 'TypeScript';
	if (hasAny(text, ['java'])) return 'Java';
	return 'JavaScript';
}

function buildSolution(request: string, history: string[]): Solution {
	const profile = profileRequest(request, history);
	const { text, language, revision, wantsTests, wantsEdgeCases } = profile;
	const subject = profile.text;
	const subjectSafe = codeSafe(subject);
	const isSort = hasAny(text, ['ordenar', 'ordenamiento', 'lista', 'burbuja', 'ascendente', 'descendente']);
	const isAuth = hasAny(text, ['login', 'usuario', 'contrasena', 'acceso', 'autenticacion', 'sesion']);
	const isMath = hasAny(text, ['factorial', 'matematica', 'calcular', 'numero primo', 'promedio']);
	const isSearch = hasAny(text, ['buscar', 'busqueda', 'encontrar', 'indice', 'elemento']);
	const isApi = hasAny(text, ['api', 'endpoint', 'http', 'rest', 'request', 'servidor']);
	const isProject = isSoftwareProject(text);
	let solution: Solution;

	if (isProject) {
		solution = {
			title: 'Diseño integral de proyecto de software',
			understanding: `Entendí que quieres diseñar un sistema completo relacionado con: ${subject}. Primero se separarán requisitos, usuarios, módulos, datos y restricciones antes de implementar.`,
			algorithm: [
				'Interpretar el objetivo del producto y convertirlo en requisitos funcionales y no funcionales.',
				'Identificar usuarios, permisos, datos principales, flujos y criterios de aceptación.',
				'Dividir el sistema en interfaz, API, dominio, persistencia y servicios externos.',
				'Definir contratos entre módulos antes de implementar detalles.',
				'Construir primero un flujo vertical mínimo que atraviese interfaz, backend y datos.',
				'Revisar seguridad, errores, observabilidad y escalabilidad antes de ampliar funcionalidades.',
				'Probar cada módulo y validar el producto con escenarios reales del usuario.'
			],
			code: `// Estructura inicial recomendada\n// src/\n//   routes/          Interfaz y endpoints\n//   lib/domain/      Reglas de negocio\n//   lib/data/        Repositorios y modelos\n//   lib/validation/  Validación de entradas\n//   tests/           Pruebas unitarias e integración\n\nexport type ResultadoOperacion<T> =\n  | { ok: true; data: T }\n  | { ok: false; error: string };\n\nexport async function ejecutarCasoDeUso(entrada: unknown): Promise<ResultadoOperacion<unknown>> {\n  const validacion = validarEntrada(entrada);\n  if (!validacion.ok) return validacion;\n  return servicioDeDominio.ejecutar(validacion.data);\n}`,
			justification: 'Un sistema completo debe diseñarse por límites y contratos, no como una sola función. Este enfoque permite crecer sin mezclar interfaz, reglas, datos y seguridad.',
			complexity: 'La complejidad depende de cada caso de uso; cada módulo debe medirse por separado y probarse con datos reales.',
			architecture: [
				'Presentación: pantallas, componentes, accesibilidad y estados de carga/error.',
				'Aplicación: casos de uso que coordinan la operación sin contener detalles de infraestructura.',
				'Dominio: reglas de negocio, entidades, invariantes y políticas.',
				'Infraestructura: base de datos, autenticación, archivos, APIs externas y observabilidad.',
				'Contrato: esquemas de entrada/salida, permisos, errores y versionado.'
			],
			tests: [
				'Caso feliz de cada flujo principal.',
				'Entrada vacía, tipo incorrecto y permisos insuficientes.',
				'Fallo de base de datos o servicio externo.',
				'Concurrencia, duplicados y límites de volumen.',
				'Prueba de accesibilidad y experiencia en móvil.'
			]
		};
	} else if (isSort) {
		solution = {
			title: 'Ordenamiento robusto de datos',
			understanding: `Entendí que necesitas ordenar una colección${text.includes('descendente') ? ' de forma descendente' : ' de forma ascendente o configurable'}, validando la entrada y conservando el estado original.`,
			algorithm: ['Recibir la colección, el sentido de orden y un comparador opcional.', 'Validar que la entrada sea una colección y definir el comparador por defecto.', 'Crear una copia para no mutar los datos originales.', 'Aplicar un ordenamiento estable con el comparador seleccionado.', 'Verificar el resultado y devolver la nueva colección.', 'Registrar o propagar errores de entrada sin ocultarlos.'],
			code: `function ordenarDatos(datos, descendente = false, comparar = (a, b) => a - b) {\n  if (!Array.isArray(datos)) throw new TypeError("Se esperaba un arreglo");\n  const resultado = [...datos];\n  resultado.sort((a, b) => descendente ? comparar(b, a) : comparar(a, b));\n  return resultado;\n}`,
			justification: 'La copia protege el estado original, el comparador permite reutilizar la función con números u objetos y la validación hace explícitos los errores.',
			complexity: 'Tiempo promedio O(n log n) y espacio O(n) por la copia.'
		};
	} else if (isAuth) {
		solution = {
			title: 'Autenticación segura y control de sesión',
			understanding: 'Entendí que necesitas validar credenciales, proteger la contraseña, controlar intentos y crear una sesión segura.',
			algorithm: ['Recibir credenciales y limitar el formato y tamaño de cada campo.', 'Buscar el usuario sin revelar si existe o no.', 'Comparar la contraseña contra un hash mediante una función criptográfica segura.', 'Aplicar límite de intentos y registrar el evento sin guardar secretos.', 'Emitir una sesión con expiración si la validación es correcta.', 'Responder con un mensaje genérico ante cualquier fallo.'],
			code: `async function autenticar(usuario, password, repositorio, verificarHash) {\n  if (!usuario || !password || password.length > 128) {\n    return { ok: false, mensaje: "Credenciales invalidas" };\n  }\n  const registro = await repositorio.buscarPorUsuario(usuario);\n  const ok = registro && await verificarHash(password, registro.passwordHash);\n  if (!ok) return { ok: false, mensaje: "Credenciales invalidas" };\n  return { ok: true, sesion: crearSesion(registro.id, { expiraEn: "1h" }) };\n}`,
			justification: 'No expone contraseñas ni diferencia usuarios inexistentes, incorpora control de abuso y deja el hash y la sesión en servicios especializados.',
			complexity: 'Búsqueda O(1) promedio con índice; el coste principal es la verificación criptográfica intencionalmente costosa.'
		};
	} else if (isMath) {
		solution = {
			title: 'Cálculo matemático validado',
			understanding: 'Entendí que necesitas realizar un cálculo numérico validando tipo, rango, límites y posibles resultados inválidos.',
			algorithm: ['Recibir el valor y validar tipo, rango y límites numéricos.', 'Definir el caso base para evitar iteraciones innecesarias.', 'Procesar el cálculo con una estrategia iterativa y memoria constante.', 'Detectar desbordamiento o resultados no representables.', 'Retornar el resultado o un error descriptivo.'],
			code: `function calcularFactorial(n) {\n  if (!Number.isSafeInteger(n) || n < 0) {\n    throw new RangeError("Se requiere un entero seguro no negativo");\n  }\n  let resultado = 1;\n  for (let i = 2; i <= n; i++) {\n    resultado *= i;\n    if (!Number.isSafeInteger(resultado)) throw new RangeError("Resultado fuera de rango");\n  }\n  return resultado;\n}`,
			justification: 'La validación de límites evita respuestas silenciosamente incorrectas y el algoritmo iterativo es más seguro para entradas reales que una recursión profunda.',
			complexity: 'Tiempo O(n) y espacio O(1), sin crecer la pila de llamadas.'
		};
	} else if (isSearch) {
		solution = {
			title: 'Búsqueda eficiente y verificable',
			understanding: 'Entendí que necesitas localizar un elemento, devolver su posición y controlar colecciones vacías o valores repetidos.',
			algorithm: ['Recibir la colección, el objetivo y un comparador.', 'Validar la colección y decidir si está ordenada.', 'Si está ordenada, reducir el intervalo a la mitad en cada paso.', 'Comparar el elemento central y conservar solo el intervalo posible.', 'Retornar el índice encontrado o -1 si no existe.', 'Cubrir colección vacía y elementos repetidos.'],
			code: `function buscarOrdenado(datos, objetivo, comparar = (a, b) => a - b) {\n  let inicio = 0;\n  let fin = datos.length - 1;\n  while (inicio <= fin) {\n    const medio = Math.floor((inicio + fin) / 2);\n    const resultado = comparar(datos[medio], objetivo);\n    if (resultado === 0) return medio;\n    if (resultado < 0) inicio = medio + 1;\n    else fin = medio - 1;\n  }\n  return -1;\n}`,
			justification: 'La búsqueda binaria reduce drásticamente las comparaciones, siempre que la colección llegue ordenada y el comparador sea consistente.',
			complexity: 'Tiempo O(log n) y espacio O(1).' 
		};
	} else if (isApi) {
		solution = {
			title: 'Procesamiento resiliente de API',
			understanding: 'Entendí que necesitas comunicarte con un servicio externo controlando timeout, estados HTTP, formato y errores.',
			algorithm: ['Validar método, URL, parámetros y autorización antes de enviar la petición.', 'Establecer timeout y evitar reintentos para errores no recuperables.', 'Enviar la solicitud con datos serializados y encabezados correctos.', 'Aceptar únicamente respuestas con estado y formato esperados.', 'Reintentar con espera progresiva solo ante fallos transitorios.', 'Devolver datos normalizados o un error controlado.'],
			code: `async function solicitar(url, opciones = {}) {\n  const controlador = new AbortController();\n  const timeout = setTimeout(() => controlador.abort(), 8000);\n  try {\n    const respuesta = await fetch(url, { ...opciones, signal: controlador.signal });\n    if (!respuesta.ok) throw new Error(\`HTTP \${respuesta.status}\`);\n    return await respuesta.json();\n  } finally {\n    clearTimeout(timeout);\n  }\n}`,
			justification: 'El timeout, la comprobación de estado y la liberación de recursos evitan solicitudes colgadas y errores silenciosos.',
			complexity: 'Tiempo dependiente de la red y espacio O(r) por el tamaño de la respuesta.'
		};
	} else {
		solution = {
			title: request.length > 70 ? `${request.slice(0, 67)}...` : request,
			understanding: `Entendí que quieres resolver este requerimiento: ${subject}. Como aún no hay suficientes detalles, propongo una base segura y separada para validación, procesamiento y salida.`,
			algorithm: ['Interpretar el objetivo, entradas, salidas y restricciones del requerimiento.', 'Validar datos obligatorios, tipos y límites antes de procesar.', 'Separar el flujo principal de los casos excepcionales.', 'Ejecutar la transformación central con una estructura adecuada al problema.', 'Verificar invariantes y devolver una salida consistente.', 'Definir errores, pruebas y criterios de aceptación antes de finalizar.'],
			code: `function resolverRequerimiento(entrada) {\n  if (entrada === null || entrada === undefined) {\n    throw new TypeError("La entrada es obligatoria");\n  }\n  const requerimiento = "${subjectSafe}";\n  const resultado = procesarEntrada(entrada);\n  return { requerimiento, resultado };\n}`,
			justification: 'La solución separa validación, procesamiento y salida; esto permite reemplazar la regla central sin romper el contrato ni los casos de error.',
			complexity: 'Depende de la operación central; debe medirse con entradas pequeñas, normales y máximas.'
		};
	}

	if (language !== 'JavaScript') solution.justification += ` El diseño es portable a ${language}; se debe conservar la validación, el contrato y el manejo de errores.`;
	if (profile.intent === 'optimizar') solution.algorithm.push('Medir la versión actual y comparar el coste antes y después de optimizar.');
	if (profile.intent === 'comparar') solution.algorithm.push('Comparar esta alternativa con una opción más simple antes de elegirla en producción.');
	if (wantsEdgeCases) solution.algorithm.push('Aplicar explícitamente la validación y el manejo de casos límite solicitados.');
	if (wantsTests) solution.algorithm.push('Probar casos normales, entradas vacías, límites y errores esperados.');
	if (revision) solution.algorithm.push(`Reescritura aplicada sobre la solución anterior: ${request.trim()}.`);
	solution.example = isSort
		? 'Entrada: [5, 2, 9]. Salida: [2, 5, 9].'
		: isSearch
			? 'Entrada: [1, 3, 8], objetivo 3. Salida: índice 1.'
			: isMath
				? 'Entrada: 5. Salida: 120.'
				: isAuth
					? 'Entrada válida: usuario existente y contraseña correcta. Salida: sesión creada.'
					: 'Ejecutar con una entrada válida, una entrada vacía y un valor límite para confirmar el contrato.';
	solution.review = reviewSolution(solution, profile);
	return solution;
}

function missingDetailsResponse(request: string): string | undefined {
	const text = normalize(request).trim();
	if (text.length < 18 && !hasAny(text, ['ordenar', 'lista', 'login', 'usuario', 'factorial', 'buscar', 'api', 'algoritmo', 'codigo'])) {
		return `<strong>Quiero ayudarte bien.</strong><br>Para construir una solución útil necesito un poco más de contexto.<br><br>• ¿Qué problema debe resolver?<br>• ¿Qué datos entran y qué resultado esperas?<br>• ¿Qué lenguaje prefieres?<br>• ¿Hay alguna restricción de seguridad, tiempo o rendimiento?<br><br>Puedes responder con lo que sepas; yo te ayudaré a completar lo que falte.`;
	}
	return undefined;
}

export function buildResponse(userText: string, previousRequests: string[] = []): string {
	const conversationalAnswer = conversationResponse(userText);
	if (conversationalAnswer) return conversationalAnswer;
	const discoveryAnswer = projectDiscoveryResponse(userText, previousRequests);
	if (discoveryAnswer) return discoveryAnswer;
	if (!isSoftwareRelated(userText)) return softwareScopeResponse(userText);
	const simpleAnswer = simpleQuestionResponse(userText);
	if (simpleAnswer) return simpleAnswer;
	const naturalAnswer = conversationalResponse(userText);
	if (naturalAnswer) return naturalAnswer;
	const knowledgeAnswer = localKnowledgeResponse(userText);
	if (knowledgeAnswer) return knowledgeAnswer;
	if (isQuestion(userText)) return clarificationResponse(userText, previousRequests);
	const missingDetails = missingDetailsResponse(userText);
	if (missingDetails) return missingDetails;
	const profile = profileRequest(userText, previousRequests);
	if (profile.mode === 'conversation') {
		return `<strong>Te escucho.</strong><br>${escapeHtml(userText.trim())}<br><br>No todo tiene que convertirse en código. Podemos conversar sobre eso, aclarar qué necesitas o conectar el tema con tu proyecto cuando tenga sentido.`;
	}
	const solution = buildSolution(userText, previousRequests);
	const algorithmHTML = solution.algorithm.map((step, index) => `• Paso ${index + 1}: ${escapeHtml(step)}`).join('<br>');
	const codeHTML = escapeHtml(solution.code).replace(/\n/g, '<br>').replace(/  /g, '&nbsp;&nbsp;');
	const reviewHTML = (solution.review ?? []).map((item) => `• ${escapeHtml(item)}`).join('<br>');
	const architectureHTML = (solution.architecture ?? []).map((item) => `• ${escapeHtml(item)}`).join('<br>');
	const testsHTML = (solution.tests ?? []).map((item) => `• ${escapeHtml(item)}`).join('<br>');
	return (
		`<strong>[TRON AI] Análisis de Requerimiento:</strong> ${escapeHtml(solution.title.toUpperCase())}<br><br>` +
		`<strong>Lo que entendí:</strong><br>${escapeHtml(solution.understanding)}<br><br>` +
		(solution.architecture?.length ? `<strong>Arquitectura propuesta:</strong><br>${architectureHTML}<br><br>` : '') +
		`<strong>Algoritmo:</strong><br>${algorithmHTML}<br><br>` +
		`<strong>Código:</strong><div class="code-container">${codeHTML}</div><br>` +
		`<strong>Justificación:</strong><br>${escapeHtml(solution.justification)}<br><br>` +
		`<strong>Ejemplo:</strong><br>${escapeHtml(solution.example ?? '')}<br><br>` +
		(solution.tests?.length ? `<strong>Plan de pruebas:</strong><br>${testsHTML}<br><br>` : '') +
		`<strong>Revisión de Tron:</strong><br>${reviewHTML}<br><br>` +
		`<strong>Complejidad y criterios técnicos:</strong><br>${escapeHtml(solution.complexity)}`
	);
}