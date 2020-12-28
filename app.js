const express = require('express');
const bodyParser = require('body-parser');
const pg = require('pg');
const jsonfile = require('jsonfile');
const axios = require('axios').default;

const pool = new pg.Pool({
  user: 'christopherjames',
  host: 'localhost',
  database: 'memes',
  password: '',
  port: 5432,
});

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const formatTags = (tags) => {
  return tags.map((tag) => tag.trim());
};

const failedItems = [];
const currentPage = 0;
const perPage = 250;

const endpoint = `https://api.memes.zikoko.com:8108/collections/meme/documents/search?q=*&query_by=title,%20source,%20tags&per_page=${perPage}&page=${
  currentPage + 1
}&max_hits=10000&sort_by=updatedTs:desc`;

const saveMemeToDB = (meme, index) => {
  const {
    meme_url,
    width,
    height,
    tags,
    source,
    title,
    color,
    meme_name,
  } = meme;
  pool
    .query(
      'INSERT INTO memes (meme_url, width, height, tags, source, title, color, meme_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [meme_url, width, height, tags, source, title, color, meme_name]
    )
    .then(() =>
      console.log(
        `Inserted memes for page: ${currentPage + 1}, index: ${index}\n`
      )
    )
    .catch((err) => {
      failedItems.push({ meme, error: err.detail });
      jsonfile.writeFile('./error-logs/list.json', failedItems, (err) => {
        if (err) {
          console.log(err);
        }
      });
      console.log(
        `Failed to insert meme for page: ${
          currentPage + 1
        }, index: ${index}\n${err}\n\n`
      );
    });
};

axios({
  url: endpoint,
  method: 'GET',
  responseType: 'json',
  headers: {
    'x-typesense-api-key': '0xjsgkrWuycbPmLS5E78yl41QX5fbNMd',
  },
})
  .then((res) => {
    const { hits } = res.data;

    if (hits.length > 0) {
      hits.map((hit, index) => {
        const { document } = hit;
        const meme_url = document.url;
        const width = document.width;
        const height = document.height;
        const tags = formatTags(document.tags);
        const source = document.source;
        const title = document.title;
        const color = document.color;
        const id = document.id;

        const field = { meme_url, width, height, tags, source, title, color };

        const memeTitle = `african-meme-${id}`;
        const fields = {
          ...field,
          title: title || memeTitle,
          meme_name: memeTitle,
        };

        saveMemeToDB(fields, index);
      });
    } else {
      console.log('No more memes to find');
    }
  })
  .catch(() => {
    console.log(err);
  });

