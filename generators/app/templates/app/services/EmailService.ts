import path from "path";
import nodemailer from "nodemailer";
import ejs from "ejs";
import { log } from "@/libraries/Log";
import { config } from "@/config";
import i18n from "@/libraries/i18n";

class EmailService {
  mailer: nodemailer.Transporter;

  constructor() {
    this.mailer = nodemailer.createTransport({
      pool: true,
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: config.email.auth,
    });
  }

  private send(email: string, subject: string, html: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.mailer.sendMail(
        {
          from: config.email.from_address,
          to: email,
          subject: subject,
          html: html,
        },
        (err, info: any) => {
          if (err) return reject(err);
          return resolve(info);
        },
      );
    });
  }

  private compileTemplate(context: any): Promise<string> {
    return new Promise((resolve, reject) => {
      ejs.renderFile(
        path.join(__dirname, "../views/email/template.ejs"),
        context,
        (err, str) => {
          if (err) return reject(err);
          return resolve(str);
        },
      );
    });
  }

  sendEmail(
    email: string,
    subject: string,
    page: string,
    locale: string,
    context?: any,
  ): Promise<any> {
    if (context == null) context = {};
    context.page = page;

    const t: any = {};
    i18n.init(t);
    if (locale == null) locale = "en";
    t.setLocale(locale);

    context.__ = t.__;

    // Translate subject
    subject = t.__(subject);

    return this.compileTemplate(context).then((html: string) => {
      log.debug(`Sending ${page} email to: ${email}`);
      return this.send(email, subject, html);
    });
  }
}

const emailService = new EmailService();
export default emailService;
