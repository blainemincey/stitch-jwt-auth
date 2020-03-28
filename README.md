# stitch-jwt-auth

# Example of using Keycloak/Red Hat SSO to generate JWT for auth to MongoDB Stitch 
## Custom JWT Authentication

The purpose of this tutorial is to provide a high-level example of the steps required
to configure [Keycloak](https://www.keycloak.org/) / [Red Hat SSO](https://access.redhat.com/products/red-hat-single-sign-on)
for use with [MongoDB Stitch](https://docs.mongodb.com/stitch/) and its capability for
[Custom JWT Authentication](https://docs.mongodb.com/stitch/authentication/custom-token/).

*Note:* Please follow the steps for installing Keycloak or Red Hat SSO based on your particular requirements. This example
will not reproduce the installation instructions for either of these.

## Required Prerequisites

* Installation of Keycloak or Red Hat SSO

* MongoDB Atlas Sandbox (Free!) Cluster

* MongoDB Stitch Application 

* Sample node.js example was tested with npm v6.13.7 and node.js v13.11.0

---

## Step 1 - Initial Configuration of Keycloak / Red Hat SSO

After logging in as an Admin user of RH-SSO, in the upper-left corner, select the option next to
the 'Master' Realm and click the 'Add Realm' button as indicated below.
![](img/step1.jpg)

In this example, we will name our Realm 'my-sso-realm' as indicated below.  Be sure it is enabled
and then click the 'Create' button.
![](img/step2.jpg)

## Step 2 - Initial Configuration of MongoDB Stitch
First, access the MongoDB Stitch Console from the MongoDB Atlas UI as indicated below.  Click the
'Stitch' option in the lower-left navigation of MongoDB Atlas and then click the MongoDB Stitch
application you have already created.  If there is no Stitch application, choose to create one, keep
all the defaults, and finally click into the application to access the console.
![](img/stitch1.jpg)

Once the Stitch console has opened, select 'Users' in the left-hand navigation under 'Data Access & Security'.  Then,
click the 'Providers' tab along the top of the screen.  Down below, find 'Custom JWT Authentication' and
select the 'Edit' button.  It should be similar to that below.
![](img/stitch2.jpg)

On the next screen, be sure that the Provider option is toggled to 'On'.  Then, select to 'Manually
specify signing keys'.  The Signing Algorithm should be RS256.  Then, you will need to find the Public
Key for RH-SSO.  Be sure you screen is similar to that below first.
![](img/stitch3.jpg)

Now, go into RH-SSO to select the signing key.  This can be found by first selecting the Realm
that was created in an earlier step.  Click the 'Keys' tab along the top menu options for the Realm.
Find the row indicating RS256 and select 'Public Key' at the end of the row.  After clicking this,
a pop-up window will open and you should copy the Public Key that is displayed.
![](img/stitch4.jpg)

If you would like to verify the key, you can do so at [jwt.io](https://jwt.io/).  If you select RS256 in the top 
drop-down, paste the key in the Encoded box, it will wrap the Public Key with the appropriate header
and footer which indicates the Beginning and Ending of the Public Key.  It will be similar to that
below.  Values have been hidden.  Please note:  Keep this page open as we will copy the RSA Private
Key for use later.
![](img/stitch5.jpg)

Now, create the Signing Key Name.  First, enter the name and create.  This will open up an option
to paste the Public Key from RH-SSO.  Once pasted, you can then click '+ Add Signing Key'.  It should
be similar to that below.
![](img/stitch6.jpg)

Next, select the APP ID for your Stitch Application in the Upper-left hand corner of the console
as indicated below.
![](img/stitch7.jpg)

Now, navigate towards the bottom of the page of the Auth Provider we have been editing and paste this
value in the 'Audience' field similar to that below.  Finally, click the 'Save' button.
![](img/stitch8.jpg)

After saving, a blue banner will appear towards the top of the browser indicating that you should
'Review & Deploy Changes'.  Be sure to click this button to deploy what we have created. A separate dialog
will pop-up for you to review the changes.  Then, click to deploy the changes.
![](img/stitch9.jpg)

## Step 3 - Additional configuration of generated JWT from RH-SSO

The next step is to create a 'Client' in RH-SSO.  First, click the 'Clients' option in the left-hand
navigation under our Realm.  Then, click the 'Create' button on the far-right.  It should look
similar to that below.
![](img/stitch10f.jpg)

Enter a 'Client ID' and be sure to select 'openid-connect' for the Client Protocol and then click
the 'Save' button similar to that below.  In this example, we name the client 'my-node-client'.
![](img/stitch11.jpg)

On the next dialog, be sure to enter the following values.  It is assuming your test application
will be deployed on localhost.  However, if it is not, please be sure to enter the correct values
for the various URLs that are required.  The page is too long to display so the appropriate values
should be entered for the following fields:
* Enabled: On
* Access Type: public
* Standard Flow Enabled: On
* Direct Access Grants Enabled: On
* Authorization Enabled: Off
* Valid Redirect URIs: *

Finally, click the 'Save' button at the bottom of the screen.

Next, a Client Scope should be added so we can pass a custom audience field so we will be 
recognized by MongoDB Stitch.  Click the 'Client Scope' option within the left-hand navigation.
Then, click the 'Create' button on the right as indicated below.
![](img/stitch12.jpg)

For the 'Add client scope' dialog, enter 'stitch-client-scope' as the Name.  Be sure the Protocol
is set to openid-connect and click the save button at the bottom of the screen.
![](img/stitch13.jpg)

Now, click the 'Mappers' tab at the top and the 'Create' button to the right.
![](img/stitch14.jpg)

For the 'Create Protocol Mapper' input, provide a Name, select the Mapper Type to be 'Audience',
paste your unique MongoDB Stitch App Id in the 'Included Custom Audience' field, be sure to toggle 
'Add to ID token' to off, and the 'Add to access token' to on.  Finally, click the 'Save' button.
It should be similar to that below.
![](img/stitch15.jpg)

If you would like to add additional user data to the JWT generated by RH-SSO, you may add an
additional Protocol Mapper.  For example, if you would like to persist or display the 'preferred_username'
as part of my JWT, I would add it as indicated below.  This example will add the 
'preferred_username' property from the authenticated user into the JWT.  This can then be mapped
as metadata within MongoDB Stitch if you would like to persist additional information on your user object
within MongoDB Stitch.
![](img/stitch16.jpg)

## Step 4 - Create a User in RH-SSO and test JWT generation
Be sure you have created a user within RH-SSO.  This can be done via the left-hand navigation within
RH-SSO.  Click the 'User' option in the left-hand navigation and select to 'Add user'.  This is based
on the Keycloak/RH-SSO documentation.  After creating the user, be sure to modify the password
as part of the 'Credentials' tab.  In addition to the required Username, be sure to also add
an email, first name, and last name as these values will be available in the JWT so you can
map those properties to User object properties in MongoDB Stitch.

Now that we have a user created in RH-SSO, we can test the creation of our JWT using this user
directly within RH-SSO.  First, click the 'Clients' option in the left-hand navigation.  Select
the Client created in an earlier step as indicated below.  Then, select 'Client Scopes' tab along
the top.  In the 'Setup' dialog, select our newly created Client Scope from the Default Client
Scopes 'Available Client Scopes' box and then click 'Add selected' to move it to the Assigned
Default Client Scope as indicated below.
![](img/stitch17.jpg)

Now, select the 'Evaluate' option next to 'Setup' in the client.  Then, select one of your users
from the provided dropdown.  Then, click the 'Evaluate' button as indicated below.
![](img/stitch18.jpg)

After the Evaluation completes, click the far-right for 'Generated Access Token'.  If you did not
select a user as indicated in the previous step, this option will not be available.  Inspect the
generated JWT for the 'aud' field that it contains our MongoDB Stitch App Id.  If you scroll further
down, you will see the additional user properties of username, email, etc.  The aud field MUST
be the MongoDB Stitch App Id similar to that below.
![](img/stitch19.jpg)

## Step 5 - Additional configuration for MongoDB Stitch Authentication 
Go back to the MongoDB Stitch Console.  Under 'Data Access & Security', select 'Users' in the left-hand
navigation.  Select 'Custom JWT Authentication' so we can make additional modifications to this
Auth Provider we have configured in an earlier step.  Scroll down the page and expand the 
'Metadata Fields (Optional)' field.  We will map fields contained within our JWT to fields
within the MongoDB Stitch User object.  Mark the following Path and Field Names as required:

| Path          | Field Name    | 
|:-------------:|:-------------:|
| name | name      | 
|given_name | firstName |
|family_name| lastName |
|email|email|
|preferred_username|keycloakUserName|

It should look similar to the image below.
![](img/stitchAuth.jpg)  

The final step for configuration for MongoDB Stitch is to create a rule in order to provide
read/write access to our database/collection.  From the left-hand navigation in the Stitch Console,
select 'Rules'.  Then, click the '+' sign to the right of 'mongodb-atlas' in the Collections dialog.
For database name, type 'MyUsersDB' in the text box and click enter on your keyboard to persist the option.
Next, type 'authed_users' into the Collection Name text box and click enter on your keyboard. Be sure
there is 'No Template' and select the 'Add Collection' button in the lower-right corner similar to that
below.
![](img/stitchrules1.jpg)

On the next screen, select the Read and Write checkboxes.  Then, click the 'Save' button towards the
upper-right.  Once 'Save' has been clicked, then click the 'Review & Deploy Changes' option that appears
across the top of the screen within a blue bar similar to that below.  Finally, click the 'Deploy' button
that will appear.
![](img/stitchrules2.jpg)


## Step 6 - Test our JWT with MongoDB Stitch
The next several steps will involve making modifications to the simple Node.js application that is 
included as part of this repo.  In the root directory, locate `env.example` and `rename-private.key`.

First, rename `rename-private.key` to `private.key`.
Open `private.key`.  If you recall, you should still have a browser opened to [JWT.io](http://jwt.io).
If this is still open, we will need to get the PRIVATE KEY that is part of the Keycloak/RH-SSO Public Key
we copied earlier.  In the right-side of the browser, towards the bottom, you should see the 'Verify Signature'
block.  The lower box should contain your Private Key.  It will look similar to that below.
![](img/privatekey.jpg)

Be sure to copy the entirety of this box.  Then, paste the contents into the `private.key` file.  It is 
critical that this file is formatted correctly.  The block below is strictly an example and will not work.
In fact, your Private Key should be almost 30 lines.
```
-----BEGIN RSA PRIVATE KEY-----
jpoqxj4efZfkUrg5GbSEhf+dZglf0tTOA5bVg8IYwtmNk/pniLG/zI7c+GlTc9B
BwfMr59EzBq/eFMI7+LgXaVUsM/sS4Ry+yeK6SJx/otIMWtDfqxsLD8CPMCRvecC
2Pip4uSgrl0MOebl9XKp57GoaUWRWRHqwV4Y6h8CgYAZhI4mh4qZtnhKjY4TKDjx
QYufXSdLAi9v3FxmvchDwOgn4L+PRVdMwDNms2bsL0m5uPn104EzM6w1vzz1zwKz
5pTpPI0OjgWN13Tq8+PKvm/4Ga2MjgOgPWQkslulO/oMcXbPwWC3hcRdr9tcQtn9
Imf9n2spL/6EDFId+Hp/7QKBgAqlWdiXsWckdE1Fn91/NGHsc8syKvjjk1onDcw0
jg/3747WSsf/zBTcHihTRBdAv6OmdhV4/dD5YBfLAkLrd+mX7iE=
-----END RSA PRIVATE KEY-----
```

Next, in the root directory of this repo, rename `env.example` to `.env`.  Modify the following
properties to the values specific to your Keycloak/RH-SSO install.  The following values must be
specific to your realm and client.  The Stitch App ID is available in the upper left-hand
corner of the MongoDB Stitch Browser Console.  The RH-SSO URL will be the URL associated
with the openid-connect token url similar to that below.  The client id is what you named your
Keycloak/RH-SSO client in an earlier step.  Then, enter the username and password of the user
you created earlier.
```
# Unique MongoDB Stitch App Id
STITCH_APP_ID = MY_UNIQUE_STITCH_APP_ID

# Keycloak/RH-SSO URL - specifically the <host>/auth/<realm>/protocol/openid-connect/token
RH_SSO_URL = https://my-rh-sso-host:8443/auth/realms/my-sso-realm/protocol/openid-connect/token

# Values required from the Keycloak/RH-SSO client
CLIENT_ID = my-node-client
USERNAME = myUser
PASSWORD = myUserPassword
```

Once these properties have been modified be sure to run:
```
npm install
```
If your build/install is successful, run the following:
```
node src/stitch_login.js
```

If everything has been configured properly, you should see output similar to that below.
![](img/stitchlogin.jpg)

A quick inspection of your data using either MongoDB Compass or the Data Explorer within MongoDB Atlas
should indicate a user document similar to that below. 

![](img/user.jpg)


















