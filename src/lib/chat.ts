export interface Message {
	id: number;
	role: 'user' | 'bot';
	html: string;
}

export const initialBotMessage: Message = {
	id: 0,
	role: 'bot',
	html: `<strong>[TRON SYSTEM]:</strong> Módulo de Inteligencia Activo. Escriba el requerimiento o la solución lógica que desea diseñar (Ej: <em>"Necesito un algoritmo para ordenar una lista"</em> o <em>"Validar credenciales de acceso"</em>).`
};

export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function codeSafe(text: string): string {
	return text.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\$&');
}

export function buildResponse(userText: string): string {
	const textLower = userText.toLowerCase();
	let responseHTML: string;

	if (
		textLower.includes('ordenar') ||
		textLower.includes('lista') ||
		textLower.includes('burbuja')
	) {
		responseHTML =
			`<strong>[TRON AI] Análisis de Requerimiento:</strong> Ordenamiento de Elementos<br><br>` +
			`<strong>1. Estructura Algorítmica (Pseudocódigo):</strong><br>` +
			`• Inicio del proceso.<br>` +
			`• Recibir el arreglo desordenado de datos.<br>` +
			`• Ejecutar iteraciones cruzadas comparando elementos adyacentes.<br>` +
			`• Reasignar posiciones si el elemento actual supera al siguiente.<br>` +
			`• Retornar vector optimizado y ordenado.<br>` +
			`• Fin.<br><br>` +
			`<strong>2. Código Fuente Ejecutable (JavaScript):</strong>` +
			`<div class="code-container">function ordenarArreglo(arr) {<br>&nbsp;&nbsp;let n = arr.length;<br>&nbsp;&nbsp;for (let i = 0; i &lt; n - 1; i++) {<br>&nbsp;&nbsp;&nbsp;&nbsp;for (let j = 0; j &lt; n - i - 1; j++) {<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if (arr[j] &gt; arr[j + 1]) {<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;let temp = arr[j];<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;arr[j] = arr[j + 1];<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;arr[j + 1] = temp;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;}<br>&nbsp;&nbsp;return arr;<br>}</div>`;
	} else if (
		textLower.includes('login') ||
		textLower.includes('usuario') ||
		textLower.includes('contraseña') ||
		textLower.includes('acceso')
	) {
		responseHTML =
			`<strong>[TRON AI] Análisis de Requerimiento:</strong> Control de Acceso y Seguridad<br><br>` +
			`<strong>1. Estructura Algorítmica (Pseudocódigo):</strong><br>` +
			`• Inicio del protocolo.<br>` +
			`• Capturar credenciales ingresadas por el usuario.<br>` +
			`• Validar parámetros contra la base de datos central.<br>` +
			`• Si los datos coinciden: Otorgar token de sesión. Si fallan: Bloquear temporalmente.<br>` +
			`• Fin.<br><br>` +
			`<strong>2. Código Fuente Ejecutable (JavaScript):</strong>` +
			`<div class="code-container">function verificarAcceso(usuario, password) {<br>&nbsp;&nbsp;const dbUser = "administrador";<br>&nbsp;&nbsp;const dbPass = "tron_2026*";<br>&nbsp;&nbsp;if (usuario === dbUser &amp;&amp; password === dbPass) {<br>&nbsp;&nbsp;&nbsp;&nbsp;return { status: true, mensaje: "Acceso concedido al núcleo." };<br>&nbsp;&nbsp;}<br>&nbsp;&nbsp;return { status: false, mensaje: "Credenciales incorrectas." };<br>}</div>`;
	} else if (
		textLower.includes('factorial') ||
		textLower.includes('matemática') ||
		textLower.includes('calcular')
	) {
		responseHTML =
			`<strong>[TRON AI] Análisis de Requerimiento:</strong> Cálculo Matemático Avanzado<br><br>` +
			`<strong>1. Estructura Algorítmica (Pseudocódigo):</strong><br>` +
			`• Inicio del algoritmo.<br>` +
			`• Validar que el número de entrada sea positivo.<br>` +
			`• Inicializar variable acumuladora en 1.<br>` +
			`• Multiplicar de forma iterativa descendente hasta completar la secuencia.<br>` +
			`• Retornar resultado numérico final.<br>` +
			`• Fin.<br><br>` +
			`<strong>2. Código Fuente Ejecutable (JavaScript):</strong>` +
			`<div class="code-container">function calcularFactorial(n) {<br>&nbsp;&nbsp;if (n &lt; 0) return "No existe factorial negativo";<br>&nbsp;&nbsp;let resultado = 1;<br>&nbsp;&nbsp;for (let i = 2; i &lt;= n; i++) {<br>&nbsp;&nbsp;&nbsp;&nbsp;resultado *= i;<br>&nbsp;&nbsp;}<br>&nbsp;&nbsp;return resultado;<br>}</div>`;
	} else {
		const safe = codeSafe(userText);
		responseHTML =
			`<strong>[TRON AI] Análisis de Requerimiento:</strong> "${escapeHtml(userText.toUpperCase())}"<br><br>` +
			`<strong>1. Estructura Algorítmica (Pseudocódigo):</strong><br>` +
			`• Paso 1: Inicializar los parámetros globales y capturar datos de entrada.<br>` +
			`• Paso 2: Procesar la lógica condicional adaptada al requerimiento específico.<br>` +
			`• Paso 3: Optimizar rendimiento mediante estructuras de control secundarias.<br>` +
			`• Paso 4: Devolver resultados depurados al sistema principal.<br>` +
			`• Fin del proceso.<br><br>` +
			`<strong>2. Código Fuente Ejecutable (JavaScript):</strong>` +
			`<div class="code-container">function procesarModuloTron() {<br>&nbsp;&nbsp;console.log("Ejecutando proceso: ${safe}");<br>&nbsp;&nbsp;// Bloque operativo optimizado por Tron AI<br>&nbsp;&nbsp;let estadoOperativo = "Exitoso";<br>&nbsp;&nbsp;return estadoOperativo;<br>}<br>procesarModuloTron();</div>`;
	}

	return responseHTML;
}