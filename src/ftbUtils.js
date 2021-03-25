import { json } from 'd3';
import usernameColonPassword from './usernameColonPassword.js';

const CANTABULAR_ENDPOINT = "https://ftb-api-ext.ons.sensiblecode.io/graphql";

function queryPart(name, extraVariable) {
  return `      ${name}: table(
      variables: [$geoType${extraVariable.length ? ', "'+extraVariable+'"' : ''}],
      filters: [{variable: $geoType, codes: $geoCode}]
    )
    { ...tableDimensions values }`
}

let query = (residentQueryParts, householdQueryParts) => `
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

// Based on https://observablehq.com/@mikejamesthompson/cantabular-helpers-for-1911-irish-census-data
async function queryCantabularGraphQL(residentQueryParts, householdQueryParts, variables) {
return await json(CANTABULAR_ENDPOINT, {
body: JSON.stringify({
  "query": query(residentQueryParts, householdQueryParts),
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

export { queryCantabularGraphQL };
