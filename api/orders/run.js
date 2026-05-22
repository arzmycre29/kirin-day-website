// Cwd: d:/ProjectApp/Kirin Day Web/api/orders/run.js
const app = require('./server');
require('dotenv').config();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`  Kirin Day Direct Buy API Server is running     `);
  console.log(`  Local Address: http://localhost:${PORT}        `);
  console.log(`  Supabase Target: ${process.env.SUPABASE_URL || 'Not Configured'}`);
  console.log(`=================================================`);
});
