require('dotenv').config();
const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

async function main() {
  try {
    const command = new ListObjectsV2Command({
        Bucket: "koushik-freedomshippingllc-reports",
        Delimiter: '/'
    });
    const response = await s3Client.send(command);
    console.log("S3 Prefixes (Folders):", response.CommonPrefixes?.map(p => p.Prefix));
  } catch (err) {
    console.error(err);
  }
}
main();
