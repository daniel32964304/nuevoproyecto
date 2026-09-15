<script lang="ts">
	interface Props {
		onStart: () => void;
	}

	let { onStart }: Props = $props();
</script>

<div id="landing-screen">
	<h1>TRON // Core Engine</h1>
	<p>
		Bienvenido al sistema inteligente de desarrollo y arquitectura lógica. Describa sus
		requerimientos y genere automáticamente algoritmos y código estructurado de nivel
		profesional.
	</p>
	<button class="btn-primary" onclick={onStart}>Iniciar Sistema</button>
	<details class="question-guide">
		<summary>Ver ejemplos de preguntas para Tron</summary>
		<div class="guide-grid">
			<section>
				<h3>Conversación general</h3>
				<p>¿Cómo estás?</p><p>¿Quién eres?</p><p>¿Qué puedes hacer?</p><p>¿Puedes ayudarme?</p><p>¿Qué opinas de esta idea?</p><p>¿Me puedes explicar algo?</p><p>¿Puedes resumir esto?</p><p>¿Puedes organizar mis ideas?</p>
			</section>
			<section>
				<h3>Dudas y aprendizaje</h3>
				<p>¿Qué significa este concepto?</p><p>¿Por qué ocurre esto?</p><p>¿Cómo funciona?</p><p>¿Cuál es la diferencia?</p><p>¿Puedes explicarlo de forma sencilla?</p><p>¿Puedes darme un ejemplo?</p><p>¿Qué errores debo evitar?</p><p>¿Cómo puedo aprenderlo?</p>
			</section>
			<section>
				<h3>Programación</h3>
				<p>Crea un algoritmo para ordenar una lista.</p><p>¿Cómo valido una entrada?</p><p>¿Qué lenguaje me conviene?</p><p>Corrige este error de código.</p><p>¿Cómo optimizo esta función?</p><p>¿Qué complejidad tiene?</p><p>Genera pruebas unitarias.</p><p>Convierte este código a Python.</p>
			</section>
			<section>
				<h3>Proyectos y decisiones</h3>
				<p>Ayúdame a planificar mi proyecto.</p><p>¿Qué arquitectura me conviene?</p><p>Compara estas dos opciones.</p><p>¿Cómo divido esta tarea?</p><p>¿Qué requisitos me faltan?</p><p>Hazme un plan paso a paso.</p><p>Revisa los riesgos.</p><p>¿Cómo puedo mejorar esta idea?</p>
			</section>
			<section>
				<h3>Seguridad y calidad</h3>
				<p>¿Cómo protejo las contraseñas?</p><p>¿Qué vulnerabilidades puede tener?</p><p>¿Cómo valido los datos?</p><p>¿Qué pasa si el servidor falla?</p><p>¿Cómo manejo errores?</p><p>Revisa la seguridad de este diseño.</p><p>¿Cómo evito datos duplicados?</p><p>¿Qué casos límite debo probar?</p>
			</section>
			<section>
				<h3>Memoria de Tron</h3>
				<p>Me llamo Daniel.</p><p>Recuerda que uso TypeScript.</p><p>Ten presente que soy principiante.</p><p>¿Qué recuerdas de mí?</p><p>Olvida mi nombre.</p><p>Borra tu memoria.</p><p>Actualiza mi proyecto.</p><p>¿Qué hemos decidido?</p>
			</section>
		</div>
	</details>
</div>

<style>
	#landing-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		background: var(--card-bg);
		padding: 56px;
		border-radius: 12px;
		box-shadow: 0 18px 45px rgba(11, 31, 58, 0.1);
		max-width: 600px;
		width: 90%;
		border: 1px solid var(--border-color);
	}

	#landing-screen h1 {
		font-size: 2.1rem;
		color: var(--accent-blue);
		margin-bottom: 10px;
		letter-spacing: 0;
	}

	#landing-screen p {
		color: var(--text-muted);
		font-size: 1.05rem;
		margin-bottom: 30px;
		line-height: 1.6;
	}

	.btn-primary {
		background: var(--accent-blue);
		color: white;
		border: none;
		padding: 14px 32px;
		font-size: 1rem;
		font-weight: 600;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 5px 14px rgba(11, 31, 58, 0.18);
	}

	.btn-primary:hover {
		background: #173761;
		transform: translateY(-1px);
		box-shadow: 0 7px 18px rgba(11, 31, 58, 0.22);
	}

	.question-guide {
		width: min(700px, 100%);
		margin-top: 25px;
		text-align: left;
		border-top: 1px solid var(--border-color);
		padding-top: 16px;
	}

	.question-guide summary {
		color: var(--accent-blue);
		font-size: 0.84rem;
		font-weight: 700;
		cursor: pointer;
		text-align: center;
	}

	.guide-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
		margin-top: 18px;
		max-height: 280px;
		overflow-y: auto;
		padding-right: 6px;
	}

	.guide-grid section {
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: 13px;
		background: var(--soft-blue);
	}

	.guide-grid h3 { color: var(--accent-blue); font-size: 0.78rem; margin: 0 0 9px; }
	.guide-grid p { color: var(--text-muted); font-size: 0.72rem; line-height: 1.35; margin: 5px 0; }

	@media (max-width: 600px) {
		#landing-screen { padding: 34px 22px; }
		.guide-grid { grid-template-columns: 1fr; max-height: 300px; }
	}
</style>