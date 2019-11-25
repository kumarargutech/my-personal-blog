import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

const withDB = async (operations, res) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', { useUnifiedTopology: true });
        var db = await client.db("my-blog");
        await operations(db);
        client.close();
    } catch (error) {
      res.status(500).send({message: "Error in connecting db", error});
    }
}

app.get("/api/articles/:name", async (req, res) => {
    console.log("welcome");
    const articleName = req.params.name;
    withDB(async (db) => {
        var articleInfo = await db.collection("articles").findOne({ name: articleName });
        res.status(200).json(articleInfo);
    }, res);
});

app.post("/api/articles/:name/upvote", async (req, res) => {
    const articleName = req.params.name;

    withDB(async (db) => {
        var articleInfo = await db.collection("articles").findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set' : {
                upvotes: articleInfo.upvotes + 1
            }});
        const updateInfo = await db.collection("articles").findOne({ name: articleName });
        res.status(200).json(updateInfo);
    });
});

app.post("/api/articles/:name/add-comment", async (req, res) => {
    const { username, comment } = req.body;
    const articleName = req.params.name;

    withDB(async (db) => {
        var articleInfo = await db.collection("articles").findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                comments: articleInfo.comments.concat({username, comment})
            }
        });
        const updateInfo = await db.collection("articles").findOne({ name: articleName });
        res.status(200).json(updateInfo);
    });
});

app.get('*', (req, res) => {
    res.sendfile(path.join(__dirname + '/build/index.html'));
});

app.listen(8000, () => console.log("Listen port 8000"));