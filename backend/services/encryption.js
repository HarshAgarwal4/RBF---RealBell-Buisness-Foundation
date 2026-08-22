import bcrypt from 'bcryptjs';

async function hashPassword(password) {
    if (!password) return null;
    const clean = String(password).trim();
    if (!clean) return null;
    const saltRounds = 10;
    try {
        let hashedPassword = await bcrypt.hash(clean, saltRounds);
        return hashedPassword;
    } catch (err) {
        console.log(err);
        return null;
    }
}

async function verifyPassword(password, hashedPassword) {
    if (!password || !hashedPassword) return false;
    const clean = String(password).trim();
    try {
        let r = await bcrypt.compare(clean, hashedPassword);
        return r;
    } catch (err) {
        console.log(err);
        return false;
    }
}

export { hashPassword, verifyPassword };