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

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_single_service);

        // Header click opens NexusPanel
        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent rootPendingIntent = PendingIntent.getActivity(
                context, 500 + appWidgetId, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_single_status_badge, rootPendingIntent);

        String cached = WidgetUpdateHelper.getCachedJson(context, "single_service");
        if (cached != null && !cached.isEmpty()) {
            try {
                applySingleService(context, views, appWidgetId, new JSONObject(cached));
            } catch (Exception ignored) {}
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);

        Executors.newSingleThreadExecutor().execute(() -> {
            String serverUrl = WidgetUpdateHelper.getServerUrl(context);
            try {
                URL url = new URL(serverUrl + "/api/widgets/service-monitor");
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
        final String name = json.optString("name", "Brak usług");
        final String ip = json.optString("ip", "127.0.0.1");
        final String svcUrl = json.optString("url", "");
        final String status = json.optString("status", "online");
        final String uptime = json.optString("uptimeFormatted", "0m");
        final int latency = json.optInt("latencyMs", 0);

        views.setTextViewText(R.id.widget_single_name, name);
        views.setTextViewText(R.id.widget_single_ip, ip);
        views.setTextViewText(R.id.widget_single_uptime, uptime);
        views.setTextViewText(R.id.widget_single_latency, latency + " ms");

        String mono = name.length() >= 2 ? name.substring(0, 2).toUpperCase() : name.toUpperCase();
        views.setTextViewText(R.id.widget_single_icon, mono);

        if ("offline".equalsIgnoreCase(status)) {
            views.setTextViewText(R.id.widget_single_status_badge, "🔴 Offline");
        } else if ("degraded".equalsIgnoreCase(status)) {
            views.setTextViewText(R.id.widget_single_status_badge, "🟡 Warning");
        } else {
            views.setTextViewText(R.id.widget_single_status_badge, "🟢 Online");
        }

        // Open service URL in browser directly!
        WidgetUpdateHelper.setBrowserPendingIntent(context, views, R.id.widget_single_root, svcUrl, (appWidgetId * 100) + 50);
    }
}
