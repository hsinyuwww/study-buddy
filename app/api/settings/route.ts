import { NextResponse } from "next/server";
import { getSettings, updateSettings, AppSettings } from "@/utils/settings";

export async function GET() {
  try {
    const settings = getSettings();
    
    console.log('GET settings called, returning:', { 
      provider: settings.llmProvider, 
      baseUrl: settings.llmBaseUrl,
      model: settings.llmModel 
    });
    
    // Don't send API keys to frontend for security
    const safeSettings = {
      ...settings,
      llmApiKey: settings.llmApiKey ? "***" : "",
      searchApiKey: settings.searchApiKey ? "***" : "",
    };
    return NextResponse.json(safeSettings);
  } catch (error) {
    console.error("Error getting settings:", error);
    return NextResponse.json({ error: "Failed to get settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newSettings: AppSettings = await request.json();
    
    console.log('POST settings called with:', { 
      provider: newSettings.llmProvider, 
      baseUrl: newSettings.llmBaseUrl,
      model: newSettings.llmModel,
      hasApiKey: !!newSettings.llmApiKey
    });
    
    // Only update runtime settings if a real API key is provided
    // Prevents blank UI submissions from wiping env var values
    if (newSettings.llmApiKey && newSettings.llmApiKey !== "***") {
      updateSettings(newSettings);
      console.log('✅ Runtime settings updated from UI');
    } else {
      console.log('⚠️ Skipping runtime update — no real API key provided, keeping env vars');
    }

    // Skip file saving entirely — Vercel has a read-only filesystem
    return NextResponse.json({ success: true, message: "Settings updated successfully" });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}