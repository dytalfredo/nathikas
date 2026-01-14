import { describe, it, expect } from 'vitest';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

describe('Email Notification Service', () => {

    it('should connect to SMTP server', async () => {
        const smtpHost = process.env.SMTP_HOST;
        const smtpPort = process.env.SMTP_PORT;
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        if (!smtpHost || !smtpUser || !smtpPass) {
            console.warn('Skipping SMTP test: Credentials not found in .env');
            return;
        }

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(smtpPort || '465'),
            secure: parseInt(smtpPort || '465') === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        try {
            const result = await transporter.verify();
            expect(result).toBe(true);
            console.log('✅ SMTP Connection Verified');
        } catch (error) {
            console.error('❌ SMTP Connection Failed:', error);
            throw error;
        }
    });
});
