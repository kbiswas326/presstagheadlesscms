
const { MongoClient } = require('mongodb');

const uri = "mongodb://127.0.0.1:27017/sportzpoint"; 
const client = new MongoClient(uri);

async function run() {
  console.log("Starting script...");
  try {
    console.log("Connecting...");
    await client.connect();
    console.log("Connected.");
    const database = client.db('sportzpoint');
    const posts = database.collection('posts');

    console.log("Fetching distinct types...");
    const distinctTypes = await posts.distinct('type');
    console.log("Distinct post types:", distinctTypes);

  } catch (err) {
      console.error("Error occurred:", err);
  } finally {
    console.log("Closing connection...");
    await client.close();
  }
}
run();
