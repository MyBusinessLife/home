#!/usr/bin/env node
"use strict";

const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const PORT = Number(process.env.MBL_DIAGNOSTIC_PORT || 3025);
const HOST = process.env.MBL_DIAGNOSTIC_HOST || "127.0.0.1";
const DATA_DIR = process.env.MBL_DATA_DIR || "/var/www/mbl-site-data";
const DATA_FILE = path.join(DATA_DIR, "submissions.jsonl");
const NOTIFY_EMAIL = process.env.MBL_NOTIFY_EMAIL || "contact@mybusinesslife.fr";
const SENDMAIL_PATH = process.env.MBL_SENDMAIL_PATH || "/usr/sbin/sendmail";
const MAX_BODY_SIZE = 1024 * 1024;

const json = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end(JSON.stringify(payload));
};

const readBody = (request) =>
  new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY_SIZE) {
        reject(new Error("payload_too_large"));
        request.destroy();
      }
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });

const sanitizePayload = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return JSON.parse(JSON.stringify(value));
};

const createId = () => {
  const date = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const random = Math.random().toString(36).slice(2, 8);
  return `mbl-${date}-${random}`;
};

const summarizeSubmission = (entry) => {
  const payload = entry.payload || {};
  const answers = payload.answers || payload;
  const contact = answers.contact || {};
  return {
    id: entry.id,
    type: entry.type,
    track: payload.track || answers.topic || answers.need || "non precise",
    name: contact.name || answers.name || "",
    email: contact.email || answers.email || "",
    phone: contact.phone || answers.phone || "",
    source: entry.source,
    createdAt: entry.createdAt,
  };
};

const appendSubmission = async (entry) => {
  await fs.promises.mkdir(DATA_DIR, { recursive: true });
  await fs.promises.appendFile(DATA_FILE, `${JSON.stringify(entry)}${os.EOL}`, "utf8");
};

const sendNotification = (entry) =>
  new Promise((resolve) => {
    if (!fs.existsSync(SENDMAIL_PATH)) {
      resolve({ sent: false, reason: "sendmail_missing" });
      return;
    }

    const summary = summarizeSubmission(entry);
    const subject = `[MBL] Nouveau ${entry.type} ${summary.track}`;
    const body = [
      `Nouveau formulaire MY BUSINESS LIFE`,
      ``,
      `Reference : ${entry.id}`,
      `Type : ${entry.type}`,
      `Parcours : ${summary.track}`,
      `Nom : ${summary.name}`,
      `Email : ${summary.email}`,
      `Telephone : ${summary.phone}`,
      `Source : ${entry.source}`,
      `Date : ${entry.createdAt}`,
      ``,
      `Donnees completes :`,
      JSON.stringify(entry.payload, null, 2),
    ].join(os.EOL);

    const message = [
      `To: ${NOTIFY_EMAIL}`,
      `From: MY BUSINESS LIFE <no-reply@mybusinesslife.fr>`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset=UTF-8`,
      ``,
      body,
    ].join(os.EOL);

    const child = spawn(SENDMAIL_PATH, ["-t"]);
    child.on("error", (error) => resolve({ sent: false, reason: error.message }));
    child.on("close", (code) => resolve({ sent: code === 0, reason: code === 0 ? "sent" : `exit_${code}` }));
    child.stdin.end(message);
  });

const handleSubmission = async (request, response) => {
  try {
    const rawBody = await readBody(request);
    const parsed = rawBody ? JSON.parse(rawBody) : {};
    const type = String(parsed.type || "diagnostic").slice(0, 40);
    const source = String(parsed.source || request.headers.referer || "").slice(0, 500);
    const payload = sanitizePayload(parsed.payload);

    if (!["diagnostic", "contact"].includes(type)) {
      json(response, 400, { ok: false, error: "invalid_type" });
      return;
    }

    const entry = {
      id: createId(),
      createdAt: new Date().toISOString(),
      type,
      source,
      userAgent: request.headers["user-agent"] || "",
      ip: request.headers["x-forwarded-for"] || request.socket.remoteAddress || "",
      payload,
    };

    await appendSubmission(entry);
    const email = await sendNotification(entry);

    json(response, 200, {
      ok: true,
      id: entry.id,
      email,
    });
  } catch (error) {
    const code = error.message === "payload_too_large" ? 413 : 400;
    json(response, code, { ok: false, error: error.message });
  }
};

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (request.method === "OPTIONS") {
    json(response, 204, {});
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/health") {
    json(response, 200, { ok: true });
    return;
  }

  if (request.method === "POST" && requestUrl.pathname.endsWith("/diagnostic")) {
    handleSubmission(request, response);
    return;
  }

  json(response, 404, { ok: false, error: "not_found" });
});

server.listen(PORT, HOST, () => {
  console.log(`MBL diagnostic API listening on http://${HOST}:${PORT}`);
});
