const express = require("express");
const taskController = require("../controllers/taskController");
const router = express.Router();

router.post("/bulk", taskController.bulkCreate);
router.get("/", taskController.index);
router.get("/:id", taskController.show);
router.post("/", taskController.create);
router.patch("/:id", taskController.update);
router.delete("/:id", taskController.deleteTask);

module.exports = router;