import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const SETTINGS_PATH = process.env.SETTINGS_PATH || "/root/tradingbot-github/data/settings.json";

interface Settings {
  paperMode: boolean;
  alerts: {
    telegram: {
      enabled: boolean;
      botToken: string;
      chatId: string;
    };
    email: {
      enabled: boolean;
      smtpHost: string;
      smtpPort: number;
      username: string;
      password: string;
      recipient: string;
    };
  };
}

const DEFAULT_SETTINGS: Settings = {
  paperMode: true,
  alerts: {
    telegram: {
      enabled: false,
      botToken: "",
      chatId: "",
    },
    email: {
      enabled: false,
      smtpHost: "smtp.gmail.com",
      smtpPort: 587,
      username: "",
      password: "",
      recipient: "",
    },
  },
};

async function loadSettings(): Promise<Settings> {
  try {
    if (existsSync(SETTINGS_PATH)) {
      const data = await readFile(SETTINGS_PATH, "utf-8");
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error("Error loading settings:", e);
  }
  return DEFAULT_SETTINGS;
}

async function saveSettings(settings: Settings): Promise<void> {
  const dir = path.dirname(SETTINGS_PATH);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  await writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

async function validateTelegramToken(token: string, chatId: string): Promise<boolean> {
  if (!token || !chatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${chatId}`);
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

export async function GET() {
  const settings = await loadSettings();
  // Mask sensitive data
  return NextResponse.json({
    paperMode: settings.paperMode,
    alerts: {
      telegram: {
        enabled: settings.alerts.telegram.enabled,
        botToken: settings.alerts.telegram.botToken ? "***configured***" : "",
        chatId: settings.alerts.telegram.chatId || "",
      },
      email: {
        enabled: settings.alerts.email.enabled,
        smtpHost: settings.alerts.email.smtpHost,
        smtpPort: settings.alerts.email.smtpPort,
        username: settings.alerts.email.username,
        password: settings.alerts.email.password ? "***configured***" : "",
        recipient: settings.alerts.email.recipient,
      },
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const currentSettings = await loadSettings();
    
    // Handle paper mode toggle
    if (typeof body.paperMode === "boolean") {
      currentSettings.paperMode = body.paperMode;
    }
    
    // Handle telegram config
    if (body.telegram) {
      const { enabled, botToken, chatId } = body.telegram;
      
      // Validate token if provided and enabled
      if (enabled && botToken && botToken !== "***configured***") {
        const isValid = await validateTelegramToken(botToken, chatId);
        if (!isValid) {
          return NextResponse.json(
            { error: "Invalid Telegram bot token or chat ID" },
            { status: 400 }
          );
        }
        currentSettings.alerts.telegram.botToken = botToken;
      }
      
      currentSettings.alerts.telegram.enabled = enabled;
      if (chatId) currentSettings.alerts.telegram.chatId = chatId;
    }
    
    // Handle email config
    if (body.email) {
      currentSettings.alerts.email = {
        ...currentSettings.alerts.email,
        ...body.email,
        // Keep existing password if masked
        password: body.email.password === "***configured***" 
          ? currentSettings.alerts.email.password 
          : body.email.password || currentSettings.alerts.email.password,
      };
    }
    
    await saveSettings(currentSettings);
    
    return NextResponse.json({ success: true, message: "Settings saved" });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
