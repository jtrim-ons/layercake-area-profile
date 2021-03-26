<script>
  import { LayerCake, Svg, Html } from 'layercake';
  import { scaleBand } from 'd3-scale';
  import { queryCantabularGraphQL } from './ftbUtils.js';

  import Bar from './components/Bar.svelte';
  import AxisX from './components/AxisX.svelte';
  import AxisY from './components/AxisY.svelte';

	import GroupedBar from './GroupedBar.svelte';
	import BarWithReferenceLines from './BarWithReferenceLines.svelte';
  import Key from './Key.svelte';

  let colours = ['#2b8cbe', '#a6bddb', '#ece7f2'];
  let coloursWitReferenceLine = ['#a6cee3','#d95f02','#e6ab02'];

	const xMaxFn = data => Math.max(...data.map(d => Math.max(...data.keys.map(k => d[k]))));

	const lads = [
    {name:"Barnsley",code:"synE08000016"},
    {name:"Bradford",code:"synE08000032"},
    {name:"Calderdale",code:"synE08000033"},
    {name:"Craven",code:"synE07000163"},
    {name:"Doncaster",code:"synE08000017"},
    {name:"East Riding of Yorkshire",code:"synE06000011"},
    {name:"Hambleton",code:"synE07000164"},
    {name:"Harrogate",code:"synE07000165"},
    {name:"Kingston upon Hull, City of",code:"synE06000010"},
    {name:"Kirklees",code:"synE08000034"},
    {name:"Leeds",code:"synE08000035"},
    {name:"North East Lincolnshire",code:"synE06000012"},
    {name:"North Lincolnshire",code:"synE06000013"},
    {name:"Richmondshire",code:"synE07000166"},
    {name:"Rotherham",code:"synE08000018"},
    {name:"Ryedale",code:"synE07000167"},
    {name:"Scarborough",code:"synE07000168"},
    {name:"Selby",code:"synE07000169"},
    {name:"Sheffield",code:"synE08000019"},
    {name:"Wakefield",code:"synE08000036"},
    {name:"York",code:"synE06000014"}
  ]

	let selectedLad = lads[0];

  const residentQueryParts = [
    ["Total", ""],
    ["Age", "AGE_T007A"],
    ["Relationship", "MARSTAT_T006A"],
    ["Ethnicity", "ETHPUK11_T006A"],
    ["Birthplace", "COB_R010A"]
  ];
  const householdQueryParts = [
    ["Total", ""],
    ["Composition", "AHCHUK11_R007A"],
    ["Accommodation", "TYPACCOM_T006A"],
    ["Tenure", "TENHUK11_T007B"]
  ];

  async function reshapeData(data, places) {
    data = await data;
    console.log(data);
    let result = {"households":{}, "residents":{}};
    result.places = places.map(d => d.geoCode[0]);
    let placeTypes = places.map(d => d.geoType);

		let placeNameLookup = {};
		placeTypes.forEach((d, i) => {placeNameLookup[d] = data[i].data.residents.Total.dimensions[0].categories[0].label});

		// TODO: avoid duplication in next parts
		let residentTotalsByPlaceType = placeTypes.map((d, i) => data[i].data.residents.Total.values[0]);
    for (let key of residentQueryParts.slice(1).map(d => d[0])) {
      let categories = data[0].data.residents[key].dimensions[1].categories;
      let subData = categories.map(d => ({key: d.label}));
      placeTypes.forEach((d, i) => {subData.forEach((_, j) =>
					{subData[j][d] = data[i].data.residents[key].values[j] / residentTotalsByPlaceType[i];})});
      subData.keys = placeTypes;
			subData.colours = colours;
			subData.name = key;
			subData.placeNameLookup = placeNameLookup;
      result.residents[key] = subData;
    }

		let householdTotalsByPlaceType = placeTypes.map((d, i) => data[i].data.households.Total.values[0]);
    for (let key of householdQueryParts.slice(1).map(d => d[0])) {
      let categories = data[0].data.households[key].dimensions[1].categories;
      let subData = categories.map(d => ({key: d.label}));
      placeTypes.forEach((d, i) => {subData.forEach((_, j) =>
					{subData[j][d] = data[i].data.households[key].values[j] / householdTotalsByPlaceType[i];})});
      subData.keys = placeTypes;
			subData.colours = coloursWitReferenceLine;
			subData.name = key;
			subData.placeNameLookup = placeNameLookup;
      result.households[key] = subData;
    }

    return result;
  }

  let ftbData;

	function setPlace(lad) {
		return () => {
			selectedLad = lad;
			let places = [
				{ "geoType": "LA", "geoCode": [selectedLad.code] },
				{ "geoType": "REGION", "geoCode": ["synE12000003"] },
				{ "geoType": "COUNTRY", "geoCode": ["synE92000001"] }
			]
			ftbData = reshapeData(
					Promise.all(
							places.map(
									place => queryCantabularGraphQL(residentQueryParts, householdQueryParts, place))), places);
		}
	}

	setPlace(selectedLad)();
</script>

<style>
  :global(body) {
    background-color: #ededef;
  }
	h1 {
		color: #222;
		padding-bottom: 3px;
		border-bottom: 3px solid #aaa;
	}
	h2 {
		margin-top: 50px;
		color: #444;
	}
  h3, h4 {
    margin: 10px 0 5px 0;
  }
  .container {
    padding: 0 20px;
  }
  .charts-box {
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 5px;
    box-shadow: 0px 3px 5px #ccc;
    padding: 0 20px;
    margin-bottom: 10px;
  }
  .charts-box-title {
    color: #555;
  }
  .charts-container {
    color: #888;
    margin: 0 auto;
    display: flex;
    flex-wrap: wrap;
    /*justify-content: space-between;*/
    max-width: 70em;
  }
  .chart-tile {
    height: 300px;
    width: 100%;
  }
/*  @media only screen and (min-width: 30em) {
    .chart-tile {
      width: 50%;
    }
  }

  @media only screen and (min-width: 50em) {
    .chart-tile {
      width: 33%;
    }
  } */
  .chart-container {
	  display: block;
    height: 280px;
  }
  h4 {
    font-size: 14px;
  }
	button {
		cursor: pointer;
		padding: 4px;
		margin: 2px;
		background-color: #2b8cbe;
		border: 1px solid white;
		border-radius: 5px;
		color: white;
    box-shadow: 0px 3px 5px #ccc;
	}
	button.selected {
    box-shadow: none;
		background-color: #155a7d;
	}
</style>

  <div class="container">
    <h1>Census area profile: {selectedLad.name}</h1>
  </div>

  <div class="container">
    <h2>Select a local authority district</h2>
		{#each lads as lad}
			<button
					class:selected="{lad===selectedLad}"
					on:click="{setPlace(lad)}">
				{lad.name}
			</button>
		{/each}
  </div>

	{#each [
		{name:"Residents", queryParts: residentQueryParts, key: "residents"},
		{name:"Households", queryParts: householdQueryParts, key: "households"}
	] as section}
  <div class="container">
    <h2>{section.name}</h2>
  </div>

  {#await ftbData}
  <div class="container">
    <p>Fetching data...</p>
  </div>
  {:then data}
  {#each section.queryParts.slice(1).map(d => data[section.key][d[0]]) as data}
  <div class="container">
    <div class="charts-box">
      <div class="charts-box-title"><h3>{data.name}</h3></div>
      <div class="charts-container">
        <div class="chart-tile">
          <div class="chart-container">
          	<LayerCake
          		padding={{ top: 0, bottom: 20, left: 450 }}
          		x={null}
          		y="key"
          		yScale={scaleBand().paddingInner([0.05]).round(true)}
          		yDomain={data.map(d => d.key)}
          		yRange={ ({ width, height }) => [height,height*.1] }
          		xDomain={[0, xMaxFn(data)]}
          		data={data}
          	>
          		<Svg>
          			<AxisX
          				gridlines={true}
          				baseline={true}
          				snapTicks={false}
          				ticks=4
          			/>
          			<AxisY
          				gridlines={false}
          			/>
								{#if section.name==="Residents"}
									<GroupedBar/>
								{/if}
								{#if section.name==="Households"}
									<BarWithReferenceLines/>
								{/if}
          		</Svg>
          		<Html pointerEvents={false}>
                <Key
                  align='end'
                  shape='square'
									showReferenceLines={section.name==="Households"}
									lookup={data.placeNameLookup}
                />
              </Html>
          	</LayerCake>
          </div>
        </div>
      </div>
    </div>
  </div>
  {/each}
  {/await}
  {/each}
