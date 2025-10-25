<script lang="ts">
	interface Props {
		currentPage: number;
		totalPages: number;
		onPageChange: (page: number) => void;
		maxVisiblePages?: number;
		showPreviousNext?: boolean;
		scrollToTop?: boolean;
	}
	
	let {
		currentPage = 1,
		totalPages = 1,
		onPageChange,
		maxVisiblePages = 5,
		showPreviousNext = true,
		scrollToTop = true
	}: Props = $props();
	
	function handlePageChange(page: number) {
		if (page < 1 || page > totalPages || page === currentPage) {
			return;
		}
		
		onPageChange(page);
		
		if (scrollToTop && typeof window !== 'undefined') {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}
	
	// Calculate which page numbers to show
	let visiblePages = $derived.by(() => {
		const pages: number[] = [];
		const halfVisible = Math.floor(maxVisiblePages / 2);
		
		let startPage = Math.max(1, currentPage - halfVisible);
		let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
		
		// Adjust start page if we're near the end
		if (endPage - startPage < maxVisiblePages - 1) {
			startPage = Math.max(1, endPage - maxVisiblePages + 1);
		}
		
		for (let i = startPage; i <= endPage; i++) {
			pages.push(i);
		}
		
		return pages;
	});
</script>

{#if totalPages > 1}
	<div class="pagination">
		<!-- Previous Button -->
		{#if showPreviousNext}
			<button
				onclick={() => handlePageChange(currentPage - 1)}
				disabled={currentPage === 1}
				class="pagination-button pagination-button--nav"
				class:pagination-button--disabled={currentPage === 1}
				aria-label="Previous page"
			>
				Previous
			</button>
		{/if}
		
		<!-- Page Numbers -->
		<div class="pagination-pages">
			{#each visiblePages as pageNum}
				<button
					onclick={() => handlePageChange(pageNum)}
					class="pagination-button pagination-button--page"
					class:pagination-button--active={pageNum === currentPage}
					aria-label="Page {pageNum}"
					aria-current={pageNum === currentPage ? 'page' : undefined}
				>
					{pageNum}
				</button>
			{/each}
		</div>
		
		<!-- Next Button -->
		{#if showPreviousNext}
			<button
				onclick={() => handlePageChange(currentPage + 1)}
				disabled={currentPage === totalPages}
				class="pagination-button pagination-button--nav"
				class:pagination-button--disabled={currentPage === totalPages}
				aria-label="Next page"
			>
				Next
			</button>
		{/if}
	</div>
{/if}

<style>
	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 2rem;
	}
	
	.pagination-pages {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	
	.pagination-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: 0.5rem;
		transition: all 0.2s ease;
		border: 1px solid var(--border-primary);
		background: var(--bg-primary);
		color: var(--text-primary);
		box-sizing: border-box;
	}
	
	.pagination-button:not(:disabled) {
		cursor: pointer;
	}
	
	.pagination-button:not(:disabled):hover {
		background: var(--bg-secondary);
		border-color: var(--color-primary-300);
	}
	
	.pagination-button--nav {
		padding: 0.5rem 1rem;
		height: 2.5rem;
	}
	
	.pagination-button--page {
		width: 2.5rem;
		height: 2.5rem;
		padding: 0;
	}
	
	.pagination-button--active {
		background: var(--color-primary-500);
		color: white;
		border-color: var(--color-primary-500);
	}
	
	.pagination-button--active:hover {
		background: var(--color-primary-600);
		border-color: var(--color-primary-600);
	}
	
	.pagination-button--disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.pagination-button--disabled:hover {
		background: var(--bg-primary);
		border-color: var(--border-primary);
	}
	
	/* Responsive */
	@media (max-width: 640px) {
		.pagination {
			gap: 0.375rem;
		}
		
		.pagination-pages {
			gap: 0.125rem;
		}
		
		.pagination-button--nav {
			padding: 0.5rem 0.75rem;
			font-size: 0.8125rem;
		}
		
		.pagination-button--page {
			width: 2.25rem;
			height: 2.25rem;
			font-size: 0.8125rem;
		}
	}
</style>

