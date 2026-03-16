const { Client } = require('pg');
const fs = require('fs');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/elfatoora',
});

client.connect()
  .then(() => {
    fs.writeFileSync('pg-error.txt', 'Connected to PostgreSQL successfully');
    process.exit(0);
  })
  .catch((err) => {
    fs.writeFileSync('pg-error.txt', err.message);
    process.exit(1);
  });
