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

public class SingleServiceWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_single_service);

        // Header click opens NexusPanel
        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent rootPendingIntent = PendingIntent.getActivity(
                context, 500 + appWidgetId, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_single_status_badge, rootPendingIntent);

        // 1. Read cached single_service JSON from SharedPreferences (synced from in-app Studio Widżetów)
        String cachedJson = WidgetUpdateHelper.getCachedJson(context, "single_service");
        int targetServiceId = 0;
        if (cachedJson != null && !cachedJson.isEmpty()) {
            try {
                JSONObject json = new JSONObject(cachedJson);
                targetServiceId = json.optInt("id", 0);
                applySingleService(context, views, appWidgetId, json);
            } catch (Exception ignored) {}
        } else {
            views.setTextViewText(R.id.widget_single_name, "Wybierz usługę w aplikacji");
            views.setTextViewText(R.id.widget_single_ip, "--");
            views.setTextViewText(R.id.widget_single_icon, "NP");
            views.setTextViewText(R.id.widget_single_status_badge, "⚪ Unknown");
            views.setTextViewText(R.id.widget_single_uptime, "--");
            views.setTextViewText(R.id.widget_single_latency, "--");
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);

        final int fetchId = targetServiceId;

        // 2. Fetch live metrics in background
        Executors.newSingleThreadExecutor().execute(() -> {
            String serverUrl = WidgetUpdateHelper.getServerUrl(context);
            String endpoint = fetchId > 0 
                    ? (serverUrl + "/api/widgets/service-monitor/" + fetchId)
                    : (serverUrl + "/api/widgets/service-monitor");

            try {
                URL url = new URL(endpoint);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(4000);
                conn.setReadTimeout(4000);
                if (conn.getResponseCode() == 200) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) sb.append(line);
                    reader.close();

                    String raw = sb.toString();
                    WidgetUpdateHelper.setCachedJson(context, "single_service", raw);
                    JSONObject json = new JSONObject(raw);

                    new Handler(Looper.getMainLooper()).post(() -> {
                        applySingleService(context, views, appWidgetId, json);
                        appWidgetManager.updateAppWidget(appWidgetId, views);
                    });
                }
                conn.disconnect();
            } catch (Exception ignored) {}
        });
    }

    private static void applySingleService(Context context, RemoteViews views, int appWidgetId, JSONObject json) {
        final String name = json.optString("name", "Usługa");
        final String ip = json.optString("ip", "--");
        final String svcUrl = json.optString("url", "");
        final String status = json.optString("status", json.optString("health_status", "unknown"));
        final String uptime = json.optString("uptimeFormatted", "--");
        final boolean hasLatency = json.has("latencyMs") && !json.isNull("latencyMs");
        final String latency = hasLatency ? (json.optInt("latencyMs") + " ms") : "--";

        final String icon = json.optString("icon", "globe");
        final String color = json.optString("color", "#6366F1");

        views.setTextViewText(R.id.widget_single_name, name);
        views.setTextViewText(R.id.widget_single_ip, ip);
        views.setImageViewBitmap(R.id.widget_single_icon, WidgetUpdateHelper.getServiceIconBitmap(context, name, icon, color));
        views.setTextViewText(R.id.widget_single_uptime, uptime);
        views.setTextViewText(R.id.widget_single_latency, latency);

        if ("online".equalsIgnoreCase(status)) {
            views.setTextViewText(R.id.widget_single_status_badge, "🟢 Online");
        } else if ("degraded".equalsIgnoreCase(status) || "warning".equalsIgnoreCase(status)) {
            views.setTextViewText(R.id.widget_single_status_badge, "🟡 Warning");
        } else if ("offline".equalsIgnoreCase(status)) {
            views.setTextViewText(R.id.widget_single_status_badge, "🔴 Offline");
        } else {
            views.setTextViewText(R.id.widget_single_status_badge, "⚪ Unknown");
        }

        // Set direct browser click on the entire card
        WidgetUpdateHelper.setBrowserPendingIntent(context, views, R.id.widget_single_root, svcUrl, (appWidgetId * 100) + 50);
    }
}
