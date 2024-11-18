import pg from 'pg';
import dotenv from 'dotenv';
import { pipeline } from 'node:stream/promises'
import fs from 'node:fs'
import { from as copyFrom } from 'pg-copy-streams'

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

console.log('Recreating tables...');
await db.query(`
-- Slet tabeller, så de kan oprettes igen
drop table if exists total_plastic_waste;
drop table if exists plastic_per_capita;
drop table if exists global_plastic_production;
drop table if exists recycling_info;
drop table if exists plastic_per_capita_temp;
drop table if exists total_plastic_waste_temp;
drop table if exists global_plastic_production_temp;
drop table if exists recycling_info_temp;
drop table if exists country;

-- Tabel til landeoplysninger
CREATE TABLE country (
    country_id SERIAL PRIMARY KEY,
    country_name TEXT NOT NULL UNIQUE,
    country_code TEXT NOT NULL CHECK (char_length(country_code) BETWEEN 2 AND 3)
);

-- Tabel til det samlede plastaffald per land
CREATE TABLE total_plastic_waste (
    waste_id SERIAL PRIMARY KEY,
    country_id INTEGER REFERENCES country,
    total_plastic_waste_mt NUMERIC
);

-- Tabel til plastaffald per capita per land
CREATE TABLE plastic_per_capita (
    per_capita_id SERIAL PRIMARY KEY,
    country_id INTEGER REFERENCES country,
    waste_kg_per_capita NUMERIC
);

-- Tabel til genanvendelsesraten per land
CREATE TABLE recycling_info (
    recycling_id SERIAL PRIMARY KEY,
    country_id INTEGER REFERENCES country,
    recycling_rate NUMERIC
);

-- Tabel til global plastic production
create table global_plastic_production (
	plastic_production_id serial primary key,
    country_id INTEGER REFERENCES country,
	year INTEGER NOT NULL CHECK (year >= 0 AND year <= 9999),
	plastic_production integer
);

-- Tabel til at temp overføre plastic_per_capita
create table plastic_per_capita_temp (
    Entity text,
    Code text,
    Year integer,
	per_capita_waste_kg numeric
);

-- Tabel til at temp overføre Plastic-waste-emitted-to-the-ocean
create table total_plastic_waste_temp (
Entity text,
Code text, 
year integer,
Mismanaged_waste_emitted_to_the_ocean_mt integer
);

-- Tabel til at temp overføre global plastics production
create table global_plastic_production_temp (
Entity text,
Code text,
Year integer,
Annual_plastic_production integer
);

-- Tabel til at temp overføre recycling rate
create table recycling_info_temp (
Country text,
Total_Plastic_Waste_MT numeric,
Main_Sources text,
Recycling_Rate numeric,
Per_Capita_Waste_KG numeric,
Coastal_Waste_Risk text
);
`);
console.log('Tables recreated.');

console.log('Copying data from CSV files...');
await copyIntoTable(db, `
	copy country (country_name, country_code)
	from stdin
	with (FORMAT csv, HEADER, DELIMITER ';')`, 'db/country_name-country_code.csv');
await copyIntoTable(db, `
    copy plastic_per_capita_temp (Entity, Code, Year, per_capita_waste_kg)
    from stdin
    with (FORMAT csv, HEADER, DELIMITER ';')`, 'db/plastic-waste-emitted-to-the-ocean-per-capita.csv');
await copyIntoTable(db, `
	copy total_plastic_waste_temp (Entity, Code, Year, Mismanaged_waste_emitted_to_the_ocean_mt)
	from stdin
	with (FORMAT csv, HEADER)`, 'db/plastic-waste-emitted-to-the-ocean.csv');
await copyIntoTable(db, `
	copy recycling_info_temp (Country, Total_Plastic_Waste_MT, Main_Sources, Recycling_Rate, Per_Capita_Waste_KG, Coastal_Waste_Risk)
	from stdin
	with (FORMAT csv, HEADER)`, 'db/Plastic Waste Around the World.csv');
await copyIntoTable(db, `
	copy global_plastic_production_temp (Entity, Code, Year, Annual_plastic_production)
	from stdin
	with (FORMAT csv, HEADER, DELIMITER ';')`, 'db/global-plastics-production.csv');
console.log('Data copied.');

console.log('Inserting data from temp tables into final tables...');
await db.query(`
   -- Insert into Global plastic production in tons
   insert into global_plastic_production (country_id, year, plastic_production)
select (select country_id from country where country_name = t.entity) as country_id,
      year,
      Annual_plastic_production
from   global_plastic_production_temp t;

   -- Insert into plastic waste per capita in kg
insert into plastic_per_capita (country_id, waste_kg_per_capita)
select (select country_id from country where country_name = ct.entity) as country_id,
     per_capita_waste_kg
from   plastic_per_capita_temp ct;

   -- Insert into recycling rate i %
INSERT INTO recycling_info (country_id, recycling_rate)
SELECT (SELECT country_id FROM country WHERE country_name = rt.country) AS country_id,
  rt.recycling_rate
FROM recycling_info_temp rt;

   -- Insert into global plastic waste in metric ton
INSERT INTO total_plastic_waste (country_id, total_plastic_waste_mt)
SELECT (SELECT country_id FROM country WHERE country_name = tt.entity) AS country_id,
  tt.mismanaged_waste_emitted_to_the_ocean_mt
FROM total_plastic_waste_temp tt;
`);
console.log('Data inserted into final tables.');

await db.end(); // Luk forbindelsespuljen til sidst
console.log('Database connection closed.');
    
async function copyIntoTable(db, sql, file) {
	const client = await db.connect();
	try {
		const ingestStream = client.query(copyFrom(sql))
		const sourceStream = fs.createReadStream(file);
		await pipeline(sourceStream, ingestStream);
	} finally {
		client.release();
	}
}
