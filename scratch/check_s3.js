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
    const command2 = new ListObjectsV2Command({
        Bucket: "koushik-freedomshippingllc-reports",
        Prefix: "journal/"
    });
    const response2 = await s3Client.send(command2);
    console.log("S3 journal/ Prefix:", response2.Contents?.map(c => c.Key) || 'none');
    
    const command3 = new ListObjectsV2Command({
        Bucket: "koushik-freedomshippingllc-reports",
        Prefix: "journals/"
    });
    const response3 = await s3Client.send(command3);
    console.log("S3 journals/ Prefix:", response3.Contents?.map(c => c.Key) || 'none');

    const command4 = new ListObjectsV2Command({
        Bucket: "koushik-freedomshippingllc-reports",
        MaxKeys: 20
    });
    const response4 = await s3Client.send(command4);
    console.log("S3 Root Prefix:", response4.Contents?.map(c => c.Key) || 'none');
  } catch (err) {
    console.error(err);
  }
}
main();
