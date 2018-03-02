const Rx = require('rxjs');
const currentWeekNumber = require('current-week-number');

const jiraClient = require('../jira-rest-client/jira-client');


exports.cipherHours = (issue, onSuccess, onError) => {
    console.log(`WEBHOOK.cipherHours(${issue.key})`);
    jiraClient.setup();
    let hours = issue.fields[jiraClient.JIRA_CUST_FIELD_HOURS] || 0;

    jiraClient.cipherHourField(
        issue.key,
        hours,
        onSuccess,
        onError);
}

exports.decipherHours = (issue, onSuccess, onError) => {
    console.log(`WEBHOOK.decipherHours(${issue.key})`);
    jiraClient.setup();
    let hoursenc = issue.fields[jiraClient.JIRA_CUST_FIELD_HOURS_ENC];

    jiraClient.decipherHourField(
        issue.key,
        hoursenc,
        onSuccess,
        onError);
}