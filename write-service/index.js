const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const Minio = require('minio');
const DatabaseService = require("./DatabaseService.js");
const FormData = require('form-data');
const axios = require('axios');


// Constants
const PORT = 3000;
const minioClient = new Minio.Client({
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: 'wBl9YHNf6XXfdMbWu0MS',
  secretKey: 'fpmlcbSbmge864KjPCwLn3WJ6PvQzblhqPCs8zaM',
});

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
const upload = multer({ dest: 'uploads/' });

// API Endpoints
app.get('/api/v1/', (req,res)=>{
    res.send("Server running...");
})
app.get('/api/v1/user/post/:postId', (req, response) => {
    const postId = req.params.postId; // Access the postId from route parameters
    console.log("Getting post with Id=" + postId);

    if (!postId) {
        return response.status(400).json({ message: 'postId is required' });
    }

    DatabaseService.executeQuery('SELECT users.userId, postId, username, textContent, imageContent FROM posts, users WHERE users.userId=posts.userId and posts.postId=' + postId)
        .then((result) => {
            response.status(200).send({ "postContent": result });
        });
});
app.get('/api/v1/user/post', (req, response) => {
    const userId = req.query.userId;
    console.log("GETTING TIMELINE CONTENT");

    if (!userId) {
	return response.status(400).json({ message: 'userId is required' });
    }
    
    DatabaseService.executeQuery('SELECT users.userId, postId, username, textContent, imageContent FROM posts, users WHERE users.userId=posts.userId and users.userId!='+userId)
	.then((result)=>{
	    const posts = shuffleArray(result);

	    response.status(200).send({"posts":posts});
	});
});

app.post('/api/v1/user/post', upload.single('imageContent'), (req, res) => {
    const textContent = req.body.textContent;
    const imageContent = req.file;
    const userId = req.body.userId;

    console.log("UPLOAD POST");
    console.log(req.body);

    if (!req.file) {
        console.log("No image found. Inserting text only.");
        DatabaseService.executeQuery(`INSERT INTO posts(userId, textContent, imageContent) VALUES(${userId}, '${textContent}', 'noimage');`)
        .then((respond)=>{
            console.log(respond.insertId);
            DatabaseService.executeQuery('SELECT * FROM users WHERE userid!='+userId)
                .then((userList)=>{
                for(let i=0; i<userList.length; i++){
                    const tempUserId = userList[i]['userid'];
                    DatabaseService.executeQuery(`INSERT INTO notification(postId, userId, notificationMessage, pSeen) VALUES(${respond.insertId}, '${tempUserId}', '${getFirstSentence(textContent)}', 0);`);
                }
            })
            })
        return res.status(200).send({"message":"Post uploaded."});
    }

    const filePath = req.file.path;
    const metaData = {
	'Content-Type': req.file.mimetype,
    };

    const bucketName = 'posts'; // Replace with your desired bucket name
    const objectName = req.file.originalname;
    const imageName = req.file.originalname; // Save the image name

    minioClient.fPutObject(bucketName, objectName, filePath, metaData, (err, etag) => {
	if (err) {
	    console.log(err);
	    return res.status(500).send('Error uploading the image.');
	}
	
	console.log('Image uploaded successfully: ' + objectName);
	
	// Save the image name and object name association in the array
    const serverUrl = 'http://localhost:9000';
    const bucketName = 'posts';
    const imageUrl = `${serverUrl}/${bucketName}/${objectName}`;

	DatabaseService.executeQuery(`INSERT INTO posts(userId, textContent, imageContent) VALUES(${userId}, '${textContent}', '${imageUrl}');`)
	    .then((respond)=>{
		console.log(respond.insertId);
		DatabaseService.executeQuery('SELECT * FROM users WHERE userid!='+userId)
		    .then((userList)=>{
			for(let i=0; i<userList.length; i++){
				const tempUserId = userList[i]['userid'];
				DatabaseService.executeQuery(`INSERT INTO notification(postId, userId, notificationMessage, pSeen) VALUES(${respond.insertId}, '${tempUserId}', '${getFirstSentence(textContent)}', 0);`);
			}

			return res.status(200).send({'message':'Image uploaded successfully.'});
		    })
		})
		
    });
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
