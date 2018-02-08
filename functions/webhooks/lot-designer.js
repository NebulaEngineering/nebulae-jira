const Rx = require('rxjs');
const currentWeekNumber = require('current-week-number');

const jiraClient = require('../jira-rest-client/jira-client');


exports.designLotNumber = (issue, onSuccess, onError) => {
    console.log(`WEBHOOK.designLotNumber(${issue.key})`);
    jiraClient.setup();
    const date = new Date();
    let orgAbrv = issue.fields[jiraClient.JIRA_CUST_FIELD_ORGANIZATION][0].name.match(/\((.*?)\)/);
    orgAbrv = orgAbrv ? orgAbrv[1] : "???";
    const lot = `${orgAbrv}-${date.getFullYear().toString().substr(-2)}${("0" + currentWeekNumber()).slice(-2)}-${date.getDay()}`;    
    const deviceSeries = issue.fields[jiraClient.JIRA_CUST_FIELD_SERIAL].value || "";
    const split = deviceSeries.toLowerCase().split("-") || [""] ;
    const issueLinkVal = jiraClient.JIRA_DEVICEDATA_KEYPREFIX[split[0]] ? `${jiraClient.JIRA_DEVICEDATA_PROJECTCODE}-${jiraClient.JIRA_DEVICEDATA_KEYPREFIX[split[0]] + split[1]}` : undefined;
    jiraClient.doesIssueExists(issueLinkVal).subscribe(
        (deviceExists) => {
            jiraClient.setIssueLoteAndDeviceIssueLink(
                issue.key,
                lot,
                deviceExists ? issueLinkVal : undefined,
                onSuccess,
                onError);
        }
    );


}