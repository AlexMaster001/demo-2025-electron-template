import { Client } from 'pg';

export default async () => {
  const client = new Client({
    user: 'postgres',
    password: '1234',
    host: 'localhost',
    port: '5433',
    database: 'demo_2025',
  });

  try {
    await client.connect();
    return client;
  } catch (error) {
    console.error('Failed to connect to PostgreSQL:', error);
    throw error; 
  }
};