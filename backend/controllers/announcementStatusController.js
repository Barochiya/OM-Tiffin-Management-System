const AnnouncementDelivery = require(
  "../models/AnnouncementDelivery"
);

const getAnnouncementStatus = async (
  req,
  res
) => {
  try {
    const deliveries =
      await AnnouncementDelivery.find()
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      data: deliveries,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to load announcement status.",
    });
  }
};

module.exports = {
  getAnnouncementStatus,
};