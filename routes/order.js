const router = require("express").Router();
const { authenticateToken } = require("./userAuth");
const Book = require("../models/book");
const Order = require("../models/orders");
const User = require("../models/user");

router.post("/place-order", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers;
    const { order } = req.body;

    // Validate input
    if (!id || !order) {
      return res
        .status(400)
        .json({ message: "Missing user ID or order data." });
    }

    for (const orderData of order) {
      const newOrder = new Order({ user: id, book: orderData._id });
      const orderDataFromDb = await newOrder.save();
      await User.findByIdAndUpdate(id, {
        $push: { orders: orderDataFromDb._id },
      });
      await User.findByIdAndUpdate(id, {
        $pull: { cart: orderData._id },
      });
    }

    return res.json({
      status: "Success",
      message: "Order placed successfully",
    });
  } catch (error) {
    console.error("Error placing order:", error);
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
});

router.get("/get-order-history", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers;

    if (!id) {
      return res.status(400).json({ message: "Missing user ID." });
    }

    const userData = await User.findById(id).populate({
      path: "orders",
      populate: { path: "book" },
    });

    if (!userData || !userData.orders) {
      return res.status(404).json({ message: "User not found or no orders." });
    }

    const orderData = userData.orders.reverse();
    return res.json({
      status: "Success",
      data: orderData,
    });
  } catch (error) {
    console.error("Error fetching order history:", error);
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
});

// router.get("/get-all-orders", authenticateToken, async (req, res) => {
//   try {
//     const orders = await Order.find()
//       .populate({ path: "book" })
//       .populate({ path: "user" })
//       .sort({ createdAt: -1 });

//     return res.json({
//       status: "Success",
//       data: orders,
//     });
//   } catch (error) {
//     console.error("Error fetching all orders:", error);
//     return res
//       .status(500)
//       .json({ message: "An error occurred", error: error.message });
//   }
// });

router.get("/get-all-orders", authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate({ path: "book" })
      .populate({ path: "user" })
      .sort({ createdAt: -1 });

    console.log("Fetched orders:", orders); // Log orders
    return res.json({
      status: "Success",
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    console.error("Detailed error:", error); // Log full error object
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
});

router.post("/update-status/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate input
    if (!status) {
      return res.status(400).json({ message: "Missing status." });
    }

    await Order.findByIdAndUpdate(id, { status });
    return res.json({
      status: "Success",
      message: "Status updated successfully",
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
});

module.exports = router;
