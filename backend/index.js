// index.js
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;
const { MongoClient } = require('mongodb');

// CORS設定を許可（全てのオリジンからのアクセスを許可）
app.use(cors());
app.use(express.json()); // 追加: JSONデータを解析するためのミドルウェア

// 環境変数からMongoDB URIを取得
const mongoUri = process.env.MONGODB_URI;
const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

let votesCollection;

async function connectToDatabase() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db('votes_db');
        votesCollection = db.collection('votes');
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
}

// データベース接続を確立してからサーバーを起動
connectToDatabase().then(() => {
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
});

app.get('/', async (req, res) => {
    try {
        const totalVotes = await votesCollection.countDocuments({});
        const choicesCount = {
            1: await votesCollection.countDocuments({ choice: 1 }),
            2: await votesCollection.countDocuments({ choice: 2 }),
            3: await votesCollection.countDocuments({ choice: 3 })
        };
        const choices = [
            { id: 1, name: "学生の売店", color: "#FF7A00", percent: totalVotes ? Math.round(choicesCount[1] / totalVotes * 100) : 0 },
            { id: 2, name: "キッチンカー", color: "#3623E7", percent: totalVotes ? Math.round(choicesCount[2] / totalVotes * 100) : 0 },
        ];
        const question = "どっちが良かった？"
        const data = {choices:choices,msg:"ok",question:question}
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: 'データベースへの接続に失敗しました', error: err.message });
    }
});

app.post('/', async (req, res) => {
    const { choice, kind } = req.body;
    if (![1, 2, 3].includes(choice)) {
        return res.status(401).json({ error: 'Invalid choice' });
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
        ];

        res.json({ msg: 'Vote added', choices: choices });
    } catch (error) {
        console.error(error);
        res.status(502).json({ error: 'Noooo' });
    }
});

app.post('/status', async (req, res) => {
    const { status } = req.body;
    if (![1, 2, 3].includes(choice)) {
        return res.status(401).json({ error: 'Invalid choice' });
    }
    try {
        res.json({ msg: 'status received. Thank you.', status: status });
    } catch (error) {
        console.error(error);
        res.status(502).json({ error: 'No' });
    }
});
