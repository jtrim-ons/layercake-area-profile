<script>
	import { getContext } from 'svelte';
	import { scaleBand } from 'd3-scale';

	const { data, xGet, yGet, xScale, yScale } = getContext('LayerCake');
	
  const halfReferenceLineWidth = 1;
</script>

<g class="bar-group">
	{#each $data as d, i}
	<g class="bar-group"
	 		transform="translate(0,{$yGet(d)})">
		{#each $data.keys as key, j}
      {#if key==="LA"}
        <rect
          class='group-rect'
          x="{$xScale.range()[0]}"
          y="{0}"
          height={$yScale.bandwidth()}
          width="{$xScale(d[key])}"
          fill="{$data.colours[j]}"
        ></rect>
      {/if}
      {#if key!=="LA"}
        <rect
          class='group-rect'
          x="{$xScale(d[key]) - halfReferenceLineWidth}"
          y="{0}"
          height={$yScale.bandwidth()}
          width="{halfReferenceLineWidth * 2}"
          fill="{$data.colours[j]}"
        ></rect>
      {/if}
		{/each}
	</g>
	{/each}
</g>
