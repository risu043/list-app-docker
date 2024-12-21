const express = require('express');
const { createConnection } = require('mysql2/promise');

// MySQL への接続の際に環境変数が設定されている場合はそれを使うように設定。
const DB_HOST = process.env.DB_HOST || 'db';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || 'some-random-password-yay';
const DB_NAME = process.env.DB_NAME || 'list_app_db';
const DB_SOCKET_PATH = process.env.DB_SOCKET_PATH;

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
    // When `socketPath` is defined, `host` is ignored.
    socketPath: DB_SOCKET_PATH,
    // Timezone on MySQL must be set to UTC.
    timezone: 'Z',
  });

  app.get('/', (req, res) => {
    res.render('top.ejs');
  });

  app.get('/index', async (req, res) => {
    try {
      const [results] = await connection.query('SELECT * FROM messages');
      res.render('index.ejs', { items: results });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).send('An error occurred while fetching messages');
    }
  });

  // メモ追加画面へ
  app.get('/new', (req, res) => {
    res.render('new.ejs');
  });

  // 追加画面のメモを追加する
  app.post('/create', async (req, res) => {
    try {
      await connection.query('INSERT INTO messages (content) VALUES (?)', [
        req.body.itemName,
      ]);
      res.redirect('/index');
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).send('An error occurred while creating a messages');
    }
  });

  // メモを削除する
  app.post('/delete/:id', async (req, res) => {
    try {
      await connection.query('DELETE FROM messages WHERE id = ?', [
        req.params.id,
      ]);
      res.redirect('/index');
    } catch (error) {
      console.error('Error deleting messages:', error);
      res.status(500).send('An error occurred while deleting a messages');
    }
  });

  // メモを編集する
  app.get('/edit/:id', async (req, res) => {
    try {
      const [results] = await connection.query(
        'SELECT * FROM messages WHERE id = ?',
        [req.params.id]
      );
      res.render('edit.ejs', { item: results[0] });
    } catch (error) {
      console.error('Error fetching messages for edit:', error);
      res
        .status(500)
        .send('An error occurred while fetching messages for edit');
    }
  });

  // 編集画面のメモを更新する
  app.post('/update/:id', async (req, res) => {
    try {
      await connection.query('UPDATE messages SET content=? WHERE id=?', [
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
      `Server is running. See http://localhost:${port} to get messages.`
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
