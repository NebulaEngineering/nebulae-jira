const functions = require('firebase-functions');
const Rx = require('rxjs');
const Observable = require('rxjs/Observable');
const Client = require('node-rest-client').Client;


let JIRA_REST_SERVER;
let JIRA_USER;
let JIRA_PSW;
let JIRA_CUST_FIELD_LOTE;
let JIRA_CUST_FIELD_SERIAL;
let JIRA_CUST_FIELD_ORGANIZATION;
let JIRA_DEVICEDATA_KEYPREFIX;
let JIRA_DEVICEDATA_PROJECTCODE;

// configure basic http auth for every request 
let options;
let client;

exports.setup = () => {

    JIRA_REST_SERVER = functions.config().jira.rest.server;
    JIRA_USER = functions.config().jira.rest.user;
    JIRA_PSW = functions.config().jira.rest.password;
    JIRA_CUST_FIELD_LOTE = functions.config().jira.rest.customfield.lote;
    JIRA_CUST_FIELD_SERIAL = functions.config().jira.rest.customfield.serial;
    JIRA_CUST_FIELD_ORGANIZATION = functions.config().jira.rest.customfield.organization;
    JIRA_DEVICEDATA_PROJECTCODE = functions.config().jira.devicedata.projectcode || "";
    JIRA_DEVICEDATA_KEYPREFIX = functions.config().jira.devicedata.keyprefix || "{}";
    exports.JIRA_CUST_FIELD_SERIAL = JIRA_CUST_FIELD_SERIAL;
    exports.JIRA_CUST_FIELD_ORGANIZATION = JIRA_CUST_FIELD_ORGANIZATION;
    exports.JIRA_DEVICEDATA_KEYPREFIX = JIRA_DEVICEDATA_KEYPREFIX;
    exports.JIRA_DEVICEDATA_PROJECTCODE = JIRA_DEVICEDATA_PROJECTCODE;

    options = {
        user: JIRA_USER,
        password: JIRA_PSW
    };
    client = new Client(options);
}

/**
 * Finds an existing issue by its KEY and return an observable
 * @param {*} issueKey issue KEY
 */
exports.findIssue = (issueKey) => {
    return Rx.Observable.create(
        observer => {
            const url = `${JIRA_REST_SERVER}api/2/issue/${issueKey}.json`;
            console.log(`   - JIRA_REST_CLIENT.findIssue(${issueKey}): ${url}`);
            client.get(url, (data, rawRespone) => {
                // parsed response body as js object 
                if (Buffer.isBuffer(data)) {
                    data = JSON.parse(data.toString('utf8'));
                }
                observer.next(data);
                observer.complete();
            }).on('error', (err) => {
                observer.error(err);
                observer.complete();
            });
        }
    );
}

/**
 * Finds an existing issue by its KEY and return an observable
 * @param {*} issueKey issue KEY
 */
exports.doesIssueExists = (issueKey) => {
    return Rx.Observable.create(
        observer => {
            const url = `${JIRA_REST_SERVER}api/2/issue/${issueKey}.json`;
            console.log(`   - JIRA_REST_CLIENT.issuexists(${issueKey}): ${url}`);
            client.get(url, (data, rawRespone) => {
                observer.next(rawRespone.statusCode === 200);
                observer.complete();
            }).on('error', () => {
                observer.next(false);
                observer.complete();
            });
        }
    );
}

/**
 * Finds all existing organizations and return an observable
 */
exports.findAllOrganizations = () => {
    return Rx.Observable.create(
        observer => {
            const url = `${JIRA_REST_SERVER}servicedeskapi/organization.json`;
            console.log(`   - JIRA_REST_CLIENT.findAllOrganization(): ${url}`);
            client.get(url, (data, rawRespone) => {
                // parsed response body as js object 
                if (Buffer.isBuffer(data)) {
                    data = JSON.parse(data.toString('utf8'));
                }
                observer.next(data);
                observer.complete();
            }).on('error', (err) => {
                observer.error(err);
                observer.complete();
            });
        })
        .mergeMap(organization => Rx.Observable.from(organization.values))
}

/**
 * Finds all existing organization users and returns an observable
 * @param {*} organizationId organization ID
 */
exports.findAllOrganizationUsers = (organizationId, response, onError) => {
    return Rx.Observable.create(
        observer => {
            const url = `${JIRA_REST_SERVER}servicedeskapi/organization/${organizationId}/user`;
            console.log(`   - JIRA_REST_CLIENT.findAllOrganizationUsers(${organizationId}): ${url}`);
            client.get(url, (data, rawRespone) => {
                // parsed response body as js object 
                if (Buffer.isBuffer(data)) {
                    data = JSON.parse(data.toString('utf8'));
                }
                observer.next(data);
                observer.complete();
            }).on('error', (err) => {
                observer.error(err);
                observer.complete();
            });
        }
    ).mergeMap(users => Rx.Observable.from(users.values));
}

exports.setIssueLoteAndDeviceIssueLink = (issueKey, lote, deviceIssueLink, onSucces, onError) => {
    // set content-type header and data as json in args parameter 
    const args = {
        data: {
            fields: {
            },
            update: {
                labels: [{
                    add: lote
                }],
                issuelinks: [
                    {
                        add: {
                            type: {
                                "name": "Relates",
                                "inward": "relates to",
                                "outward": "relates to"
                            },
                            outwardIssue: {
                                "key": deviceIssueLink
                            }
                        }
                    }
                ]
            }
        },
        headers: { "Content-Type": "application/json" }
    };

    if(!deviceIssueLink){
        delete args.data.update.issuelinks;
    }
    args.data.fields[JIRA_CUST_FIELD_LOTE] = lote;
    const url = `${JIRA_REST_SERVER}api/2/issue/${issueKey}`;
    console.log(`   - JIRA_REST_CLIENT.setIssueLoteAndDeviceIssueLink(${issueKey},${lote},${deviceIssueLink}): ${url}  args=${JSON.stringify(args)}`);
    client.put(url, args, (data, response) => {
        response.statusCode === 204 ? onSucces(lote) : onError(`url=${url}  args=${JSON.stringify(args)} response= ${response.statusCode}: ${response.statusMessage}`)
    });
};