require("dotenv").config({
  path: require("path").join(__dirname, ".env"),
});

const connectDB = require("./config/db");
const app = require("./app");
const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});