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
admin.messaging().send(message)
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
    admin.auth().verifyIdToken(data.token)
  .then(function(decodedToken) {
     uid = decodedToken.uid;
     authSuccess = true;
     return Promise;
  }).catch(function(error) {
    console.log('Token Auth Failed', data.token);
    // Handle error
  });
  if(authSuccess === true){
  await db
  .collection(uid)
  .doc('jokeids')
  .get()
  .then((doc) => {
    if (!doc.exists) {
      throw new functions.https.HttpsError("invalid-argument", "User doesn't exist in db!");
    } else {
        doc.data().update({[data.jokeid]:"true"});
        return Promise
    }
  });
}
});
