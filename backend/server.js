import express from "express";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();
console.log("Connecting to database", process.env.PG_DATABASE);
const db = new pg.Pool({
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT),
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  ssl: process.env.PG_REQUIRE_SSL
    ? {
        rejectUnauthorized: false,
      }
    : undefined,
});
const dbResult = await db.query("select now()");
console.log("Database connection established on", dbResult.rows[0].now);

const port = process.env.PORT || 3000;
const server = express();

server.use(express.static("test_fede"));
server.use(onEachRequest);
server.get("/api/percapita", onGetPerCapita);
server.get("/api/totalwaste", onGetTotalWaste);
server.get("/api/recycleinfo", onGetRecycleInfo);
server.get("/api/linechart", onGetLineChart);
server.listen(port, onServerReady);

async function onGetPerCapita(request, response) {
  const countryId = request.query.countryId;
  const dbResult = await db.query(
    `select c.country_id, c.country_name, c.country_code, pc.waste_kg_per_capita
from country c
inner join plastic_per_capita pc on c.country_id = pc.country_id
where c.country_code = $1`,[countryId]
  );
  response.send(dbResult.rows);
}

async function onGetTotalWaste(request, response) {
  const countryId = request.query.countryId;
  const dbResult = await db.query(
    `select c.country_id, c.country_name, c.country_code, tpw.total_plastic_waste_mt
from country c
inner join total_plastic_waste tpw on c.country_id = tpw.country_id
where c.country_code = $1`,[countryId]
  );
  response.send(dbResult.rows);
}

async function onGetRecycleInfo(request, response) {
  const countryId = request.query.countryId;
  const dbResult = await db.query(
    `select c.country_id, c.country_name, c.country_code, ri.recycling_rate
from country c
inner join recycling_info ri on c.country_id = ri.country_id
where c.country_code = $1`,[countryId]
  );
  response.send(dbResult.rows);
}

async function onGetLineChart(request, response) {
  const dbResult = await db.query(`
select year, plastic_production
from global_plastic_production`);
  response.send(dbResult.rows);
}

function onEachRequest(request, response, next) {
  console.log(new Date(), request.method, request.url);
  next();
}

function onServerReady() {
  console.log("Webserver running on port", port);
}
