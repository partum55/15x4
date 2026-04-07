import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendApprovalEmail(to: string, name: string) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000'

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: '15x4 — Ваш акаунт підтверджено!',
    html: `
      <div style="font-family: Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #000;">Вітаємо, ${name}!</h1>
        <p style="font-size: 16px; line-height: 1.5;">
          Ваш акаунт на 15x4 було підтверджено адміністратором. Тепер ви можете створювати лекції та події.
        </p>
        <a href="${appUrl}/account/lectures" style="display: inline-block; background: #000; color: #fff; padding: 14px 28px; text-decoration: none; font-size: 16px; margin: 20px 0;">
          Перейти до акаунту
        </a>
        <p style="font-size: 12px; color: #999; margin-top: 40px;">
          З повагою,<br>Команда 15x4
        </p>
      </div>
    `,
  })
}
