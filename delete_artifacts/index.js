const { Octokit } = require("@octokit/rest");

// legacy token - required permission: `repo` and `workflow`.
// fine-grained token - required permission: Workflows `Read and write` & Actions 'read and write'
const token = "YOUR_GITHUB_PAT"
const owner = "NAME_OR_ORG";
const repo = "REPO_NAME";
const workflowId = "WORKFLOW_FILE_NAME.yaml";
const dryRun = false; // true: dryrun, false: delete

const octokit = new Octokit({
    auth: token,
});

(async () => {
    // list your workflow ids
    const workflows = await octokit.rest.actions.listRepoWorkflows({
        owner: owner,
        repo: repo,
        per_page: 100,
    });
    for (const item of workflows.data.workflows) {
        console.log(item)
    }

    let done = false;
    let page = 1;
    do {
        // get runs. octokit.paginate.iterator() won't work...
        console.log(`Querying runs for workflowId: ${workflowId}.`);
        const runs = await octokit.rest.actions.listWorkflowRuns({
            owner: owner,
            repo: repo,
            workflow_id: workflowId,
            per_page: 100,
            page: page,
        });

        console.log(`There are total ${runs.data.total_count} runs.`)
        if (runs.data.total_count == 0) {
            break;
        }

        // delete artifact_ids.
        for (const item of runs.data.workflow_runs) {
            const artifacts = await octokit.rest.actions.listWorkflowRunArtifacts({
                owner: owner,
                repo: repo,
                run_id: item.id,
            });

            for (const artifact of artifacts.data.artifacts) {
                console.log(`${dryRun ? '(dryrun) ' : ''}deleting artifact for artifactName(Id): '${artifact.name}' (${artifact.id}), size: ${Math.floor(artifact.size_in_bytes / 1024)}KB, runName(Id): '${item.name}'(${item.id}).`)
                if (dryRun) {
                    continue;
                }
                await octokit.rest.actions.deleteArtifact({
                    owner: owner,
                    repo: repo,
                    artifact_id: artifact.id,
                });
            }
        }

        done = runs.data.workflow_runs < 100; // 100 is max per_page. if less than 100, it's last page.
        page++;
    } while (!done)

    console.log(`Complete.`);
})();
