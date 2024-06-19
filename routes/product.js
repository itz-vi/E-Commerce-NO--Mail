const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
    name: String,
    price: String,
    image: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    }
});

module.exports = mongoose.model('product', productSchema);
