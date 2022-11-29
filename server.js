// Built-in Node.js modules
let fs = require('fs');
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');


let db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');

let app = express();
let port = 8000;

app.use(express.json());

// Open SQLite3 database (in read-only mode)
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.log('Error opening ' + path.basename(db_filename));
    }
    else {
        console.log('Now connected to ' + path.basename(db_filename));
    }
});


// GET request handler for crime codes
app.get('/codes', (req, res) => {
    console.log(req.query); // query object (key-value pairs after the ? in the url)
    
    let query = 'SELECT Codes.code, Codes.incident_type FROM Codes';
    let params = [];
    if(req.query.hasOwnProperty('code')){
        let code = req.query.code.split(',');
        query = query + ' WHERE Codes.code IN (?';
        params.push(parseFloat(code[0]));
        if(code.length > 1) {
            for(let j = 1; j < code.length; j++) {
                query = query + ', ?';
                params.push(parseFloat(code[j]));
            }
        }

        query = query + ');';
    };

    db.all(query, params, (err, rows) => {
        console.log(err);
        
        let data = [];
        for (i = 0; i < rows.length; i++){
            data[i] = {"code":rows[i].code,"type":rows[i].incident_type};
        }
        console.log(data);

        

    });

    res.status(200).type('json').send('OK'); // <-- you will need to change this
});

// GET request handler for neighborhoods
app.get('/neighborhoods', (req, res) => {
    console.log(req.query); // query object (key-value pairs after the ? in the url)

    let query = 'SELECT Neighborhoods.neighborhood_number AS id, Neighborhoods.neighborhood_name AS name FROM Neighborhoods';

    let params = [];
    let clause = 'WHERE';

    //get id and then get name of neighborhood
    if (req.query.hasOwnProperty('id')){
        let id = req.query.id.split(',');
        query = query + ' ' + clause + ' Neighborhoods.neighborhood_number IN (?';
        if(id.length > 0) {
            for(let j = 0; j < id.length; j++) {
                query = query + ', ?';
                params.push(id[j]);
            }
        }
        query = query + ')';
        clause = 'AND';
    }

    if (req.query.hasOwnProperty('name')){
        query = query + ' ' + clause + ' Neighborhoods.neighborhood_name = ?';
        params.push(req.query.name);
        clause = 'AND';
    }
    
    console.log(query);

    db.all(query, params, (err, rows) => {
        console.log(err);
        
        let data = [];
        for (i = 0; i < rows.length; i++){
            data[i] = {"id":rows[i].id, "name":rows[i].name};

        }
        console.log(data);
        res.status(200).type('json').send(data);
    });

    //res.status(200).type('json').send({}); // <-- you will need to change this
    
});

// GET request handler for crime incidents
app.get('/incidents', (req, res) => { 
    console.log(req.query); // query object (key-value pairs after the ? in the url)
    
    let query = 'SELECT Incidents.case_number, Incidents.date_time, Incidents.code, \
    Incidents.incident, Incidents.police_grid, Incidents.neighborhood_number, Incidents.block FROM Incidents';
    
    let params = [];
    let clause = 'WHERE';
    if(req.query.hasOwnProperty('start_date')){
        query = query + ' ' + clause + ' Incidents.date_time >= ?';
        params.push(req.query.start_date);
        clause = 'AND';
    }
    if(req.query.hasOwnProperty('end_date')){
        query = query + ' ' + clause + ' Incidents.date_time <= ?';
        params.push(req.query.end_date);
        clause = 'AND';
    }
    if(req.query.hasOwnProperty('code')){
        let code = req.query.code.split(',');
        query = query + ' ' + clause + ' Incidents.code IN (?';
        params.push(code[0]);
        if(code.length > 0) {
            for(let j = 1; j < code.length; j++) {
                query = query + ' , ?';
                params.push(code[1]);
            }
        }
        query = query + ')';
        clause = 'AND';
    }
    if(req.query.hasOwnProperty('grid')){
        let split_grid = req.query.grid.split(',');
        query = query + ' ' + clause + ' Incidents.police_grid IN (?';
        params.push(split_grid[0]);
        if(split_grid.length > 0) {
            for(let j = 1; j < split_grid.length; j++) {
                query = query + ' , ?';
                params.push(split_grid[1]);
            }
        }
        query = query + ')';
        clause = 'AND';
    }
    if(req.query.hasOwnProperty('neighborhood')){
        let neighborhood_num = req.query.neighborhood.split(',');
        query = query + ' ' + clause + ' Incidents.neighborhood_number IN (?';
        params.push(neighborhood_num[0]);
        if(neighborhood_num.length > 0) {
            for(let j = 1; j < neighborhood_num.length; j++) {
                query = query + ' , ?';
                params.push(neighborhood_num[1]);
            }
        }
        query = query + ')';
        clause = 'AND';
    }
    
    query = query + ' ORDER BY Incidents.date_time DESC';
    
    if(req.query.hasOwnProperty('limit')){
        query = query + ' LIMIT ?';
        params.push(req.query.limit);
    } else {
        query = query + ' LIMIT 1000';
    }

    
    db.all(query, params, (err, rows) => {
        console.log(err);
      
        let data = [];
        let dateTime = [];
        for (i = 0; i < rows.length; i++) {
            dateTime =rows[i].date_time.split('T');

            data[i] = {"case_number":rows[i].case_number, "date":dateTime[0], "time":dateTime[1], 
            "code":rows[i].code, "incident":rows[i].incident, "police_grid":rows[i].police_grid,
            "neighborhood_number":rows[i].neighborhood_number, "block":rows[i].block};
        }
        console.log(data);
        
        res.status(200).type('json').send(data);
    });

});

// PUT request handler for new crime incident
app.put('/new-incident', (req, res) => {
    console.log(req.body); // uploaded data
    
    res.status(200).type('txt').send('OK'); // <-- you may need to change this
});

// DELETE request handler for new crime incident
app.delete('/remove-incident', (req, res) => {
    console.log(req.body); // uploaded data
    
    res.status(200).type('txt').send('OK'); // <-- you may need to change this
});


// Create Promise for SQLite3 database SELECT query 
function databaseSelect(query, params) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(rows);
            }
        })
    })
}

// Create Promise for SQLite3 database INSERT or DELETE query
function databaseRun(query, params) {
    return new Promise((resolve, reject) => {
        db.run(query, params, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    })
}


// Start server - listen for client connections
app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
