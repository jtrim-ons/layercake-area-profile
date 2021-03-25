<script>
	import { getContext } from 'svelte';
	import { scaleBand } from 'd3-scale';

	const { data, xGet, yGet, xScale, yScale } = getContext('LayerCake');
	
	let y1;
	$: y1 = scaleBand()
			.domain($data.keys)
			.rangeRound([0, $yScale.bandwidth()])
			.padding(0.1);
</script>

<g class="bar-group">
	{#each $data as d, i}
	<g class="bar-group"
	 		transform="translate(0,{$yGet(d)})">
		{#each $data.keys as key, j}
		<rect
			class='group-rect'
			x="{$xScale.range()[0]}"
			y="{y1(key)}"
			height={y1.bandwidth()}
			width="{$xScale(d[key])}"
			fill="{$data.colours[j]}"
		></rect>
		{/each}
	</g>
	{/each}
</g>
