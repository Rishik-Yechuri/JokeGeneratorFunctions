const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { firebaseConfig } = require('firebase-functions');
admin.initializeApp();
const db = admin.firestore();
const app = express(); 
exports.addToken = functions.https.onCall(async(data, context) => {
 const user = {
    //"kring":data.token
 };
 await db.collection(data.gameID).doc("usertokens").update({[data.name]:data.token});
  var doubleToken;
 await db
 .collection(data.gameID)
 .doc('hosttoken')
 .get()
 .then((doc) => {
   if (!doc.exists) {
     throw new functions.https.HttpsError("invalid-argument", "User doesn't exist in db!");
   } else {
       doubleToken = doc.data().token
       return Promise
   }
 });
 var message = {
   data: {
     purpose:"registername",
     name:data.name,
     token:data.token
     //[data.name]:data.token
   },
   token:doubleToken
 };
// Send a message to the device corresponding to the provided
// registration token.
await admin.messaging().send(message)
 .then((response) => {
   console.log('Successfully sent message:', response);
   return Promise;
   // Response is a message ID string.
 })
 .catch((error) => {
   console.log('Error sending message:', error);
 });
 //return Promise;
});
exports.saveJokeID = functions.https.onCall(async(data,context) => {
    var authSuccess = false;
    var uid;
    console.log('place 1');
    await admin.auth().verifyIdToken(data.token)
  .then(function(decodedToken) {
    console.log('place 2');
     uid = decodedToken.uid;
     console.log('place 3');
     authSuccess = true;
     console.log('place 4');
     console.log('token verified');
     return Promise;
    //Test comment
  }).catch(function(error) {
    console.log('Token Auth Failed', data.token);
    console.log('Token is ' + data.token)
    // Handle error
  });
  //console.log('pre auth:' + authSuccess);
  if(authSuccess === true){
    console.log('post auth');
    const user = {
    };
  var createDoc = false;
   await db
  .collection(uid)
  .doc('jokeids')
  .get()
  .then((doc) => {
    console.log('uid value:' + uid);
    if (!doc.exists) {
      console.log('In if');
      createDoc = true;
      return Promise;
    } else{return Promise;}
  });
  console.log('Pre bool check');
  if(createDoc){
    await db.collection(uid).doc('jokeids').set(user);
  }
  await db.collection(uid).doc('jokeids').update({[data.jokeid]:"true"});
}
});
