# connect-me
Allowers friends from all over the world chat and also send money to one another


## ACCOUNT CREATION
 As a new user, phone number is the only required field which should be 14 digits with `+` included 
 example `+234xxxxxxxxxx`
 To access this endpoint, we need to send it in a json form 
#### Signing Up on Hala app
 ```
{
  "phoneNumber": "+2347062222222"
}
```
The endpoint point for it is this 
```
POST REQUEST| localhost:4500/api/users
```
An OTP is sent to the number, this allows the user to access the application by firstly adding a username and a profile picture

#### Verify a user
When a user signs up on hala-app a token is sent to the mobile number, this is the OTP that will be use to verify the user. Two fields are to be sent as json format 
```
{
  "phoneNumber": "+2347062222222",
  "token": "12345"
}
```

To access the endpoint for account verification 
```
PUT REQUEST| localhost:4500/api/users
```
