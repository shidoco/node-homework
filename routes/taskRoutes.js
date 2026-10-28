const express = require("express");
const taskController = require("../controllers/taskController");
const auth = require("../middleware/auth");

const router = express.Router();

router.use(auth);

router.get("/", taskController.index);
router.get("/:id", taskController.show);
router.post("/", taskController.create);
router.patch("/:id", taskController.update);
router.delete("/:id", taskController.deleteTask);

module.exports = router;