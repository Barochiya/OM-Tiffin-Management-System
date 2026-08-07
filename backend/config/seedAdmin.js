require("dotenv").config();

const connectDB = require("./config/db");
const Admin = require("./models/Admin");

const createAdmin = async () => {
  try {
    await connectDB();

    // पुराने Admin हटाने हैं तो यह लाइन रहने दो,
    // नहीं हटाने हैं तो इसे comment कर दो।
    await Admin.deleteMany({});

    const admin = await Admin.create({
      name: "Malay",
      email: "admin@omtiffin.com",
      password: "Malay@123",
    });

    console.log("✅ Admin Created Successfully");
    console.log("Email:", admin.email);

    process.exit(0);

  } catch (error) {

    console.log(error);

    process.exit(1);

  }
};

createAdmin();