const functions = require('firebase-functions');
const express = require('express');
const lotDesigner = require('./webhooks/lot-designer');

const app = express();


app.post('/ecabbc8b-c05c-48f1-8058-c85d3e0a56ef/', (req, res) => {
    const issue = req.body.issue;    
    // Note: cache should not be re-used by repeated calls to JSON.stringify.
    let cache = [];
    lotDesigner.designLotNumber(
        issue,
        (resp) => res.status(200).send(resp),
        (error) => {
            res.status(500).send(
                JSON.stringify(error, (key, value) => {
                    if (typeof value === 'object' && value !== null) {
                        if (cache.indexOf(value) !== -1) {
                            // Circular reference found, discard key
                            return;
                        }
                        // Store value in our collection
                        cache.push(value);
                    }
                })
            );
            cache = null;
        }
    );
});

exports.webhooks = functions.https.onRequest(app);
