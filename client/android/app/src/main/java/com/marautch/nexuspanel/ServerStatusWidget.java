package com.marautch.nexuspanel;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.Executors;

public class ServerStatusWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_server_status);

        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent rootPendingIntent = PendingIntent.getActivity(
                context, 200 + appWidgetId, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_srv_root, rootPendingIntent);

        // 1. Read cached JSON first
        String cached = WidgetUpdateHelper.getCachedJson(context, "server_status");
        if (cached != null && !cached.isEmpty()) {
            try {
                applyServerStatus(views, new JSONObject(cached));
            } catch (Exception ignored) {}
        } else {
            views.setTextViewText(R.id.widget_srv_cpu, "--");
            views.setTextViewText(R.id.widget_srv_ram, "--");
            views.setTextViewText(R.id.widget_srv_temp, "--");
            views.setTextViewText(R.id.widget_srv_uptime, "--");
            views.setTextViewText(R.id.widget_srv_status_badge, "⚪ Unknown");
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);

        // 2. Fetch live metrics from server
        Executors.newSingleThreadExecutor().execute(() -> {
            String serverUrl = WidgetUpdateHelper.getServerUrl(context);
            JSONObject parsed = null;

            // Try primary endpoint
            try {
                URL url = new URL(serverUrl + "/api/widgets/server-status");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(3500);
                conn.setReadTimeout(3500);
                if (conn.getResponseCode() == 200) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) sb.append(line);
                    reader.close();
                    parsed = new JSONObject(sb.toString());
                }
                conn.disconnect();
            } catch (Exception ignored) {}

            // If primary failed/404, fallback to /api/system/stats
            if (parsed == null) {
                try {
                    URL url = new URL(serverUrl + "/api/system/stats");
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setConnectTimeout(3500);
                    conn.setReadTimeout(3500);
                    if (conn.getResponseCode() == 200) {
                        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                        StringBuilder sb = new StringBuilder();
                        String line;
                        while ((line = reader.readLine()) != null) sb.append(line);
                        reader.close();

                        JSONObject sysStats = new JSONObject(sb.toString());
                        parsed = new JSONObject();
                        if (sysStats.has("cpu")) {
                            parsed.put("cpu", sysStats.getJSONObject("cpu").optInt("usagePercent", 0));
                        }
                        if (sysStats.has("memory")) {
                            parsed.put("ram", sysStats.getJSONObject("memory").optInt("percent", 0));
                        }
                        if (sysStats.has("system")) {
                            JSONObject sys = sysStats.getJSONObject("system");
                            parsed.put("uptimeFormatted", sys.optString("uptimeFormatted", "--"));
                            parsed.put("temperature", sys.optString("temperature", "--"));
                        }
                        parsed.put("status", "online");
                    }
                    conn.disconnect();
                } catch (Exception ignored) {}
            }

            if (parsed != null) {
                final JSONObject finalJson = parsed;
                WidgetUpdateHelper.setCachedJson(context, "server_status", finalJson.toString());
                new Handler(Looper.getMainLooper()).post(() -> {
                    applyServerStatus(views, finalJson);
                    appWidgetManager.updateAppWidget(appWidgetId, views);
                });
            }
        });
    }

    private static void applyServerStatus(RemoteViews views, JSONObject json) {
        final String cpu = json.has("cpu") && !json.isNull("cpu") ? (json.optInt("cpu") + "%") : "--";
        final String ram = json.has("ram") && !json.isNull("ram") ? (json.optInt("ram") + "%") : "--";
        final String temp = json.has("temperature") && !json.isNull("temperature") 
                ? json.optString("temperature", "--") : "--";
        final String uptime = json.optString("uptimeFormatted", "--");
        final String status = json.optString("status", "online");

        views.setTextViewText(R.id.widget_srv_cpu, cpu);
        views.setTextViewText(R.id.widget_srv_ram, ram);
        views.setTextViewText(R.id.widget_srv_temp, temp);
        views.setTextViewText(R.id.widget_srv_uptime, uptime);

        if ("online".equalsIgnoreCase(status)) {
            views.setTextViewText(R.id.widget_srv_status_badge, "🟢 Online");
            views.setImageViewResource(R.id.widget_srv_dot, R.drawable.widget_status_online);
        } else if ("warning".equalsIgnoreCase(status) || "degraded".equalsIgnoreCase(status)) {
            views.setTextViewText(R.id.widget_srv_status_badge, "🟡 Warning");
            views.setImageViewResource(R.id.widget_srv_dot, R.drawable.widget_status_warning);
        } else if ("offline".equalsIgnoreCase(status)) {
            views.setTextViewText(R.id.widget_srv_status_badge, "🔴 Offline");
            views.setImageViewResource(R.id.widget_srv_dot, R.drawable.widget_status_offline);
        } else {
            views.setTextViewText(R.id.widget_srv_status_badge, "⚪ Unknown");
            views.setImageViewResource(R.id.widget_srv_dot, R.drawable.widget_status_warning);
        }
    }
}
