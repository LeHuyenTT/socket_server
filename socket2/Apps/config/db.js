const mongoose = require('mongoose')

const DBconnection = async() => {
    const conn = await mongoose
        .connect("mongodb+srv://admin:admin@hybridclass.iemw7ln.mongodb.net/HSM?retryWrites=true&w=majority", {
            useNewUrlParser: true,
            useUnifiedTopology: true, // if using cloud => true
            useCreateIndex: true,
            useFindAndModify: false
        })
        .catch(err => {
            console.log(`Can't connect to the DB`.red, err)
        })
    console.log(`MongoDB Connected: ${conn.connection.host}`)
}

module.exports = DBconnection