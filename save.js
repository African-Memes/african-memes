const path = require('path');
const pg = require('pg');

const jsonfile = require('jsonfile');
const download = require('image-downloader');

const pool = new pg.Pool({
  user: 'christopherjames',
  host: 'localhost',
  database: 'memes',
  password: '',
  port: 5432,
});

let page = 0;
const perBatch = 10;

const failedItems = [];

const interval = setInterval(() => {
  console.log(page);
  pool
    .query('SELECT meme_url, meme_name FROM memes LIMIT $1 OFFSET $2', [
      perBatch,
      `${perBatch * page + 1}`,
    ])
    .then((res) => {
      if (res && res.rows.length) {
        res.rows.forEach((row) => {
          options = {
            url: row.meme_url,
            dest: `./memes/${row.meme_name}${path.extname(row.meme_url)}`,
          };
          download
            .image(options)
            .then(({ filename }) => {
              console.log('Downloaded', filename);
            })
            .catch((err) => {
              console.error(err);
              failedItems.push({
                url: meme_url,
                meme_name: meme_name,
                error: err,
              });
            });
        });
      } else {
        clearInterval(interval);
      }
    })
    .catch((err) => {
      console.log(err);
    });

  page++;
}, 10000);

jsonfile.writeFile('./error-logs/list.json', failedItems, (err) => {
  if (err) {
    console.log(err);
  }
});
