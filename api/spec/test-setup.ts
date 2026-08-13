import 'reflect-metadata';
process.env.JWT_SECRET = 'test-secret';
// Db's constructor refuses to start under NODE_ENV=test unless DB_DATABASE names a
// test schema. Unit tests never open a socket (knex connects lazily), but the name
// still has to satisfy that guard or the module graph dies on load. dotenv does not
// override values already in process.env, so this wins over a developer's .env.
process.env.DB_DATABASE = process.env.DB_DATABASE || 'ctr_test';
