const express = require("express");
const router = express.Router();
const userModel = require("./users");
const productModel = require("./product");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const upload = require('./multer');
const path = require("path");
const uploadsPath = path.join(__dirname, "uploads");
const verifyToken = require('./auth');
router.use("/uploads", express.static(uploadsPath));

router.get('/', function (req, res) {
  res.render('index');
});

router.post("/register", async function (req, res) {
  let { email, password, fullname } = req.body;

  bcrypt.genSalt(10, function (err, salt) {
    if (err) return res.status(500).send(err);
    bcrypt.hash(password, salt, async function (err, hash) {
      if (err) return res.status(500).send(err);

      try {
        let user = await userModel.create({
          fullname,
          email,
          password: hash,
        });
        let token = jwt.sign({ email: user.email, id: user._id }, "dffsdfsfsd");
        res.cookie("token", token);
        res.redirect("/shop");
      } catch (err) {
        res.status(500).send(err);
      }
    });
  });
});

router.post("/login", async function (req, res) {
  let { email, password } = req.body;

  try {
    let user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).send("User not found");
    }

    bcrypt.compare(password, user.password, function (err, isMatch) {
      if (err) return res.status(500).send(err);
      if (!isMatch) return res.status(400).send("Invalid credentials");

      let token = jwt.sign({ email: user.email, id: user._id }, "dffsdfsfsd");
      res.cookie("token", token);
      res.redirect("/shop");
    });
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get('/shop', verifyToken, async function (req, res) {
  try {
    const userId = req.user.id;
    const product = await productModel.find({ user: userId });
    res.render('shop', { product });
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get('/createproduct', verifyToken, function (req, res) {
  res.render('createproduct');
});

router.post('/createproduct', verifyToken, upload.single("image"), async function (req, res) {
  let { name, price } = req.body;
  const imagefile = req.file ? req.file.filename : null;
  const userId = req.user.id;
  try {
    let newproduct = await productModel.create({ image: imagefile, name, price, user: userId });
    res.redirect("/shop");
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get('/cart', (req, res) => {
  console.log('Cart contents:', req.session.cart); // Debugging line
  const cart = req.session.cart || [];
  const totalCost = calculateTotalCost(cart);
  console.log('Total Cost:', totalCost); // Debugging line
  res.render('cart', { cart, totalCost });
});

function calculateTotalCost(cart) {
  let totalCost = 0;
  cart.forEach(product => {
    console.log('Product:', product); // Debugging line
    if (typeof product.price === 'number' && typeof product.quantity === 'number') {
      totalCost += product.price * product.quantity;
    } else {
      console.warn('Invalid product structure:', product);
    }
  });
  return totalCost;
}

router.post('/cart/add', async (req, res) => {
  const productId = req.body.productId;
  try {
    const product = await productModel.findById(productId);
    if (!product) {
      return res.redirect('/shop'); // Handle if product not found
    }
    if (!req.session.cart) {
      req.session.cart = [];
    }
    req.session.cart.push({
      id: product._id,
      name: product.name,
      image: product.image,
      price: parseFloat(product.price), // Ensure price is a number
      quantity: 1
    });
    console.log('Cart after addition:', req.session.cart); // Debugging line
    return res.redirect('/shop?added=true');
  } catch (err) {
    console.error('Error adding product to cart:', err);
    return res.redirect('/shop');
  }
});

router.post('/cart/update', (req, res) => {
  const { productId, change } = req.body;
  const cart = req.session.cart || [];

  const product = cart.find(item => item.id === productId);
  if (product) {
    product.quantity += change;
    if (product.quantity <= 0) {
      req.session.cart = cart.filter(item => item.id !== productId);
    }
  }
  console.log('Cart after update:', req.session.cart); // Debugging line
  res.sendStatus(200);
});

router.post('/cart/remove', (req, res) => {
  const productId = req.body.productId;
  req.session.cart = (req.session.cart || []).filter(item => item.id !== productId);
  console.log('Cart after removal:', req.session.cart); // Debugging line
  res.redirect('/cart');
});

module.exports = router;
