const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');

async function updateMasterPassword() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('infocart');
    const hashedPassword = await bcrypt.hash('India@12345', 10);
    const result = await db.collection('users').updateOne(
      { username: 'master' },
      { $set: { password: hashedPassword } }
    );
    if (result.modifiedCount === 1) {
      console.log('Master password updated successfully.');
    } else {
      console.log('Master user not found or password already up to date.');
    }
  } catch (err) {
    console.error('Error updating password:', err);
  } finally {
    await client.close();
  }
}

updateMasterPassword();