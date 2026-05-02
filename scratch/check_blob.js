require('dotenv').config();
const { list } = require('@vercel/blob');

async function main() {
  try {
    const { blobs } = await list({
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    console.log("Vercel Blobs:", blobs.map(b => b.url));
  } catch (err) {
    console.error(err);
  }
}
main();
