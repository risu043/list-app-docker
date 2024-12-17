const express = require('express');
const { createConnection } = require('mysql2/promise');

// MySQL への接続の際に環境変数が設定されている場合はそれを使うように設定。
const DB_HOST = process.env.DB_HOST || 'db';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || 'some-random-password-yay';
const DB_NAME = process.env.DB_NAME || 'list_app_db';

const startServer = async () => {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json());
  app.use(express.static('public'));
  app.use(express.urlencoded({ extended: true }));

  // MySQLデータベースへの接続
  const connection = await createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    timezone: 'Z',
  });

  app.get('/', (req, res) => {
    res.render('top.ejs');
  });

  app.get('/index', async (req, res) => {
    try {
      const [results] = await connection.query('SELECT * FROM users');
      res.render('index.ejs', { items: results });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).send('An error occurred while fetching users');
    }
  });

  // メモ追加画面へ
  app.get('/new', (req, res) => {
    res.render('new.ejs');
  });

  // 追加画面のメモを追加する
  app.post('/create', async (req, res) => {
    try {
      await connection.query('INSERT INTO users (content) VALUES (?)', [
        req.body.itemName,
      ]);
      res.redirect('/index');
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).send('An error occurred while creating a user');
    }
  });

  // メモを削除する
  app.post('/delete/:id', async (req, res) => {
    try {
      await connection.query('DELETE FROM users WHERE id = ?', [req.params.id]);
      res.redirect('/index');
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).send('An error occurred while deleting a user');
    }
  });

  // メモを編集する
  app.get('/edit/:id', async (req, res) => {
    try {
      const [results] = await connection.query(
        'SELECT * FROM users WHERE id = ?',
        [req.params.id]
      );
      res.render('edit.ejs', { item: results[0] });
    } catch (error) {
      console.error('Error fetching user for edit:', error);
      res.status(500).send('An error occurred while fetching user for edit');
    }
  });

  // 編集画面のメモを更新する
  app.post('/update/:id', async (req, res) => {
    try {
      await connection.query('UPDATE users SET content=? WHERE id=?', [
        req.body.itemName,
        req.params.id,
      ]);
      res.redirect('/index');
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).send('An error occurred while updating a user');
    }
  });

  // サーバーを終了したときに MySQL への接続を切断する
  app.on('close', () => connection.end());

  const server = app.listen(port, () => {
    console.log(
      `Server is running. See http://localhost:${port}/messages to get messages.`
    );
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
};

startServer();
