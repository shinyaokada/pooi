require('dotenv').config();


const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;


const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

// CORS設定
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  

//const uri = 'mongodb://localhost:27017';
console.log('MONGODB_URI:', process.env.MONGODB_URI);
const client = new MongoClient(process.env.MONGODB_URI);
//const client = new MongoClient(uri);
const dbName = 'votes_db';

client.connect().then(() => {
    console.log('MongoDB connected');
    const db = client.db(dbName);
    const votesCollection = db.collection('votes');

    // GETリクエストで投票数の集計を返すエンドポイント
    app.get('/votes', async (req, res) => {
        console.log('GET /votes accessed');
        try {
            const totalVotes = await votesCollection.countDocuments({});
            const choicesCount = {
                1: await votesCollection.countDocuments({ choice: 1 }),
                2: await votesCollection.countDocuments({ choice: 2 }),
                3: await votesCollection.countDocuments({ choice: 3 })
            };

            const choices = [
                { id: 1, name: "とりにく", color: "#FF5900", percent: totalVotes ? Math.round(choicesCount[1] / totalVotes * 100) : 0 },
                { id: 2, name: "ぎゅうにく", color: "#1e00ff", percent: totalVotes ? Math.round(choicesCount[2] / totalVotes * 100) : 0 },
                { id: 3, name: "ぶたにく", color: "#15792f", percent: totalVotes ? Math.round(choicesCount[3] / totalVotes * 100) : 0 }
            ];

            const title = "どのお肉が好きですか？"

            res.json(choices);
        } catch (error) {
            console.error(error);
            res.status(501).json({ error: 'なんか違う' });
        }
    });

    
    // POSTリクエストで新しい投票を追加するエンドポイント
    app.post('/votes', async (req, res) => {
        console.log('POST /votes accessed');
        const { choice, kind } = req.body;

        if (![1, 2, 3].includes(choice)) {
            return res.status(400).json({ error: 'Invalid choice' });
        }

        try {
            await votesCollection.insertOne({ choice, kind: Boolean(kind) });

            // 投票データを追加した後、再度集計データを取得する
            const totalVotes = await votesCollection.countDocuments({});
            const choicesCount = {
                1: await votesCollection.countDocuments({ choice: 1 }),
                2: await votesCollection.countDocuments({ choice: 2 }),
                3: await votesCollection.countDocuments({ choice: 3 })
            };

            const choices = [
                { id: 1, name: "とりにく", color: "#FF5900", percent: totalVotes ? Math.round(choicesCount[1] / totalVotes * 100) : 0 },
                { id: 2, name: "ぎゅうにく", color: "#1e00ff", percent: totalVotes ? Math.round(choicesCount[2] / totalVotes * 100) : 0 },
                { id: 3, name: "ぶたにく", color: "#15792f", percent: totalVotes ? Math.round(choicesCount[3] / totalVotes * 100) : 0 }
            ];

            res.json({ msg: 'Vote added', choices:choices });
        } catch (error) {
            console.error(error);
            res.status(502).json({ error: 'Noooo' });
        }
    });
}).catch(console.error);

// Add a catch-all route for debugging
app.use('*', (req, res) => {
    console.log(`Accessed undefined route: ${req.method} ${req.url}`);
    res.status(455).json({ error: 'Not Found nida' });
});

module.exports = app;

