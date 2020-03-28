/**
 * Example Node.js App to interface with Keycloak/RH-SSO and
 * login to MongoDB Stitch with custom JWT Token
 */
const {Stitch, CustomCredential, RemoteMongoClient} = require('mongodb-stitch-server-sdk');
const queryString = require('querystring');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const https = require('https');
const axios = require('axios').default;
require('dotenv').config();

// Keycloak/RH-SSO requires signed-certificate.
// Sample RH-SSO install uses self-signed certificate so this prop ensures it will not be rejected.
// This should NOT be used in production!
const instance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    })
});

// Load values from .env file
const STITCH_APP_ID = process.env.STITCH_APP_ID;
const RH_SSO_URL = process.env.RH_SSO_URL;
const CLIENT_ID = process.env.CLIENT_ID;
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;

// Init the Stitch client with app id
const client = Stitch.initializeDefaultAppClient(STITCH_APP_ID);

// axios data params
const PARAMS = {
    client_id: CLIENT_ID,
    username: USERNAME,
    password: PASSWORD,
    grant_type: 'password'
};

// Read the private key from file
const privateKey = fs.readFileSync('private.key');

// Function required to remove KID in JWT returned by Keycloak/RH-SSO
// MongoDB Stitch does not use the KID
function removeKidInJwt(access_token) {

    let decoded = jwt.decode(access_token, {complete: true});
    let jwtPayload = decoded.payload;
    let jwtHeader = {
        "typ": "JWT",
        "alg": "RS256"
    };

    return jwt.sign(jwtPayload, privateKey, {header: jwtHeader, algorithm: 'RS256'});
}

console.log('Starting stitch_login.js');

// Use Axios to get access_token from Keycloak/RH-SSO
// Login to Stitch
// Write the metadata from our custom JWT into MongoDB Atlas
instance({
    method: 'post',
    url: RH_SSO_URL,
    data: queryString.stringify(PARAMS),
    config: {
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }
}).then(token => {
    let new_jwt_string = removeKidInJwt(token.data.access_token);

    // with modified JWT (i.e. no kid in JWT header), login to Stitch
    let credential = new CustomCredential(new_jwt_string);
    client.auth.loginWithCredential(credential)
        .then(user => {
            console.log('Successfully logged in to MongoDB Stich using Custom JWT!');
            console.log('User id logged in: ' + user.id);

            // After successful login, let's write data to MongoDB
            // Initialize MongoDB Service Client
            const mongodb = client.getServiceClient(
                RemoteMongoClient.factory,
                'mongodb-atlas'
            );

            // Get hook to collection
            const authed_users_collection = mongodb.db("MyUsersDB").collection("authed_users");

            // see if this user has logged in before
            let filter = {
                userId: user.id,
                keycloakUserName: user.profile.data.keycloakUserName,
                firstName: user.profile.data.firstName,
                lastName: user.profile.data.lastName,
                email: user.profile.data.email,
            };

            // update/insert the following fields
            let update = {
                $set: {
                    lastLoggedIn: new Date()
                },
                $inc: {
                    numLogins: 1
                }
            };

            // use upsert flag
            authed_users_collection.updateOne(
                filter,
                update,
                {
                    upsert: true
                }
            ).then(doc => {
                console.log("Successful write to MongoDB Atlas.");
            }).then(() => {
                // let's grab how many times this user has logged in
                // we can use the same filter as that above
                authed_users_collection.findOne(
                    filter
                ).then(result => {
                    console.log(result.keycloakUserName + " has logged in " + result.numLogins + " times.");
                })
            });

            // Close the connection
            client.close();

        }).catch(stitchError => {
        console.log(stitchError);
        client.close();
    })
}).catch(error => {

    console.error('Error in generating access_token');
    console.error('     Status: ' + error.response.status);
    console.error('Status Text: ' + error.response.statusText);

});