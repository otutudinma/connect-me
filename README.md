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
#### Uploading a profile picture
To upload a profile picture, it is sent as a `multipart/form-data` which accepts a field `image` which should be `jpg, png or jpeg`
To access the endpoint 
```
POST REQUEST| localhost:4500/api/users/images

The endpoint of image upload is meant to upload image to cloudinary and return the url as response
It is the returned URL that is passed to the profile update endpoint to be stored on the database
On the frontend, the upload for instance will be triggered `onselecting image` then the response will be sent through a new endpoint
```
#### Adding a username
To add a username as part of profile update, two fields are required the username and the phone number which should be unique and should be sent in json format
```
{
  "phoneNumber": "+23470622222222",
  "username": "myUsername",
  "bio": "I love this application, I am a business owner who loves to hang out"
  "imageUrl": "https://image......"

}
```
Note: the username and phone number are unique
To access the endpoint 
```
PUT REQUEST| localhost:4500/api/users/profile
```
#### Resend token
When a user inputs a wrong token or the token expires, the user can request for another token which will be sent to the users number. To access this endpoint

This endpoint expects a field which is passed as phone number of the user `localhost:4500/api/users/{phoneNumber}/resendToken`
```
GET REQUEST| localhost:4500/api/users/+2344444444444/resendToken
```


## ADD A CONNECTION

When a user successfully completes the account creation and has full access to hala-app, he or she can start adding users to their connections but firstly, we havae find the user to be sure he/she is also a hala app user

To search for a user, we make use of the phone number and to access this route, we need to pass the phone number of the person the user wants to add to his or her connection `localhost:4500/api/users/{phoneNumber}`
```
GET REQUEST| localhost:4500/api/users/+2347062222222
```

Upon successful search, a user can then be added in three ways

 #### Addition by Phone Number

 To add a user to ones connection the sender and receiver number are required and are sent in a json format
 ```
 {
   "senderNumber": "+2347062222222",
   "receiverNumber": "+2347067777777"
 }
```
To make a request to the endpoint 
```
POST REQUEST| localhost:4500/api/connections
```

#### Addition by QR CODE
Upon successful registration and update, a qr image is generated for a user which is unique and can be used to add another user to connection. 
When a user uses the qr scanner in hala-app to scan through another users qr image, it checks that the user is a hala-app user, then we make a requet to the add connection end point and they will both be added to their connections respectively.

#### By phonebook
When a hala-app user grants access to his or her phone book, he/she can search for users and add to their connections
When a user is found, a request is made to the `add connections endpoint` and the users are successfully added to their connections respectively.