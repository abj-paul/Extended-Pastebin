const mysql = require("mysql2");

// Global Constants & Variables 
const DATABASE_HOST = "localhost";
const DATABASE_USER = "abhidb";
const DATABASE_PASSWORD = "admin";
const DATABASE_NAME = "DeSo";

let DB_CONNECTION = null;

// Functions
async function __connect(){
    return new Promise((resolve, reject)=>{
        DB_CONNECTION = mysql.createConnection({
            host: DATABASE_HOST,
            user: DATABASE_USER,
            password: DATABASE_PASSWORD,
            database: DATABASE_NAME
            });
        
            DB_CONNECTION.connect();
            console.log("Connected to database "+DATABASE_NAME + " successfully, hosted in "+DATABASE_HOST);
            resolve(DB_CONNECTION);
    });
}

async function createTable(table_name, sql_query){
    if(DB_CONNECTION==null)
	await __connect();

    return new Promise((resolve, reject)=>{
        DB_CONNECTION.query(sql_query, (err, results, fields)=>{
            if(err) throw err;
            console.log(table_name+" Table has been created successfully!");
            resolve(true);
        })
    });
}


async function executeQuery(sql_query){
    if(DB_CONNECTION==null)
	await __connect();

    return new Promise((resolve, reject)=>{
        DB_CONNECTION.query(sql_query, (err, results, fields)=>{
            if(err) {
                console.log("ERROR in database service!");
                reject(err);
            }
	    console.log(`Executed Query '${sql_query}'`);
            resolve(results);
        });
    });
}

function getDBConnection(){
    if(DB_CONNECTION==null) __connect();
    return DB_CONNECTION;
}

module.exports = { getDBConnection, createTable, executeQuery}
