const jwt = require('jsonwebtoken');
const {User} = require('../models/user');

const authenticateToken = async (req, res, next) => {
  console.log(req.headers)
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).send('Unauthorized');
  }
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decodedToken.id);

    if (!user) {
      return res.status(401).send('Unauthorized');
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).send('Unauthorized');
  }
  
};

module.exports = authenticateToken;
