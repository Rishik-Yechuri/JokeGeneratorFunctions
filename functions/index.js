const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const {Storage} = require('@google-cloud/storage');
const admin = require('firebase-admin');
const {firebaseConfig} = require('firebase-functions');
//admin.initializeApp();
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: 'http://localhost:4000/firestore'
});
const db = admin.firestore();
const app = express();
const path = require('path');
const os = require('os');
const fs = require('fs');
const {stringify} = require('querystring');

exports.addToken = functions.https.onCall(async (data, context) => {
    const user = {
        //"kring":data.token
    };
    await db.collection(data.gameID).doc("usertokens").update({[data.name]: data.token});
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
            purpose: "registername",
            name: data.name,
            token: data.token
            //[data.name]:data.token
        },
        token: doubleToken
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
exports.saveJokeID = functions.https.onCall(async (data, context) => {
    var authSuccess = false;
    var uid;
    console.log('place 1');
    await admin.auth().verifyIdToken(data.token)
        .then(function (decodedToken) {
            console.log('place 2');
            uid = decodedToken.uid;
            console.log('place 3');
            authSuccess = true;
            console.log('place 4');
            console.log('token verified');
            return Promise;
            //Test comment
        }).catch(function (error) {
            console.log('Token Auth Failed', data.token);
            console.log('Token is ' + data.token)
            // Handle error
        });
    if (authSuccess === true) {
        console.log('post auth');
        const user = {};
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
                } else {
                    return Promise;
                }
            });
        console.log('Pre bool check');
        if (createDoc) {
            await db.collection(uid).doc('jokeids').set(user);
        }
        await db.collection(uid).doc('jokeids').update({[data.jokeid]: "true"});
    }
    try {
        const bucket = admin.storage().bucket('jokegenerator-13008.appspot.com');
        await db.collection(uid).doc('jokeids').collection('jokes').doc(data.jokeid).set(data.jokejson);
    } catch (e) {
        console.log('error file', e);
    }
        var topicToSend = data.token.split('.')[0];
        var tempMesssage = {
            data: {
                position: data.position,
                actualJSON: JSON.stringify(data.jokejson),
                purpose: "savejoke"
            }
        }
        console.log('pre joke update uid value:', data.token)
    await admin.messaging().sendToTopic(topicToSend, tempMesssage);
});
exports.checkIfJokeSaved = functions.https.onCall(async (data, context) => {
    var uid;
    await admin.auth().verifyIdToken(data.token)
        .then(function (decodedToken) {
            uid = decodedToken.uid;
            authSuccess = true;
            return Promise;
            //Test comment
        }).catch(function (error) {
            console.log('Token Auth Failed', uid);
            console.log('Token is ' + uid)
            // Handle error
        });
    var jokeStored = false;
    await db
        .collection(uid)
        .doc('jokeids')
        .get()
        .then((doc) => {
            console.log('uid value:' + uid);
            if (!doc.exists) {
                console.log('In if');
                return Promise;
            } else {
                var jokeid = data.jokeid;
                console.log('joke value:' + jokeid);
                jokeStored = doc.data()[jokeid]
                //jokeStored = doc.data().j66
                return Promise;
            }
        });
    return {
        jokeStored: jokeStored
    }
});
exports.deleteJoke = functions.https.onCall(async (data, context) => {
    var uid;
    await admin.auth().verifyIdToken(data.token)
        .then(function (decodedToken) {
            uid = decodedToken.uid;
            authSuccess = true;
            return Promise;
        }).catch(function (error) {
            console.log('Token Auth Failed', uid);
        });
    await db.collection(uid).doc('jokeids').collection('jokes').doc(data.jokeid).delete();
    const cityRef = db.collection(uid).doc('jokeids');
    const FieldValue = admin.firestore.FieldValue;
    await cityRef.update({
        [data.jokeid]: FieldValue.delete()
    });
    try {
        var topicToSend = data.token.split('.')[0];
        var tempMesssage = {
            data: {
                jokeid: data.jokeid,
                purpose: "deletejoke"
            }
        }
        console.log('token:', data.token)
        console.log('topic:', topicToSend)
        await admin.messaging().sendToTopic(topicToSend, tempMesssage);
    } catch (error) {
        console.log('error', error);
    }
});
exports.getSavedJokes = functions.https.onCall(async (data, context) => {
    var uid;
    await admin.auth().verifyIdToken(data.token)
        .then(function (decodedToken) {
            uid = decodedToken.uid;
            return Promise;
        }).catch(function (error) {
            console.log('Token Auth Failed', uid);
        });
    console.log('Pre get');
    var holdJSON = ""
    await db
        .collection(uid)
        .doc('jokeids')
        .collection('jokes')
        .get()
        .then(function (querySnapshot) {
            querySnapshot.docs.forEach(doc => {
                var tempVar = 'category'
                console.log("doc from loop:" + doc.data()[tempVar])
                holdJSON += doc.data().id + " "
            })
            return Promise;
        });
    return {
        value: holdJSON
    }
});
/*function verifyToken(token,admin){
  var uid;
  await admin.auth().verifyIdToken(token)
  .then(function(decodedToken) {
     uid = decodedToken.uid;
     return Promise;
  }).catch(function(error) {
    console.log('Token Auth Failed', uid);
  });
  return uid;
}*/
exports.addGroup = functions.https.onCall(async (data, context) => {
    var uid;
    await admin.auth().verifyIdToken(data.token)
        .then(function (decodedToken) {
            uid = decodedToken.uid;
            return Promise;
        }).catch(function (error) {
            console.log('Token Auth Failed', uid);
        });
    await db.collection(uid).doc("jokeids").collection("groups").doc(data.groupName).set({
        savedJokes: ""
    });
    var tempMesssage = {
        data: {
            name: data.groupName,
            purpose: "addgroup"
        }
    }

    await admin.messaging().sendToTopic(data.token.split('.')[0], tempMesssage)
        .then((response) => {
            return Promise;
        })
        .catch((error) => {     
            console.log('Error sending message:', error);
        });
});
exports.removeGroup = functions.https.onCall(async (data, context) => {
    var uid;
    await admin.auth().verifyIdToken(data.token)
        .then(function (decodedToken) {
            uid = decodedToken.uid;
            return Promise;
        }).catch(function (error) {
            console.log('Token Auth Failed', uid);
        });
    await db.collection(uid).doc("jokeids").collection("groups").doc(data.groupName).delete();
});
exports.removeJokeFromGroup = functions.https.onCall(async (data, context) => {
    var uid;
    await admin.auth().verifyIdToken(data.token)
        .then(function (decodedToken) {
            uid = decodedToken.uid;
            return Promise;
        }).catch(function (error) {
            console.log('Token Auth Failed', uid);
        });
    console.log("group name:" + data.groupName);
    await db.collection(uid).doc("jokeids").collection("groups").doc(data.groupName).get()
        .then(function (doc) {
            var arrayOfId = ['']
            var savedJokes = doc.data().savedJokes;
            if (!(savedJokes === null || savedJokes === undefined)) {
                arrayOfId = doc.data().savedJokes.split(',');
            }
            var newArrayOfIDs = [];
            for (var x = 0; x < arrayOfId.length; x++) {
                console.log("data id:" + data.id);
                console.log("arrayOfId[x]:" + arrayOfId[x]);
                if (arrayOfId[x] !== data.id) {
                    newArrayOfIDs.push(arrayOfId[x]);
                }
            }
            var finalString = newArrayOfIDs.toString();
            var tempMesssage = {
                data: {
                    purpose: "deletefromgroup",
                    groupRemovedFrom: data.groupName,
                    jokeRemoved: String(data.id)
                }
            }
            admin.messaging().sendToTopic(data.token.split('.')[0], tempMesssage);
            console.log("finalstring:" + finalString)
            db.collection(uid).doc("jokeids").collection("groups").doc(data.groupName).set({
                savedJokes: finalString
            });
            return Promise;
        })
});
exports.addJokeToGroup = functions.https.onCall(async (data, context) => {
    var uid;
    var finalString
    await admin.auth().verifyIdToken(data.token)
        .then(function (decodedToken) {
            uid = decodedToken.uid;
            return Promise;
        }).catch(function (error) {
            console.log('Token Auth Failed', uid);
        });
    await db.collection(uid).doc("jokeids").collection("groups").doc(data.groupName).get()
        .then(function (doc) {
            var savedJokes = doc.data().savedJokes;
            var arrayOfId = ['']
            if(!(savedJokes === null || savedJokes === undefined)){
                arrayOfId = doc.data().savedJokes.split(',');
            }
            var jokesToAdd = ['']
            console.log("Data.id:" + data.id)
            var arrayString = data.id
            jokesToAdd = arrayString.replace("[", "").replace("]", "").split(",");
            console.log("joketoadd:" + jokesToAdd);
            for (var x = 0; x < jokesToAdd.length; x++) {
                var thing = "sup"
                arrayOfId.push(jokesToAdd[x]);
            }
            console.log("Array of id" + arrayOfId);
            finalString = arrayOfId.toString();
            console.log("final string" + finalString);
            //await admin.messaging().sendToTopic(data.token.split('.')[0], tempMesssage);
            return Promise;
        })
    var tempMesssage = {
        data: {
            purpose: "addtogroup",
            groupAddedTo: data.groupName,
            jokesAdded: data.id
        }
    }
    await admin.messaging().sendToTopic(data.token.split('.')[0], tempMesssage);
    await db.collection(uid).doc("jokeids").collection("groups").doc(data.groupName).set({
        savedJokes: finalString
    });
});
exports.returnSavedGroups = functions.https.onCall(async (data, context) => {
    var uid;
    await admin.auth().verifyIdToken(data.token)
        .then(function (decodedToken) {
            uid = decodedToken.uid;
            return Promise;
        }).catch(function (error) {
            console.log('Token Auth Failed', uid);
        });
    var savedGroups = new Map([
        ["",[""]]
    ]);
    savedGroups.clear();
    const snapshot = await db.collection(uid).doc("jokeids").collection("groups").get();
    snapshot.forEach(doc => {
        console.log(doc.id, '=>', doc.data());
        savedGroups.set(doc.id,doc.data().savedJokes);
    });
    var finalJSON = {};
    finalJSON = mapToObj(savedGroups);
    return {
        map: JSON.stringify(finalJSON)
    };
});
exports.returnJoke = functions.https.onCall(async (data, context) => {
    var uid;
    await admin.auth().verifyIdToken(data.token)
        .then(function (decodedToken) {
            uid = decodedToken.uid;
            return Promise;
        }).catch(function (error) {
        });
    var joke;
    var jokeId = data.id;
    console.log("pre joke get");
    await db.collection(uid).doc('jokeids').collection('jokes').doc(jokeId).get()
        .then(function (doc) {
            joke = doc;
            return Promise;
        }).catch(function (error) {
        });
    return {
        value: joke.data()
    }
});
function mapToObj(map){
    var obj = {}
    map.forEach(function(v, k){
        obj[k] = v
    })
    return obj
}