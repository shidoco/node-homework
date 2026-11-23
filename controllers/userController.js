const crypto = require("crypto");
const { randomUUID } = crypto;
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const { userSchema } = require("../validation/userSchema");
const prisma = require("../db/prisma");
const jwt = require("jsonwebtoken");

const cookieFlags = (req) => {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
    };
};

const setJwtCookie = (req, res, user) => {
    const payload = { id: user.id, csrfToken: randomUUID() };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.cookie("jwt", token, { ...cookieFlags(req), maxAge: 3600000 });
    return payload.csrfToken;
};

async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const derivedKey = await scrypt(password, salt, 64);
    return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
    const [salt, storedKey] = storedHash.split(":");
    const keyBuffer = Buffer.from(storedKey, "hex");
    const derivedKey = await scrypt(inputPassword, salt, 64);

    return crypto.timingSafeEqual(derivedKey, keyBuffer);
}

async function register(req, res, next) {
    if (!req.body) req.body = {};

    const { error, value } = userSchema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const { name, email, password } = value;
    const hashedPassword = await hashPassword(password);

    try {
        const result = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: { name, email, hashedPassword },
                select: { id: true, email: true, name: true, createdAt: true },
            });

            const welcomeTaskData = [
                { title: "Complete your profile", userId: newUser.id, priority: "medium" },
                { title: "Add your first task", userId: newUser.id, priority: "high" },
                { title: "Explore the app", userId: newUser.id, priority: "low" },
            ];
            await tx.task.createMany({ data: welcomeTaskData });

            const welcomeTasks = await tx.task.findMany({
                where: {
                    userId: newUser.id,
                    title: { in: welcomeTaskData.map((task) => task.title) },
                },
                select: {
                    id: true,
                    title: true,
                    isCompleted: true,
                    userId: true,
                    priority: true,
                },
            });

            return { user: newUser, welcomeTasks };
        });

        const csrfToken = setJwtCookie(req, res, result.user);
        delete result.user.id;

        return res.status(201).json({
            user: result.user,
            welcomeTasks: result.welcomeTasks,
            transactionStatus: "success",
            csrfToken,
        });
    } catch (err) {
        if (err.code === "P2002") {
            return res.status(400).json({ message: "Email already registered" });
        }

        return next(err);
    }
}

async function logon(req, res) {
    let { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }
    email = email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email }, select: {
        id: true, name: true, email: true, hashedPassword: true
    } });

    if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    const goodCredentials = await comparePassword(password, user.hashedPassword);

    if (!goodCredentials) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    const csrfToken = setJwtCookie(req, res, user);

    return res.status(200).json({ name: user.name, email: user.email, csrfToken });
}

function logoff(req, res) {
    res.clearCookie("jwt", cookieFlags(req));
    return res.sendStatus(200);
}

async function show(req, res) {
    
    const userId = Number(req.params.id);
  
    if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
    }

    if (userId !== req.user?.id) {
        return res.status(403).json({ error: "Forbidden" });
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        Task: {
            where: { isCompleted: false },
            select: { 
            id: true, 
            title: true, 
            priority: true,
            createdAt: true 
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        }
        }
    });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
};

module.exports = {
    register,
    logon,
    logoff,
    hashPassword,
    comparePassword,
    show,
};