<script>
  import { LayerCake, Svg, uniques } from 'layercake';
  import { scaleBand } from 'd3-scale';
  import { json } from 'd3';
  import usernameColonPassword from './usernameColonPassword.js';

  import Bar from './components/Bar.svelte';
  import AxisX from './components/AxisX.svelte';
  import AxisY from './components/AxisY.svelte';

  // This example loads csv data as json using @rollup/plugin-dsv
  import data from './data/groups.csv';

  import raw_census_data from './data/census-data-simplified.csv';

  const xKey = 'value';
  const yKey = 'year';

  const censusXKey = 'OBS_VALUE';
  const censusYKey = 'CELL_NAME';

  data.forEach(d => {
    d[xKey] = +d[xKey];
  });

  let census_data = raw_census_data
        .filter(d => d.MEASURES == 20301)   // percentages, not counts
        .filter(d => d.OBS_STATUS == 'A')
        .filter(d => d.CELL_NAME != "All usual residents");
  census_data.forEach(d => {d.OBS_VALUE = +d.OBS_VALUE})
  console.log(census_data);

  let cell_names = uniques(census_data, 'CELL_NAME');

  //let places = ['Harrogate', 'North Yorkshire', 'Yorkshire and The Humber', 'England'];

  // https://observablehq.com/@mikejamesthompson/cantabular-helpers-for-1911-irish-census-data
  async function queryCantabularGraphQL(url, query, variables) {
    return await json(url, {
        body: JSON.stringify({
          "query": query,
          "variables": variables,
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + btoa(usernameColonPassword)
        },
        method: "POST",
        mode: "cors"
      });
  }
  
  let CANTABULAR_ENDPOINT = "https://ftb-api-ext.ons.sensiblecode.io/graphql";

  function queryPart(name, extraVariable) {
    return `      ${name}: table(
        variables: [$geoType${extraVariable.length ? ', "'+extraVariable+'"' : ''}],
        filters: [{variable: $geoType, codes: $geoCode}]
      )
      { ...tableDimensions values }`
  }

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

  const query = `
  query AreaProfileData($geoType: String!, $geoCode: [String!]!) {
    residents: dataset(name:"Usual-Residents") {
${residentQueryParts.map(d => queryPart(d[0], d[1])).join("\n")}
    }
    households: dataset(name:"Household-Ref-Persons") {
${householdQueryParts.map(d => queryPart(d[0], d[1])).join("\n")}
    }
  }

  fragment tableDimensions on Table {
    dimensions {
      count
      categories {
        code
        label
      }
      variable {
        name
        label
      }
    }
  }
  `;

  console.log(query);

  const _places = [
    { "geoType": "LA", "geoCode": ["synE07000165"] },
    { "geoType": "REGION", "geoCode": ["synE12000003"] },
    { "geoType": "COUNTRY", "geoCode": ["synE92000001"] }
  ]

  let ftbData_ = Promise.all(_places.map(place => queryCantabularGraphQL(CANTABULAR_ENDPOINT, query, place)));

  let ftbData = queryCantabularGraphQL(CANTABULAR_ENDPOINT, query, _places[0])
    .then(console.log);

  function formatDatasetForChart(dataset) {
    let categories = dataset.dimensions[1].categories;
    let values = dataset.values;
    let total = dataset.values.reduce((a,b)=>a+b, 0);
    return values.map((d, i) => ({
      value: d / total,
      label: categories[i].label
    }));
  }
</script>

<style>
  :global(body) {
    background-color: #ededef;
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
  @media only screen and (min-width: 30em) {
    .chart-tile {
      width: 50%;
    }
  }

  @media only screen and (min-width: 50em) {
    .chart-tile {
      width: 33%;
    }
  }
  .chart-container {
	display: block;
    height: 200px;
  }
  h4 {
    font-size: 14px;
  }
</style>

  <div class="container">
    <h1>Census area profile: Harrogate</h1>
  </div>

  {#await ftbData_}
  {:then data}
  {#each residentQueryParts.slice(1) as part}
  <div class="container">
    <div class="charts-box">
      <div class="charts-box-title"><h3>{part[0]}</h3></div>
      <div class="charts-container">
        {#each _places as place, placeIndex}
        <div class="chart-tile">
          <div class="chart-container">
            <div><h4>{data[placeIndex].data.residents.Age.dimensions[0].categories[0].label}</h4></div>
            <LayerCake
              padding={{ top: 0, bottom: 20, left: 100 }}
              x={"value"}
              y={"label"}
              yScale={scaleBand().paddingInner([0.05]).round(true)}
              yDomain={formatDatasetForChart(data[placeIndex].data.residents[part[0]]).map(d=>d.label).reverse()}
              xDomain={[0, Math.max(...formatDatasetForChart(data[placeIndex].data.residents[part[0]]).map(d=>d.value))]}
              data={formatDatasetForChart(data[placeIndex].data.residents[part[0]])}
            >
              <Svg>
                <AxisX
                  gridlines={true}
                  baseline={true}
                  snapTicks={false}
                />
                <AxisY
                  gridlines={false}
                />
                <Bar/>
              </Svg>
            </LayerCake>
          </div>
        </div>
        {/each}
      </div>
    </div>
  </div>
  {/each}
  {/await}
