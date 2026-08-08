console.log("FILE:", __filename);
console.log("CWD:", process.cwd());

require("dotenv").config();
console.log("CWD:", process.cwd());
console.log("ENV:", process.env.MONGODB_URI);

const connectDB = require("./config/db");
const app = require("./app");

console.log("✅ app imported");

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});