const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const prisma = require("../db/prisma");

const getOrderBy = (query) => {
  const validSortFields = ["title", "priority", "createdAt", "id", "isCompleted"];
  const sortBy = query.sortBy || "createdAt";
  const sortDirection = query.sortDirection === "asc" ? "asc" : "desc";
  
  if (validSortFields.includes(sortBy)) {
    return { [sortBy]: sortDirection };
  }
  return { createdAt: "desc" };
};


async function create(req, res) {
  if (!req.body) req.body = {};

  const { error, value } = taskSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const task = await prisma.task.create({
    data: {
      title: value.title,
      isCompleted: value.isCompleted,
      priority: value.priority,
      userId: req.user.id,
    },
    select: { id: true, title: true, isCompleted: true, priority: true },
  });

  return res.status(201).json(task);
}

async function bulkCreate(req, res, next) {
  const { tasks } = req.body || {};

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({
      error: "Invalid request data. Expected an array of tasks.",
    });
  }

  const validTasks = [];
  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }

    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted,
      priority: value.priority,
      userId: req.user.id,
    });
  }

  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false,
    });

    return res.status(201).json({
      message: "Bulk task creation successful",
      tasksCreated: result.count,
      totalRequested: validTasks.length,
    });
  } catch (err) {
    return next(err);
  }
}

async function index(req, res) {
  const whereClause = { userId: req.user.id };

  if (req.query.find) {
    whereClause.title = {
      contains: req.query.find,
      mode: "insensitive",
    }
  }
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);

  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({ message: "Invalid pagination parameters"});
  }
  const skip = (page - 1) * limit;
  
  const tasks = await prisma.task.findMany({
    where: whereClause,
    select: {
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      createdAt: true,
      User: {
        select: { name: true, email: true }
      }
    },
    skip: skip,
    take: limit,
    orderBy: getOrderBy(req.query)});

  const totalTasks = await prisma.task.count({
    where: whereClause
  });

  const pagination = {
    page,
    limit,
    total: totalTasks,
    pages: Math.ceil(totalTasks / limit),
    hasNext: page * limit < totalTasks,
    hasPrev: page > 1,
  };

  return res.status(200).json({tasks, pagination});
}

async function show(req, res) {
  const taskId = parseInt(req.params?.id, 10);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    return res.status(400).json({ message: "Invalid task id" });
  }

  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
      userId: req.user.id,
    },
    select: {
      id: true,
      title: true,
      isCompleted: true,
      User: { select: { name: true, email: true } },
    },
  });

  if (task === null) {
    return res.status(404).json({ message: "Task not found" });
  }

  return res.status(200).json(task);
}

async function update(req, res, next) {
  if (!req.body) req.body = {};

  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const taskId = parseInt(req.params?.id, 10);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    return res.status(400).json({ message: "Invalid task id" });
  }

  try {
    const task = await prisma.task.update({
      where: {
        id: parseInt(req.params.id),
        userId: req.user.id,
      },
      data: value,
      select: { title: true, isCompleted: true, id: true, priority: true },
    });
    return res.status(200).json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "The task was not found." });
    } else {
      return next(err);
    }
  }
}

async function deleteTask(req, res, next) {
  const taskId = parseInt(req.params?.id, 10);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    return res.status(400).json({ message: "Invalid task id" });
  }

  try {
    const task = await prisma.task.delete({
      where: { id: taskId, userId: req.user.id },
      select: { id: true, title: true, isCompleted: true },
    });

    return res.status(200).json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "The task was not found." });
    } else {
      return next(err);
    }
  }
}

module.exports = {
  create,
  bulkCreate,
  index,
  show,
  update,
  deleteTask,
};
