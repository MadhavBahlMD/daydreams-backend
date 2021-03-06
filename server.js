const path = require('path');
var app = require('express')();
const bodyParser = require('body-parser');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var request = require('request');

const { generateKeywords } = require ('./utils/keywords');
const { getSimilarKeywords } = require ('./utils/similarKeywords');
const { getSummary } = require ('./utils/summary');

const publicPath = path.join(__dirname, '/public');
const port = process.env.PORT || 3000;
app.use(bodyParser());

app.get('/', (req, res) => {
    res.sendFile(publicPath + '/index.html');
});

app.post ('/getKeywords', (req, res) => {
    let data = [req.body.data];
    generateKeywords (data, (keywords, err) => {
        if (!data) {
            res.status (500).send (err);
        }

        res.send (keywords);    
    });
});

app.post ('/getSimilarKeywords', (req, res) => {
    let  data = req.body.data;
    getSimilarKeywords (data, (result, err) => {
        if (!result) {
            res.status (500).send (err);
        }
        res.send (result);
    });
});

app.post ('/getSummary', (req, res) => {
    let text = [req.body.text];

    getSummary (text, (phrase, err) => {
        if (!phrase) {
            res.status (500).send (err);
        }

        res.send (phrase);
    });
});

io.on('connection', function(socket){
    console.log(`A new user connected ${socket.id}`);

    socket.emit ('check', "Did it connect?");

    socket.on ('appStarted', (message) => {
        console.log ('Received Message: ' + message);
    });

    socket.on ('getText', (text, callback) => {
        console.log (text);
        let toBeProcessed = [text];
        getSummary (toBeProcessed, (phrase, err) => {
            if (!phrase) {
                phrase = text;
            }

            generateKeywords (toBeProcessed, (keywords, err) => {
                let reqParam = keywords.join (" ");
                let URI = "http://13.76.0.194/get-images?query=" + reqParam + ",cartoon";
                request (URI, (err, resp, mainResp) => {
                    console.log (mainResp);
                    try {
                        let mResp = JSON.parse (mainResp);
                    
                        if (mResp["images"]) {
                            let images = mResp["images"];
                            let imageList = [];
                            console.log (JSON.stringify(mainResp, null, 4));
                            for (let i=0; i<images.length; i++) {
                                console.log ('Keywords - ' + keywords);
                                let max=keywords.length;  
                                let r1 = Math.floor(Math.random() * (+max - 0));
                                let r2 = Math.floor(Math.random() * (+max - 0));
                                while (r1 == r2) {
                                    let r2 = Math.floor(Math.random() * (+max - 0));
                                }
                                console.log ('RANDOM - '+ r1 + ' '+ r2);
                                let tags = keywords[r1] + ", " + keywords[r2];
                                let thisObj = {
                                    imageURL: images[i][1],
                                    desc: tags
                                }
                                imageList.push (thisObj);
                            }
                            
                            socket.emit ('addImage', JSON.stringify(imageList));
                        } else {
                            
                        }
                    } catch (objError) {
                        if (objError instanceof SyntaxError) {
                            console.log(objError.name);
                        } else {
                            console.log(objError.message);
                        }
                    }
                    
                    
                });
                
            });
        });
        
        // socket.emit ('addImage', text+"FINAL");
        // callback();
    });
});



http.listen (port, () => {
    console.log (`Server is up at port ${port}`);
});


