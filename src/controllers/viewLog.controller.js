import ViewLogModel from "../models/viewLog.model.js";

const logView = async (req, res) => {
  try {
    const userId = req.user.id
    const {restaurantId } = req.body;
    if (!userId || !restaurantId) {
      return res.status(400).json({ success: false, message: 'Missing userId or restaurantId' });
    }

    await ViewLogModel.create({
      userId,
      restaurantId,
      viewedAt: new Date(),
    });

    res.json({ success: true, message: 'View logged successfully' });
  } catch (err) {
    console.error("Log view error:", err.message);
    res.status(500).json({ success: false, message: 'Failed to log view' });
  }
};

export const logViewController = {
    logView
}