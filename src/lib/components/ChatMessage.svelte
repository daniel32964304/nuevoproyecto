<script lang="ts">
	import type { Message } from '$lib/chat';

	interface Props {
		message: Message;
	}

	let { message }: Props = $props();
</script>

<div class="message-row {message.role === 'user' ? 'user-row' : 'bot-row'}">
	{#if message.role === 'bot'}
		<div class="avatar bot-avatar" aria-label="Tron">
			<span class="robot-antenna"></span>
			<span class="robot-face"><i></i><i></i></span>
		</div>
	{/if}
	<div class="message {message.role === 'user' ? 'user-msg' : 'bot-msg'}">
		{@html message.html}
	</div>
	{#if message.role === 'user'}
		<div class="avatar user-avatar">U</div>
	{/if}
</div>

<style>
	.message {
		max-width: calc(100% - 42px);
		padding: 2px 0;
		font-size: 0.92rem;
		line-height: 1.5;
	}
	.message-row { display: flex; align-items: flex-start; gap: 12px; width: 100%; }
	.user-row { justify-content: flex-end; }
	.avatar { flex: 0 0 30px; width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; font-size: 0.75rem; font-weight: 800; }
	.bot-avatar { position: relative; background: var(--accent-blue); }
	.robot-antenna { position: absolute; top: 4px; width: 7px; height: 4px; border-top: 1px solid white; }
	.robot-antenna::before { content: ''; position: absolute; width: 3px; height: 3px; border-radius: 50%; background: white; top: -5px; left: 2px; }
	.robot-face { position: absolute; top: 11px; width: 18px; height: 13px; border: 1.5px solid white; border-radius: 4px; display: flex; justify-content: space-evenly; align-items: center; }
	.robot-face i { width: 3px; height: 3px; border-radius: 50%; background: white; }
	.user-avatar { color: var(--accent-blue); background: #dbeafe; order: 2; }

	.user-msg {
		background: var(--soft-blue);
		color: var(--accent-blue);
		padding: 11px 15px;
		border: 1px solid #dce5f1;
		border-radius: 12px 12px 3px 12px;
		max-width: min(620px, calc(100% - 42px));
	}

	.bot-msg {
		background: white;
		color: var(--text-main);
		padding: 18px 20px;
		border: 1px solid #e2e8f0;
		border-radius: 3px 12px 12px 12px;
		width: min(100%, 680px);
		box-shadow: 0 5px 16px rgba(11, 31, 58, 0.05);
	}

	:global(.code-container) {
		background: var(--code-bg);
		color: var(--code-text);
		padding: 15px;
		border-radius: 8px;
		font-family: 'Courier New', Courier, monospace;
		margin-top: 12px;
		overflow-x: auto;
		font-size: 0.88rem;
		border-left: 4px solid var(--accent-cyan);
	}
</style>