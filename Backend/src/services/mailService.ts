import nodemailer from 'nodemailer';
import { BusinessError } from '../utils/errors.js';

let transporter: nodemailer.Transporter | null = null;

function smtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD?.trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
  const from = process.env.SMTP_FROM?.trim() || user;

  if (!host || !user || !password || !from || !Number.isInteger(port) || port <= 0) {
    throw new BusinessError(503, 'Dịch vụ gửi email chưa được cấu hình');
  }
  return { host, user, password, port, secure, from };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] || character);
}

export function ensureMailConfigured(): void {
  smtpConfig();
}

export async function sendPasswordResetOtp(to: string, fullName: string, otp: string): Promise<void> {
  const config = smtpConfig();
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.password },
    });
  }

  await transporter.sendMail({
    from: config.from,
    to,
    subject: 'Mã OTP đặt lại mật khẩu - Lao Động Sinh Viên',
    text: `Xin chào ${fullName}, mã OTP đặt lại mật khẩu của bạn là ${otp}. Mã có hiệu lực trong 10 phút. Không chia sẻ mã này với bất kỳ ai.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172033">
        <div style="background:#1554ad;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
          <strong style="font-size:18px">Lao Động Sinh Viên</strong>
        </div>
        <div style="border:1px solid #dbe3ef;border-top:0;padding:28px 24px;border-radius:0 0 12px 12px">
          <p>Xin chào <strong>${escapeHtml(fullName)}</strong>,</p>
          <p>Bạn vừa yêu cầu đặt lại mật khẩu. Mã xác nhận của bạn là:</p>
          <div style="margin:24px 0;padding:16px;text-align:center;background:#f3f7fc;border-radius:10px;font-size:30px;font-weight:700;letter-spacing:10px;color:#1554ad">${otp}</div>
          <p>Mã có hiệu lực trong <strong>10 phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p>
          <p style="font-size:13px;color:#667085">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.</p>
        </div>
      </div>
    `,
  });
}
