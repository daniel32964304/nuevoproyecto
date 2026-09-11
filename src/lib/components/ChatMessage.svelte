<script lang="ts">
	import type { Message } from '$lib/chat';

	interface Props {
		message: Message;
	}

	let { message }: Props = $props();
</script>

<div class="message {message.role === 'user' ? 'user-msg' : 'bot-msg'}">
	{@html message.html}
</div>

<style>
	.message {
		max-width: 80%;
		padding: 14px 18px;
		border-radius: 12px;
		font-size: 0.92rem;
		line-height: 1.5;
	}

	.user-msg {
		background: var(--accent-blue);
		color: white;
		align-self: flex-end;
		border-bottom-right-radius: 2px;
	}

	.bot-msg {
		background: white;
		color: var(--text-main);
		align-self: flex-start;
		border-bottom-left-radius: 2px;
		border: 1px solid var(--border-color);
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.02);
		width: 100%;
		max-width: 100%;
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