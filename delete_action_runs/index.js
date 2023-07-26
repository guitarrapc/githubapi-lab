const { Octokit } = require("@octokit/rest");
const token = "YOUR_GITHUB_PAT" // need workflow permission
const octokit = new Octokit({
    auth: token,
});

const owner = "NAME_OR_ORG";
const repo = "REPO_NAME";
const workflowId = "WORKFLOW_ID";
let done = false;

(async () => {
    // list your workflow ids
    const workflows = await octokit.rest.actions.listRepoWorkflows({
        owner: owner,
        repo: repo,
    });
    for (const item of workflows.data.workflows) {
        console.log(item)
    }

    do {
        // get runs. octokit.paginate.iterator() won't work...
        console.log(`Querying runs for workflowId: ${workflowId}.`);
        const runs = await octokit.rest.actions.listWorkflowRuns({
            owner: owner,
            repo: repo,
            workflow_id: workflowId,
            per_page: 100,
        });

        // delete run_ids.
        console.log(`There are total ${runs.data.total_count} runs.`)
        if (runs.data.total_count != 0) {
            console.log(`deleting runs for .`)
            for (const item of runs.data.workflow_runs) {
                console.log(`deleting ${item.id}.`)
                await octokit.rest.actions.deleteWorkflowRun({
                    owner: owner,
                    repo: repo,
                    run_id: item.id,
                });
            }
        }

        done = runs.data.total_count == 0;
    } while (!done)

    console.log(`Complete.`);
})();
