require("dotenv").config();

const mongoose = require("mongoose");
const DailyEntry = require("./models/DailyEntry");

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const duplicates = await DailyEntry.aggregate([
      {
        $group: {
          _id: {
            customer: "$customer",
            date: "$date",
          },
          count: {
            $sum: 1,
          },
        },
      },
      {
        $match: {
          count: {
            $gt: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    console.log(
      "Duplicate customer+date records:",
      duplicates.length
    );

    console.dir(duplicates, {
      depth: null,
    });
  } catch (error) {
    console.error("Duplicate check failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
})();