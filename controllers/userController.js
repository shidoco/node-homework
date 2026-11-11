const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const { userSchema } = require("../validation/userSchema");
const prisma = require("../db/prisma");

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

    let user = null;

    try {
        user = await prisma.user.create({
            data: { name, email, hashedPassword },
            select: { name: true, email: true, id: true },
        });
        global.user_id = user.id;

        return res.status(201).json({ name: user.name, email: user.email });
    } catch (err) {
        if (
            err.name === "PrismaClientKnownRequestError" &&
            err.code === "P2002"
        ) {
            return res.status(400).json({ message: "Email already registered" });
        }

        return next(err);
    }
}

async function logon(req, res) {
    let { email, password } = req.body || {};
    email = email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    const goodCredentials = await comparePassword(password, user.hashedPassword);

    if (!goodCredentials) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    global.user_id = user.id;

    return res.status(200).json({ name: user.name, email: user.email });
}

function logoff(req, res) {
    global.user_id = null;
    return res.sendStatus(200);
}

module.exports = {
    register,
    logon,
    logoff,
    hashPassword,
    comparePassword,
};