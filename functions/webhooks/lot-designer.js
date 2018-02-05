const Rx = require('rxjs');
const currentWeekNumber = require('current-week-number');

const jiraClient = require('../jira-rest-client/jira-client');


exports.designLotNumber = (issueKey, onSuccess, onError) => {    
    console.log(`WEBHOOK.designLotNumber(${issueKey})`);
    jiraClient.setup();
    const issue$ = jiraClient.findIssue(issueKey);

    const users$ = jiraClient.findAllOrganizations()
        .mergeMap((organization) => {
            return jiraClient.findAllOrganizationUsers(organization.id)
                .map(user => {
                    user.organizationName = organization.name;
                    return user;
                })
        });

    Rx.Observable.combineLatest(issue$, users$)
        .first(([issue, user]) => user.key === issue.fields.creator.key)
        .subscribe(([issue, user]) => {
            const date = new Date();
            let orgAbrv = user.organizationName.match(/\((.*?)\)/);
            orgAbrv = orgAbrv ? orgAbrv[1] : "???";
            const lot = `${orgAbrv}-${date.getFullYear().toString().substr(-2)}${("0" + currentWeekNumber()).slice(-2)}-${date.getDay()}`;
            jiraClient.setIssueLote(issue.key, lot, onSuccess, onError);
        },
        (error) => onError(error),
        () => {
            console.log('complete')
        });
}