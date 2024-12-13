//description
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded data (like form submission)

// Serve the static CSS file
app.use(express.static("public"));

// Store Normal User Data (In-memory)
const normalUsers = [];

// Store Core Members Data (In-memory)
const coreMembers = [];

// Route for Landing Page
app.get("/", (req, res) => {
  res.send(`
   <html>
      <head>
        <link rel="stylesheet" type="text/css" href="/styles.css">
      </head>
      <body id="landing-page">
        <h1>Welcome</h1>
        <p>Are you a:</p>
        <button onclick="window.location.href='/normal'">Normal User</button><br><br>
        <button onclick="window.location.href='/core'">Core Member</button>
      </body>
    </html>
    `);
});

// Route for Normal User - Display Form for Name and Email
app.get("/normal", (req, res) => {
  res.send(`
    <html>
      <head>
        <link rel="stylesheet" type="text/css" href="/styles.css">
      </head>
      <body>
        <h1>Normal User Registration</h1>
        <form action="/normal/register" method="POST">
          <label for="name">Name:</label><br>
          <input type="text" id="name" name="name" required><br><br>
          <label for="email">Email:</label><br>
          <input type="email" id="email" name="email" required><br><br>
          <button type="submit">Submit</button>
        </form>
      </body>
    </html>
  `);
});

// Route for Normal User Registration (Store Name and Email)
app.post("/normal/register", (req, res) => {
  const { name, email } = req.body;

  if (name && email) {
    // Store the Normal User Data (For simplicity, in-memory)
    normalUsers.push({ name, email });

    // Respond with a friendly message
    res.send(`Welcome, ${name}!`);
  } else {
    res.status(400).send("Invalid input data");
  }
});

// Route for Core Member Page
app.get("/core", (req, res) => {
    res.send(`
        <html>
      <head>
        <link rel="stylesheet" type="text/css" href="/styles.css">
      </head>
      <body>
        <div class="page-container">
          <div class="core-buttons">
            <h1>Core Member</h1>
            <p>Are you here to:</p>
            <button onclick="window.location.href='/core/signup'">Sign Up</button><br><br>
            <button onclick="window.location.href='/core/login'">Log In</button>
          </div>
        </div>
      </body>
    </html>
      `);
  });
  
//Core Member - Sign Up Form
app.get("/core/signup", (req, res,)=>{
    res.send(`
      <html>
      <head>
        <link rel="stylesheet" type="text/css" href="/styles.css">
      </head>
      <body>
        <div class="page-container">
          <form action="/core/signup" method="POST">
            <h1>Core Member Sign Up</h1>
            <label for="username">Username:</label><br>
            <input type="text" id="username" name="username" required><br><br>
            <label for="password">Password:</label><br>
            <input type="password" id="password" name="password" required><br><br>
            <button class="btn" type="submit">Sign Up</button>
          </form>
        </div>
      </body>
    </html>
    `);
});

// Core Member - Sign Up Form - Store Credentials
app.post("/core/signup", async (req, res) => {
    const { username, password } = req.body;
  
    try {
      // Hash the entered password for security purposes
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create a new core member object
      const newCoreMember = {
        username,
        password: hashedPassword,
      };
  
      // Add the new core member to the coreMembers array
      coreMembers.push(newCoreMember);
  
      res.send(`Welcome, ${username}! You have successfully signed up as a Core Member.`);
    } catch (error) {
      console.error("Error during signup:", error);
      res.status(500).send("Internal Server Error");
    }
  });
  

// Core Member - Login Form 
  app.get("/core/login", (req, res) => {
    res.send(`
      <html>
      <head>
        <link rel="stylesheet" type="text/css" href="/styles.css">
      </head>
      <body>
        <div class="page-container">
          <form action="/core/login" method="POST">
            <h1>Core Member Login</h1>
            <label for="username">Username:</label><br>
            <input type="text" id="username" name="username" required><br><br>
            <label for="password">Password:</label><br>
            <input type="password" id="password" name="password" required><br><br>
            <button class="btn" type="submit">Login</button>
          </form>
        </div>
      </body>
    </html>
    `);
  });
  
// Core Member - Login Form - Validate and Generate JWT Token
  app.post("/core/login", async (req, res) => {
    const { username, password } = req.body;
  
  // Find the core member in the array
  const coreMember = coreMembers.find((member) => member.username === username);
  if (!coreMember) {
    return res.status(401).send("Invalid username");
  }
  
  // Verify Password
  const passwordMatch = await bcrypt.compare(password, coreMember.password);
  if (!passwordMatch) {
    return res.status(401).send("Invalid password");
  }
  
  // Generate JWT Token
  const token = jwt.sign({ role: "coreMember", username }, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.json({ message: `Welcome ${username}, you are authenticated as a Core Member!`});
});

//Protected route for Core Members
const authenticateToken = (req, res,next) => {
    const authHeader = req.headers["authorization"];
    const token = req.headers["authorization"].split(" ")[1];
    if (!token) return res.status(401).send("Access denied");

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).send("Access denied");
      req.user = user;
      next();
    });
};
    
app.get("/core/dashboard", authenticateToken, (req, res) => {
  if (req.user.role === "coreMember") {
    res.send("<h1>Welcome, Core Member!</h1><p>You can access the database and make announcements here.</p>");
  } else {
    res.status(403).send("Unauthorized");
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
