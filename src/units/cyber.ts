import crypto from 'node:crypto'


export const encryptTimestamp = (timestamp: number, key: string) => {

    const TRIAL_SECRET = crypto
        .createHash('sha256')
        .update(key)
        .digest()

    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv('aes-256-gcm', TRIAL_SECRET, iv)
    const payload = Buffer.from(String(timestamp), 'utf8')
    const encrypted = Buffer.concat([cipher.update(payload), cipher.final()])
    const authTag = cipher.getAuthTag()
    return Buffer.concat([iv, authTag, encrypted])
}

export const decryptTimestamp = (buffer: Buffer, key: string) => {

    const TRIAL_SECRET = crypto
        .createHash('sha256')
        .update(key)
        .digest()

    const iv = buffer.subarray(0, 12)
    const authTag = buffer.subarray(12, 28)
    const encrypted = buffer.subarray(28)
    const decipher = crypto.createDecipheriv('aes-256-gcm', TRIAL_SECRET, iv)
    decipher.setAuthTag(authTag)
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return Number(decrypted.toString('utf8'))
}