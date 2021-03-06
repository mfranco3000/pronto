var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');
var ejs = require('ejs');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');

var idVente ="";
/*
* Creation du serveur Web écoutant sur le port 3000
*/
var server;
makeServeur();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use('/views', express.static(path.resolve(__dirname, 'views')));
app.use('/public', express.static(path.resolve(__dirname, 'public')));

// Module utilisés
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/*
* Chemin vers les fichiers Router des pages de l'application
*/
var index = require('./routes/index');
var bar = require('./routes/bar');
var cuisine = require('./routes/cuisine');
var caisse = require('./routes/caisse');

/*
* Utilisation d'un Router spécifique en fonction de la ressource demandée
*/
app.use('/', index);
app.use('/bar', bar);
app.use('/cuisine', cuisine);
app.use('/CaisseEnregistreuse', caisse);

/*
* Création d'un socket pour l'envoi des données vers la cuisine
*/
var nspCuisine = io.of('/cuisine');
nspCuisine.on('connection', function(socket){
    console.log('cuisine connected');

    socket.on('disconnect', function(){
        console.log('cuisine disconnected');
    });
});

/*
 * Création d'un socket pour l'envoi des données vers le bar
 */
var nspBar = io.of('/bar');
nspBar.on('connection', function(socket){
    console.log('bar connected');

    socket.on('disconnect', function(){
        console.log('bar disconnected');
    });
});

/*
 * Création d'un socket pour l'envoi des données vers la caisse
 */
var nspCaisseEnregistreuse = io.of('/CaisseEnregistreuse');
nspCaisseEnregistreuse.on('connection', function(socket){
    console.log('Caisse Enregistreuse connected');

    socket.on('disconnect', function(){
        console.log('Caisse Enregistreuse disconnected');
    });
});



var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');

// Connection URL
var url = 'mongodb://localhost:27017/db';


/*
 * Fonction d'insertion MongoDB
 */
var insertDocuments = function(db, callback,data) {
    // Get the documents collection
    var collection = db.collection('documents');
    // Insert some documents
    collection.insert(
        data, function(err, result) {
            console.log("success");
            callback(result);
        });
};

/*
 * Fonction de recherche MongoDB
 */
var findDocuments = function(db, callback) {
    // Get the documents collection
    var collection = db.collection('documents');
    // Find some documents
    collection.find({}).toArray(function(err, docs) {
        assert.equal(err, null);
        console.log("Found the following records");
        console.log(docs);
        callback(docs);
    });
};

/*
 * Fonction de suppression MongoDB
 */
var deleteDocument = function(db, callback,data) {
    // Get the documents collection
    var collection = db.collection('documents');
    // Insert some documents
    collection.deleteOne({ idCommande : data }, function(err, result) {
        assert.equal(err, null);
        assert.equal(1, result.result.n);
        console.log("Removed the document with the field a equal to idcom");
        callback(result);
    });
};


/*
 * Etablissement de la connexion à la DB SQL
 */
var mySqlClient = mysql.createConnection({
    host     : "localhost",
    user     : "root",
    password : "mpolkiuj",
    database : "pronto"
});

/*
 * Stockage des login/pwd dans un tableau
 */
var loginResult = new Object();

/*
 * queries select
 */
var queryLogin = 'SELECT IdServeur, Pass FROM serveurs';

DBQueryLogin(queryLogin,loginResult,'IdServeur','Pass');

/*
 * Fonction de query select des login/pwd dans la DB SQL
 */
function DBQueryLogin(query,receive,key,value){
    mySqlClient.query(query,
        function select(error, results, fields) {
            if ( results.length > 0 )  {
                for(i in results){
                    receive[results[ i ][key]] = results[ i ][value];
                }

            } else console.log("Pas de données");
        });


}



/*
 * Reception des données venant de l'interface du garçon de salle
 */
app.post('/process_post', function (req, res) {
    var commande = req.body;
    if(commande != ""){
        res.sendStatus(200);
        reception(commande);
        console.log('----');
    } else res.sendStatus(500);

});


/*
 * Reception des données venant du formulaire Login
 */
app.post('/login_post', function (req, res) {
    console.log(loginResult);
    var user_name=req.body.user;
    var password=req.body.password;
    console.log("User name = "+user_name+", password is "+password);
    var rs = ckL(user_name,password);
    console.log(rs);
    if(!rs)res.sendStatus(500);
    else res.sendStatus(200);
});

/*
 * Fonction de vérification du Login utilisateur
 */
function ckL(usr,pwd){
    var tab = Object.keys(loginResult);
    if(tab.indexOf(usr) != -1){
        console.log("login ok");
        if(loginResult[usr] == pwd) {
            console.log("Pass ok");
            return true;


        } else{
            console.log("Pass nok");
            return false;
        }
    } else {
        console.log("login nok");
        return false;
    }


}

/*
 * Reception des données venant de la caisse
 */
app.post('/caisse_post', function (req, res) {
    var commande = req.body;
    //commande = com;
    if(commande.length != 0) {
        res.sendStatus(200);
        enregistrementVente(commande,enregistreElemCom);
    } else res.sendStatus(500);


});

/*
 * Fonction Time
 */
function getTime() {
    var d = new Date();
    var day = d.getDate()+"";
    if(day.length<2) day = "0"+day;
    var month = d.getMonth()+1+"";
    if(month.length<2) month = "0"+month;
    var year = d.getFullYear();
    var hour = d.getHours()+"";
    if(hour.length<2) hour = "0"+hour;
    var minute = d.getMinutes()+"";
    if(minute.length<2) minute = "0"+minute;
    var second = d.getSeconds()+"";
    if(second.length<2) second = "0"+second;

    var jour = year+"-"+month+"-"+day+" "+hour+":"+minute+":"+second;
    return jour;
}

/*
 * Fonction d'enregistrement des plats et boissons
 */
function enregistreElemCom(x, commande) {
    console.log(commande);
    var boissons=commande.commande.boissons;
    var plats =commande.commande.plats;
    console.log(boissons);
    console.log(plats);

    for(var i in boissons)
    {
        var recordBoissons = {IdBoisson: boissons[i]["Id"]+'',IdVente: x , Quantite: boissons[i]["Quantite"]};
        mySqlClient.query('INSERT INTO pronto.boissons_ventes SET ?', recordBoissons, function (err, res) {
            if (err) throw err;

            console.log('enregistrement boisson OK');
        });
    }

    for(var j in plats)
    {
        var recordPlats = {IdVente: x, IdPlat: plats[j]["Id"], Quantite: plats[j]["Quantite"]};
        mySqlClient.query('INSERT INTO pronto.plats_ventes SET ?', recordPlats, function (err, res) {
            if (err) throw err;

            console.log('enregistrement plat OK');
        });

    }


    //deleteRecord(commande.idCommande);
}

/*
 * Fonction d'enregistrement des commandes payées dans la DB SQL
 */
function enregistrementVente(commande,enregistreElemCom) {
    console.log(commande);
    var recordVente = { Timestamp: getTime(), IdTable: commande["idTable"].substring(6), IdServeur: commande["idServeur"], Prix: commande["PrixTotal"]};
    mySqlClient.query('INSERT INTO pronto.ventes SET ?', recordVente, function(err,res){
        if(err) throw err;

        idVente = res.insertId;
        enregistreElemCom(idVente,commande);

    });
}


/*
 * Fonction d'envoi de contenu vers l'interface Bar
 */
function sendBar(data){
    nspBar.emit('bar', data);
}

/*
 * Fonction d'envoi de contenu vers l'interface Cuisine
 */
function sendCuisine(data){
    nspCuisine.emit('cuisine', data);
}

/*
 * Fonction d'envoi de contenu vers l'interface Caisse
 */
function sendCaisseEnregistreuse(data){
    nspCaisseEnregistreuse.emit('CaisseEnregistreuse', data);
}

/*
 * Traitement de la commande venant de l'intrface garçon de salle
 */
function reception(commande) {
    console.log(JSON.stringify(commande));
    recordDB(commande);
    viewDB();
    sendBar(commande);
    sendCuisine(commande);
    sendCaisseEnregistreuse(commande);

}

/*
 * Fonction d'enregistrement de contenu dans la DB MongoDB
 */
function recordDB(data) {
    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        console.log("Connected successfully to server database");

        insertDocuments(db, function () {
            db.close();
        }, data);

    });

}

/*
 * Fonction d'affichage du contenu de la DB MongoDB
 */
function viewDB(){
    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        console.log("Connected successfully to server database");
        console.log("contenu de la db");
        findDocuments(db, function () {
            db.close();
        });
    });

}


/*
 * Fonction de suppression de contenu de la DB MongoDB (amélioration future)
 */
function deleteRecord (idCom) {
    console.log(idCom);
    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        console.log("Connected successfully to server database");

        deleteDocument(db, function () {
            db.close();
        }, idCom);

    });

}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


/*
 * Creation du serveur Web écoutant sur le port 3000
 */
function makeServeur () {
    server = http.listen(3000, function () {
        var host = server.address().address
        var port = server.address().port

        console.log("The server listening at http://%s:%s", host, port)

    })
}


module.exports = app;