const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema(
    {
        username: String,
        password: String,
        name: String,
        items: [
            {
                name: String,
                link: String
            }
        ]
    }
);

module.exports = mongoose.model('User', UserSchema);