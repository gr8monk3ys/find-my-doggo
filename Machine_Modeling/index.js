 // GCPP Cloud Functiion
 const automl = require('@google-cloud/automl').v1beta1; // v0.1.3
 const {Storage} = require( '@google-cloud/storage'); // v2.4.2
 const admin = require('firebase-admin'); // v7.0.0
 
 admin.initializeApp();
 let db = admin.firestore();
 const storage = new Storage();
 const myBucket = storage.bucket('find-my-doggo-vcm');
 
 const client = new automl.PredictionServiceClient();
 
 const projectId = 'find-my-doggo'
 const computeRegion = 'us-central1';
 const modelId = 'ICN5670580750199517716';
 const scoreThreshold = '0.5';
 
 const modelFullId = client.modelPath(projectId, computeRegion, modelId);
 
 exports.determineDog = (data, context) => {
  console.log(`Processing file: ${data.name}`);
   const name = data.name;
   const content = `gs://find-my-doggo-vcm/${data.name}`;
   const file = myBucket.file(data.name);
   
   const params = {};
   
   if(scoreThreshold) {
     params.score_threshold = scoreThreshold;
   }
   
   file.download().then(imageData => {
     const image = imageData[0];
     const buffer = image.toString('base64');
     const payload = {};
     payload.image = {
       imageBytes: buffer
     };
   
     let displayName, score;
 
     async function Predict() {
       const [response] = await client.predict({
         name: modelFullId,
         payload: payload,
         params: params,
       });
 
       console.log(`Predicion results:`);
       response.payload.forEach(result => {
         console.log(`Predicted class name: ${result.displayName}`);
         displayName = result.displayName;
         console.log(`Predicted class name: ${result.classification.score}`);
         score = result.classification.score;
       });
 
       let docRef = db.collection(`dog_types`).doc(name);
       let setPrediction = docRef.set({
         date: new Date(), 
         displayName: displayName,
         file: content,
         score: score,
       });
     }
     Predict();
   });
 };
 