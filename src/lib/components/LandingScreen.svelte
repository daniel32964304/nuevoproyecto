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
</div>

<style>
	#landing-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		background: var(--card-bg);
		padding: 50px;
		border-radius: 16px;
		box-shadow:
			0 10px 25px -5px rgba(0, 0, 0, 0.05),
			0 8px 10px -6px rgba(0, 0, 0, 0.05);
		max-width: 600px;
		width: 90%;
		border: 1px solid var(--border-color);
	}

	#landing-screen h1 {
		font-size: 2.2rem;
		color: var(--accent-blue);
		margin-bottom: 10px;
		letter-spacing: -0.5px;
	}

	#landing-screen p {
		color: var(--text-muted);
		font-size: 1.05rem;
		margin-bottom: 30px;
		line-height: 1.6;
	}

	.btn-primary {
		background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan));
		color: white;
		border: none;
		padding: 14px 32px;
		font-size: 1rem;
		font-weight: 600;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
	}
</style>