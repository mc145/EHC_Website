let express = require('express'); 

const app = express(); 

app.set('view engine', 'ejs'); 
app.use('/public', express.static(__dirname + '/public'));



app.get('/', (req, res) => {
    res.render('challenges', {email: 'agarwal45366@sas.edu.sg'}); 
}); 


app.listen(5100); 