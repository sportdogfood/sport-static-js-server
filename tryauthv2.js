CLIENT_ID=1000.TOKWCP8GT4OJV3FQEV1RLCD50VQD6X
CLIENT_SECRET=77bfb2775296634ceb37e37dd924a65cb219b54a81
REFRESH_TOKEN=1000.0695fae2604d22599801af1f5cc751c6.b6c9f7a219e824d8195f262cac3cf86a
REDIRECT_URL=https://zaproxy-7ec3ff690999.herokuapp.com/
DATA_CENTER=com
port=4000
scope=ZohoAnalytics.data.READ

https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=1000.TSYNIMEKPXCTOBITFV6I2MYX3OGPQC&redirect_uri=https://zoanalytics-2f9fed4215b4.herokuapp.com/&scope=ZohoAnalytics.data.READ&access_type=offline

https://accounts.zoho.com/oauth/v2/
auth?response_type=code&
client_id=1000.TOKWCP8GT4OJV3FQEV1RLCD50VQD6X&
redirect_uri=https://zaproxy-7ec3ff690999.herokuapp.com/
&scope=ZohoAnalytics.data.READ&access_type=offline

https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=1000.TOKWCP8GT4OJV3FQEV1RLCD50VQD6X&redirect_uri=https://zaproxy-7ec3ff690999.herokuapp.com/&scope=ZohoAnalytics.data.READ&access_type=offline

https://zaproxy-7ec3ff690999.herokuapp.com/?
code=1000.e6c961a942aadd0b5cda8601bd47b959.ee7cf799e536431af72968be2bdcb575
&location=us&accounts-server=https%3A%2F%2Faccounts.zoho.com

# Set variables for client details and refresh token
$refreshToken = "1000.e6c961a942aadd0b5cda8601bd47b959.ee7cf799e536431af72968be2bdcb575"
$clientId = "1000.TOKWCP8GT4OJV3FQEV1RLCD50VQD6X"
$clientSecret = "77bfb2775296634ceb37e37dd924a65cb219b54a81"

# Zoho OAuth endpoint for refreshing token
$tokenUrl = "https://accounts.zoho.com/oauth/v2/token"

# Set the body for the request
$body = @{
    grant_type    = "refresh_token"
    refresh_token = "1000.e6c961a942aadd0b5cda8601bd47b959.ee7cf799e536431af72968be2bdcb575"
    client_id     = "1000.TOKWCP8GT4OJV3FQEV1RLCD50VQD6X"
    client_secret = "77bfb2775296634ceb37e37dd924a65cb219b54a81"
}

# Perform the POST request using Invoke-RestMethod to get the access token
$response = Invoke-RestMethod -Uri $tokenUrl -Method Post -Body $body -ContentType "application/x-www-form-urlencoded"

# Extract the access token from the response
$accessToken = $response.access_token

# Output the access token to check if it's successfully retrieved
$accessToken

https://analyticsapi.zoho.com/restapi/v2/workspace/1386797000003126041/view/1386797000041005560/data

https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=1000.MVBPKBWXJ4NY6TZ1XV8WZYDB1DCCKG&redirect_uri=https://zoho-desk-proxy-1c19406cd387.herokuapp.com/&scope=ZohoDesk.contacts.ALL,ZohoDesk.tickets.ALL&access_type=offline


https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=1000.TOKWCP8GT4OJV3FQEV1RLCD50VQD6X&redirect_uri=https://zaproxy-7ec3ff690999.herokuapp.com/&scope=ZohoAnalytics.data.READ&access_type=offline

https://zaproxy-7ec3ff690999.herokuapp.com/?code=1000.5422c7af0fdb8cd5ae3bc605f2867663.fe0d483941dcaf935d181fa9f5541af0&location=us&accounts-server=https%3A%2F%2Faccounts.zoho.com

https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=1000.TOKWCP8GT4OJV3FQEV1RLCD50VQD6X&redirect_uri=https://zaproxy-7ec3ff690999.herokuapp.com/&scope=ZohoAnalytics.data.READ&access_type=offline

https://zaproxy-7ec3ff690999.herokuapp.com/?code=1000.d0ea8bcdbaa19182f651b8a4a2ab9128.fe35e1b8e4eb52254cb2ecf34d0433d0&location=us&accounts-server=https%3A%2F%2Faccounts.zoho.com

https://zaproxy-7ec3ff690999.herokuapp.com/?code=1000.b055b3e26c88db936acfe2465f62a144.c35ee5e87f1ecfe560be1e1f435141fd&location=us&accounts-server=https%3A%2F%2Faccounts.zoho.com

client_id=1000.TOKWCP8GT4OJV3FQEV1RLCD50VQD6X
client_secret=77bfb2775296634ceb37e37dd924a65cb219b54a81
grant_type=authorization_code
code=1000.d0ea8bcdbaa19182f651b8a4a2ab9128.fe35e1b8e4eb52254cb2ecf34d0433d0
redirect_uri=https://zaproxy-7ec3ff690999.herokuapp.com/

1000.b055b3e26c88db936acfe2465f62a144.c35ee5e87f1ecfe560be1e1f435141fd

$client_id = "1000.TOKWCP8GT4OJV3FQEV1RLCD50VQD6X"
$client_secret = "77bfb2775296634ceb37e37dd924a65cb219b54a81"
$grant_type = "authorization_code"
$code = "1000.b055b3e26c88db936acfe2465f62a144.c35ee5e87f1ecfe560be1e1f435141fd"
$redirect_uri = "https://zaproxy-7ec3ff690999.herokuapp.com/"

$uri = "https://accounts.zoho.com/oauth/v2/token"

$response = Invoke-RestMethod -Uri $uri -Method Post -Body @{
    client_id = $client_id
    client_secret = $client_secret
    grant_type = $grant_type
    code = $code
    redirect_uri = $redirect_uri
} -ContentType "application/x-www-form-urlencoded"

$response | Format-Table -AutoSize


access_token                                                           scope                   api_domain
------------                                                           -----                   ----------
1000.245a707af0afde7a90202cace2b3313a.71ecfffad98fc57583b585dd6780cb5f ZohoAnalytics.data.READ https://www.zohoapis.com

access_token                                                           scope                   api_domain
------------                                                           -----                   ----------
1000.245a707af0afde7a90202cace2b3313a.71ecfffad98fc57583b585dd6780cb5f ZohoAnalytics.data.READ https://www.zohoapis.com


curl -X POST https://accounts.zoho.com/oauth/v2/token \
-d "client_id=YOUR_CLIENT_ID" \
-d "client_secret=YOUR_CLIENT_SECRET" \
-d "grant_type=refresh_token" \
-d "refresh_token=YOUR_REFRESH_TOKEN"

$client_id = "1000.TOKWCP8GT4OJV3FQEV1RLCD50VQD6X"
$client_secret = "77bfb2775296634ceb37e37dd924a65cb219b54a81"
$grant_type = "refresh_token"
$refresh_token = "1000.245a707af0afde7a90202cace2b3313a.71ecfffad98fc57583b585dd6780cb5f"

$uri = "https://accounts.zoho.com/oauth/v2/token"

$response = Invoke-RestMethod -Uri $uri -Method Post -Body @{
    client_id = $client_id
    client_secret = $client_secret
    grant_type = $grant_type
    refresh_token = $refresh_token
} -ContentType "application/x-www-form-urlencoded"

$response | Format-Table -AutoSize



https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=1000.TOKWCP8GT4OJV3FQEV1RLCD50VQD6X&redirect_uri=https://zaproxy-7ec3ff690999.herokuapp.com/&scope=ZohoAnalytics.data.READ&access_type=offline

curl --location 'https://analyticsapi.zoho.com/restapi/v2/workspaces/1386797000003126041/views/1386797000017840583/data?CONFIG=%7B%22responseFormat%22%3A%22csv%22%7D%0A' \
--header 'Content-Type: application/json' \
--header 'ZANALYTICS-ORGID: 643350980' \
--header 'Authorization: Bearer 1000.95edfda8f6f9679ece0b87cd008986e4.2d43cc3002aa6cc140d131a27b277368 ' \
--header 'Cookie: CSRF_TOKEN=bc2bb4f0-29a2-4817-b81d-4a12d17d26bb; JSESSIONID=BFB7894C20D48A26B7F62ED4C89533A7; _zcsr_tmp=bc2bb4f0-29a2-4817-b81




https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=1000.MVBPKBWXJ4NY6TZ1XV8WZYDB1DCCKG&scope=Desk.tickets.READ,Desk.basic.READ&redirect_uri=https://zoho-desk-proxy-1c19406cd387.herokuapp.com/

https://zoho-desk-proxy-1c19406cd387.herokuapp.com/?code=1000.3d7d885eb6498accf09a80ba9eaf9a60.0155381f2ab0efb08b6799b4e71c17c8&location=us&accounts-server=https%3A%2F%2Faccounts.zoho.com

1000.3d7d885eb6498accf09a80ba9eaf9a60.0155381f2ab0efb08b6799b4e71c17c8

curl -X POST https://accounts.zoho.com/oauth/v2/token \
-d "client_id=YOUR_CLIENT_ID" \
-d "client_secret=YOUR_CLIENT_SECRET" \
-d "grant_type=refresh_token" \
-d "refresh_token=YOUR_REFRESH_TOKEN"

$client_id = "1000.TOKWCP8GT4OJV3FQEV1RLCD50VQD6X"
$client_secret = "77bfb2775296634ceb37e37dd924a65cb219b54a81"
$grant_type = "refresh_token"
$refresh_token = "1000.245a707af0afde7a90202cace2b3313a.71ecfffad98fc57583b585dd6780cb5f"

$uri = "https://accounts.zoho.com/oauth/v2/token"

$response = Invoke-RestMethod -Uri $uri -Method Post -Body @{
    client_id = $client_id
    client_secret = $client_secret
    grant_type = $grant_type
    refresh_token = $refresh_token
} -ContentType "application/x-www-form-urlencoded"

$response | Format-Table -AutoSize


https://zoho-desk-proxy-1c19406cd387.herokuapp.com/?code=1000.ee9b813b20f1dbe4fd8548f8f35e9e04.a7f1b691f18a5561695e63c7171e1cec&location=us&accounts-server=https%3A%2F%2Faccounts.zoho.com&


$client_id = "1000.MVBPKBWXJ4NY6TZ1XV8WZYDB1DCCKG"
$client_secret = "337b58b95177eec40729b390c20ff1c4b1ddea7d52"
$grant_type = "authorization_code"
$code = "1000.70d2991391a722a0edaed9318dc1104a.783dccc8c0ea2e417522d0e028d35afa"
$redirect_uri = "https://zoho-desk-proxy-1c19406cd387.herokuapp.com/"
$uri = "https://accounts.zoho.com/oauth/v2/token"
$response = Invoke-RestMethod -Uri $uri -Method Post -Body @{
    client_id = $client_id
    client_secret = $client_secret
    grant_type = $grant_type
    code = $code
    redirect_uri = $redirect_uri
} -ContentType "application/x-www-form-urlencoded"
$response 

access_token                                                           scope                             api_domain
------------                                                           -----                             ----------
1000.bf8cd869e6ed8dc25cb119fd3264db1e.cace769d03b2559c4f0802a26a3404d3 Desk.tickets.READ Desk.basic.READ https://www...

1000.ee9b813b20f1dbe4fd8548f8f35e9e04.a7f1b691f18a5561695e63c7171e1cec

access_token                                                           scope                             api_domain
------------                                                           -----                             ----------
1000.ef5581be51ee3bb3f76f95e6cc474c8b.1e3396c60600372f4328555020b84b30 Desk.tickets.READ Desk.basic.READ https://www...


https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=1000.MVBPKBWXJ4NY6TZ1XV8WZYDB1DCCKG&redirect_uri=https://zoho-desk-proxy-1c19406cd387.herokuapp.com/&scope=Desk.tickets.READ&access_type=offline&prompt=consent

https://zoho-desk-proxy-1c19406cd387.herokuapp.com/?code=1000.70d2991391a722a0edaed9318dc1104a.783dccc8c0ea2e417522d0e028d35afa&location=us&accounts-server=https%3A%2F%2Faccounts.zoho.com&

https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=1000.MVBPKBWXJ4NY6TZ1XV8WZYDB1DCCKG&redirect_uri=https://zoho-desk-proxy-1c19406cd387.herokuapp.com/&scope=ZohoAnalytics.data.READ&access_type=offline&prompt=consent

access_token                                                           refresh_token
------------                                                           -------------
1000.c75f1b1fa2e537dfa310e144b5cdbb18.97a68c4a76f9d40d7604ab4a036c915d 1000.db4c91c8b097698c9e1233c23db4da64.6c15da9...



https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=1000.MVBPKBWXJ4NY6TZ1XV8WZYDB1DCCKG&redirect_uri=https://zoho-desk-proxy-1c19406cd387.herokuapp.com/&scope=Desk.tickets.READ&access_type=offline&prompt=consent

https://zoho-desk-proxy-1c19406cd387.herokuapp.com/?code=1000.24c6145dd6b6d5d8079144e636ae847a.8c3097ef653725f9c4e496d60b91909f&location=us&accounts-server=https%3A%2F%2Faccounts.zoho.com&
1000.24c6145dd6b6d5d8079144e636ae847a.8c3097ef653725f9c4e496d60b91909f



$client_id = "1000.MVBPKBWXJ4NY6TZ1XV8WZYDB1DCCKG"
$client_secret = "337b58b95177eec40729b390c20ff1c4b1ddea7d52"
$grant_type = "authorization_code"
$code = "1000.24c6145dd6b6d5d8079144e636ae847a.8c3097ef653725f9c4e496d60b91909f"
$redirect_uri = "https://zoho-desk-proxy-1c19406cd387.herokuapp.com/"
$uri = "https://accounts.zoho.com/oauth/v2/token"
$response = Invoke-RestMethod -Uri $uri -Method Post -Body @{
    client_id = $client_id
    client_secret = $client_secret
    grant_type = $grant_type
    code = $code
    redirect_uri = $redirect_uri
} -ContentType "application/x-www-form-urlencoded"
$response 

access_token  : 1000.008340c0d8b2a5628fe8439060f35c06.a5102b10b14842e5bf1c3126f42ddccf
refresh_token : 1000.b8cfce2168907784ff0db27f24ce0790.f15f5335af23ada1029bf23001309063
scope         : Desk.tickets.READ
api_domain    : https://www.zohoapis.com
token_type    : Bearer
expires_in    : 3600


1000.TOKWCP8GT4OJV3FQEV1RLCD50VQD6X
https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=1000.TOKWCP8GT4OJV3FQEV1RLCD50VQD6X&redirect_uri=https://zaproxy-7ec3ff690999.herokuapp.com/&scope=ZohoAnalytics.data.READ&access_type=offline&prompt=consent


1000.49ecc190c50a5d3e5f9c2911f800b9a9.13f8920ee7d6c812d93e9b24604c610c
https://zaproxy-7ec3ff690999.herokuapp.com/?code=1000.49ecc190c50a5d3e5f9c2911f800b9a9.13f8920ee7d6c812d93e9b24604c610c&location=us&accounts-server=https%3A%2F%2Faccounts.zoho.com&



https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=1000.TOKWCP8GT4OJV3FQEV1RLCD50VQD6X&redirect_uri=https://zaproxy-7ec3ff690999.herokuapp.com/&scope=ZohoAnalytics.data.READ&access_type=offline&prompt=consent

https://zaproxy-7ec3ff690999.herokuapp.com/?code=1000.5bfde31f90f006ad396fe980c26171c9.08666b96449c35b6648548ea9ff8f5db&location=us&accounts-server=https%3A%2F%2Faccounts.zoho.com&
https://zaproxy-7ec3ff690999.herokuapp.com/?code=1000.512110c62c39c9bbed3a6ead16fdb97b.2e9f87dce1da5bee981b8195f08c13f0&location=us&accounts-server=https%3A%2F%2Faccounts.zoho.com&
1000.5bfde31f90f006ad396fe980c26171c9.08666b96449c35b6648548ea9ff8f5db
1000.512110c62c39c9bbed3a6ead16fdb97b.2e9f87dce1da5bee981b8195f08c13f0

$client_id = "1000.TOKWCP8GT4OJV3FQEV1RLCD50VQD6X"
$client_secret = "77bfb2775296634ceb37e37dd924a65cb219b54a81"
$grant_type = "authorization_code"
$code = "1000.512110c62c39c9bbed3a6ead16fdb97b.2e9f87dce1da5bee981b8195f08c13f0"
$redirect_uri = "https://zaproxy-7ec3ff690999.herokuapp.com/"
$uri = "https://accounts.zoho.com/oauth/v2/token"
$response = Invoke-RestMethod -Uri $uri -Method Post -Body @{
    client_id = $client_id
    client_secret = $client_secret
    grant_type = $grant_type
    code = $code
    redirect_uri = $redirect_uri
} -ContentType "application/x-www-form-urlencoded"
$response 

access_token  : 1000.8acb529d200c637be085f07adca38154.a87f446db1740d055ef99afded55d594
refresh_token : 1000.705f3e838b3f6c5b52eb421d92580dbf.1f497e30d274a005a1ec8fa5dbae9b85
scope         : ZohoAnalytics.data.READ
api_domain    : https://www.zohoapis.com
token_type    : Bearer
expires_in    : 3600
