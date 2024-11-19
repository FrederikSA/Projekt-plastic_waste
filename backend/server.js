import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';


dotenv.config();
console.log('Connecting to database', process.env.PG_DATABASE);
const db = new pg.Pool({
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT),
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    ssl: process.env.PG_REQUIRE_SSL ? {
        rejectUnauthorized: false,
    } : undefined,
});
const dbResult = await db.query('select now()');
console.log('Database connection established on', dbResult.rows[0].now);

const port = process.env.PORT || 3000;
const server = express();

 /*
server.use(express.static('frontend'));
server.use(onEachRequest);
server.get('/api/albums', onGetAlbums);
server.listen(port, onServerReady);

async function onGetAlbums(request, response) {
    const query = request.query;
    const start = query.start;
    const end = query.end;
    const dbResult = await db.query(`
        Skriv en vilkårlig select`,
        [start, end]);
    response.send(dbResult.rows);
}
 */

function onEachRequest(request, response, next) {
    console.log(new Date(), request.method, request.url);
    next();
}

function onServerReady() {
    console.log('Webserver running on port', port);
}