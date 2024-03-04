import "https://deno.land/std@0.218.2/dotenv/load.ts";
import { gql, GraphQLClient } from "https://deno.land/x/graphql_request/mod.ts";
import { stringify } from "npm:yaml";
import fm from "npm:front-matter";

const warningGen = (link) =>
  `# ----
#
# THIS FILE IS GENERATED, PLEASE DO NOT EDIT!
#
# EDIT GITHUB PROJECT/ISSUES INSTEAD:
# ${link}
#
# ----\n`;

async function syncResearch() {
  const statuses = {
    "Live": "live",
    "Todo": "todo",
    "Done": "done",
  };

  const client = new GraphQLClient("https://api.github.com/graphql", {
    headers: {
      authorization: `bearer ${Deno.env.get("GITHUB_TOKEN")}`,
    },
  });

  const query = gql`
query {
  organization(login:"web3privacy") {
    projectV2(number: 13) {
      title
      items(first: 100, orderBy: {direction: ASC, field: POSITION} ) {
        nodes {
          id
					fieldValueByName(name: "Status") {
						... on ProjectV2ItemFieldSingleSelectValue {
							name
						}
					}
          content {
            ... on Issue {
							number
							repository {
								
								name
							}
              title
							body
              bodyText
              state
              assignees(first:20) {
                nodes {
                  login
                }
              }
							labels(first: 20) {
								nodes {
									name
								}
							}
            }
          }
        }
      }
    }
  }
}
    `;

  const arr = [];
  const data = await client.request(query);
  let counts = {};
  for (const item of data.organization.projectV2.items.nodes) {
    const c = item.content;
    if (!c.repository || c.repository.name !== "jobs") {
      continue;
    }
    if (!item.fieldValueByName) {
      // skip issues without status
      continue;
    }

    const status = statuses[item.fieldValueByName.name];
    if (!counts[status]) {
      counts[status] = 0;
    }

    const rfm = fm(c.body);
    const attrs = rfm.attributes;

    arr.push({
      issue: c.number,
      title: c.title,
      //state: c.state,
      status,
      sort: counts[status],
      //repo: c.repository?.name,
      labels: c.labels?.nodes.map((n) => n.name),
      assignees: c.assignees?.nodes.map((n) => n.login),
      caption: attrs.caption,
      description: attrs.description,
      links: {
        web: attrs.link,
        docs: attrs.docs,
      },
      //body: c.body,
    });
    counts[status]++;
  }

  const outArr = arr.sort((x, y) => x.issue > y.issue ? 1 : -1);
  const outText =
    warningGen("https://github.com/orgs/web3privacy/projects/13") +
    stringify(outArr);

  const fn = "./data/jobs.yaml";
  await Deno.writeTextFile(fn, outText);
  console.log(`File written: ${fn}`);
}

await syncResearch();
